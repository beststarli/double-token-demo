# Express后端实现指南

这份指南将帮助你在Express中实现完整的双Token认证系统。

## 必需的依赖包

```bash
npm install express jsonwebtoken bcryptjs dotenv
npm install --save-dev @types/express @types/jsonwebtoken @types/bcryptjs
```

## 环境变量配置 (.env)

```
ACCESS_TOKEN_SECRET=your_access_token_secret_here_min_32_chars
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here_min_32_chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

## Express服务器基础结构

### 1. 主服务器文件 (server.js)

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
```

### 2. 认证路由 (routes/auth.js)

```javascript
const express = require('express');
const router = express.Router();
const {
  login,
  refresh,
  verify,
  logout
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/refresh', refresh);
router.get('/verify', authenticateToken, verify);
router.post('/logout', logout);

module.exports = router;
```

### 3. 认证控制器 (controllers/authController.js)

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const db = require('../db'); // 你的数据库连接

// 登录
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({ message: '邮箱和密码不能为空' });
    }

    // 从数据库查询用户
    // const user = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    // 演示用的模拟用户
    const user = {
      id: 1,
      email: email,
      password: await bcrypt.hash('password123', 10) // 实际应从数据库获取
    };

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 生成tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

    // 将refresh token存储到数据库
    // await db.query(
    //   'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    //   [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    // );

    res.json({
      accessToken,
      refreshToken,
      user: {
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 刷新token
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: '未提供refresh token' });
    }

    // 验证refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Refresh token无效或已过期' });
    }

    // 检查数据库中是否存在该refresh token
    // const tokenExists = await db.query(
    //   'SELECT * FROM refresh_tokens WHERE token = ? AND revoked = false',
    //   [refreshToken]
    // );
    
    // if (!tokenExists) {
    //   return res.status(401).json({ message: 'Refresh token已被撤销' });
    // }

    // 生成新的access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    // 可选：轮换refresh token
    // const newRefreshToken = jwt.sign(
    //   { userId: decoded.userId, email: decoded.email },
    //   process.env.REFRESH_TOKEN_SECRET,
    //   { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    // );

    // 撤销旧的refresh token并存储新的
    // await db.query('UPDATE refresh_tokens SET revoked = true WHERE token = ?', [refreshToken]);
    // await db.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    //   [decoded.userId, newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    // );

    res.json({
      accessToken: newAccessToken,
      // refreshToken: newRefreshToken // 如果使用token轮换
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Token刷新失败' });
  }
};

// 验证token
exports.verify = async (req, res) => {
  // authenticateToken中间件已经验证了token
  res.json({
    user: {
      email: req.user.email
    }
  });
};

// 登出
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // 将refresh token加入黑名单
      // await db.query(
      //   'UPDATE refresh_tokens SET revoked = true WHERE token = ?',
      //   [refreshToken]
      // );
    }

    res.json({ message: '登出成功' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: '登出失败' });
  }
};
```

### 4. 认证中间件 (middleware/authMiddleware.js)

```javascript
const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: '未提供认证token' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Access token已过期' });
      }
      return res.status(403).json({ message: 'Token无效' });
    }

    req.user = user;
    next();
  });
};
```

## 数据库Schema建议 (MySQL/PostgreSQL)

### users表

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### refresh_tokens表

```sql
CREATE TABLE refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token TEXT NOT NULL,
  revoked BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_token ON refresh_tokens(token(255));
CREATE INDEX idx_user_id ON refresh_tokens(user_id);
```

## 安全最佳实践

1. **Token存储**
   - Access Token: 存储在内存或sessionStorage（不要存localStorage）
   - Refresh Token: 优先使用httpOnly cookie，次选安全存储

2. **Token过期时间**
   - Access Token: 15分钟
   - Refresh Token: 7天

3. **密码安全**
   - 使用bcrypt进行密码哈希
   - 盐值rounds建议为10-12

4. **HTTPS**
   - 生产环境必须使用HTTPS
   - 使用CORS正确配置允许的源

5. **Token刷新策略**
   - 实现自动刷新机制
   - 考虑实现refresh token轮换

6. **黑名单机制**
   - 维护refresh token黑名单
   - 使用Redis缓存提高性能

## 与Next.js前端集成

前端代码已经预留了所有接口调用，你只需要：

1. 启动Express服务器（默认端口3001）
2. 确保Next.js应用能够访问Express服务器
3. 如需要，在next.config.mjs中配置API代理：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:3001/api/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
```

## 测试Token流程

使用curl或Postman测试：

```bash
# 登录
curl -X POST http://localhost:3001/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password123"}'

# 验证access token
curl -X GET http://localhost:3001/api/auth/verify \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 刷新token
curl -X POST http://localhost:3001/api/auth/refresh \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'

# 登出
curl -X POST http://localhost:3001/api/auth/logout \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

# Express后端实现指南 - 注册与密码重置

本文档提供Express后端实现用户注册和密码重置功能的完整指南。

## 目录

1. [环境准备](#环境准备)
2. [数据库Schema](#数据库schema)
3. [用户注册实现](#用户注册实现)
4. [忘记密码实现](#忘记密码实现)
5. [密码重置实现](#密码重置实现)
6. [邮件发送配置](#邮件发送配置)
7. [完整代码示例](#完整代码示例)

---

## 环境准备

### 安装必要依赖

```bash
npm install express bcryptjs jsonwebtoken dotenv
npm install nodemailer   # 用于发送邮件
npm install crypto       # 内置模块，用于生成重置令牌
npm install --save-dev @types/express @types/bcryptjs @types/jsonwebtoken @types/nodemailer
```

### 环境变量配置 (.env)

```env
# 数据库配置
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=auth_system

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# 邮件配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-app-password
EMAIL_FROM=noreply@yourdomain.com

# 前端URL（用于重置密码链接）
FRONTEND_URL=http://localhost:3000

# 服务器配置
PORT=3001
```

---

## 数据库Schema

### 用户表 (users)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  INDEX idx_email (email),
  INDEX idx_username (username)
);
```

### 刷新Token表 (refresh_tokens)

```sql
CREATE TABLE refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
);
```

### 密码重置Token表 (password_reset_tokens)

```sql
CREATE TABLE password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
);
```

---

## 用户注册实现

### 注册路由 (routes/auth.js)

```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/database');

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 1. 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: '请提供完整的注册信息' 
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: '邮箱格式不正确' 
      });
    }

    // 验证密码强度
    if (password.length < 8) {
      return res.status(400).json({ 
        message: '密码长度至少为8个字符' 
      });
    }

    // 2. 检查用户是否已存在
    const checkUserQuery = 'SELECT id FROM users WHERE email = ? OR username = ?';
    const [existingUsers] = await db.query(checkUserQuery, [email, username]);

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        message: '用户名或邮箱已被使用' 
      });
    }

    // 3. 密码加密
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. 创建用户
    const insertQuery = `
      INSERT INTO users (username, email, password_hash) 
      VALUES (?, ?, ?)
    `;
    const [result] = await db.query(insertQuery, [username, email, passwordHash]);

    // 5. 返回成功响应（不包含密码）
    res.status(201).json({
      message: '注册成功',
      user: {
        id: result.insertId,
        username,
        email
      }
    });

    // 可选：发送验证邮件
    // await sendVerificationEmail(email, result.insertId);

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ 
      message: '服务器错误，请稍后重试' 
    });
  }
});

module.exports = router;
```

---

## 忘记密码实现

### 生成重置Token

```javascript
const crypto = require('crypto');

/**
 * POST /api/auth/forgot-password
 * 请求密码重置
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // 1. 验证输入
    if (!email) {
      return res.status(400).json({ 
        message: '请提供邮箱地址' 
      });
    }

    // 2. 查找用户
    const userQuery = 'SELECT id, email, username FROM users WHERE email = ?';
    const [users] = await db.query(userQuery, [email]);

    // 安全考虑：即使用户不存在也返回成功，防止邮箱枚举攻击
    if (users.length === 0) {
      return res.status(200).json({ 
        message: '如果该邮箱存在，重置链接已发送' 
      });
    }

    const user = users[0];

    // 3. 生成安全的重置token（32字节随机字符串）
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // 4. 设置过期时间（1小时）
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

    // 5. 删除该用户之前的重置token
    await db.query(
      'DELETE FROM password_reset_tokens WHERE user_id = ?',
      [user.id]
    );

    // 6. 保存新的重置token
    const insertTokenQuery = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at) 
      VALUES (?, ?, ?)
    `;
    await db.query(insertTokenQuery, [user.id, hashedToken, expiresAt]);

    // 7. 发送重置邮件
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, user.username, resetUrl);

    res.status(200).json({ 
      message: '密码重置链接已发送到您的邮箱',
      // 开发环境可以返回token用于测试（生产环境删除）
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    console.error('忘记密码错误:', error);
    res.status(500).json({ 
      message: '服务器错误，请稍后重试' 
    });
  }
});
```

---

## 密码重置实现

```javascript
/**
 * POST /api/auth/reset-password
 * 重置密码
 */
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // 1. 验证输入
    if (!token || !newPassword) {
      return res.status(400).json({ 
        message: '请提供重置令牌和新密码' 
      });
    }

    // 验证新密码强度
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: '密码长度至少为8个字符' 
      });
    }

    // 2. 哈希token进行查找
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 3. 查找有效的重置token
    const tokenQuery = `
      SELECT user_id, expires_at, used 
      FROM password_reset_tokens 
      WHERE token = ?
    `;
    const [tokens] = await db.query(tokenQuery, [hashedToken]);

    if (tokens.length === 0) {
      return res.status(400).json({ 
        message: '无效的重置令牌' 
      });
    }

    const resetTokenData = tokens[0];

    // 4. 验证token是否已使用
    if (resetTokenData.used) {
      return res.status(400).json({ 
        message: '该重置令牌已被使用' 
      });
    }

    // 5. 验证token是否过期
    if (new Date() > new Date(resetTokenData.expires_at)) {
      return res.status(400).json({ 
        message: '重置令牌已过期，请重新申请' 
      });
    }

    // 6. 加密新密码
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 7. 更新用户密码
    await db.query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [newPasswordHash, resetTokenData.user_id]
    );

    // 8. 标记token为已使用
    await db.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
      [hashedToken]
    );

    // 9. 删除该用户的所有刷新token（强制重新登录）
    await db.query(
      'DELETE FROM refresh_tokens WHERE user_id = ?',
      [resetTokenData.user_id]
    );

    res.status(200).json({ 
      message: '密码重置成功，请使用新密码登录' 
    });

  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({ 
      message: '服务器错误，请稍后重试' 
    });
  }
});
```

---

## 邮件发送配置

### 邮件服务配置 (utils/emailService.js)

```javascript
const nodemailer = require('nodemailer');

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * 发送密码重置邮件
 */
async function sendPasswordResetEmail(email, username, resetUrl) {
  const mailOptions = {
    from: `"认证系统" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: '密码重置请求',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; 
                    color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; 
                    font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>密码重置请求</h1>
          </div>
          <div class="content">
            <p>您好，${username}！</p>
            <p>我们收到了您的密码重置请求。请点击下方按钮重置您的密码：</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">重置密码</a>
            </div>
            <p>或者复制以下链接到浏览器：</p>
            <p style="background: white; padding: 10px; border-radius: 4px; word-break: break-all;">
              ${resetUrl}
            </p>
            <p><strong>重要提示：</strong></p>
            <ul>
              <li>此链接将在 <strong>1小时</strong> 后失效</li>
              <li>如果您没有请求重置密码，请忽略此邮件</li>
              <li>出于安全考虑，请勿将此链接分享给他人</li>
            </ul>
            <div class="footer">
              <p>此邮件由系统自动发送，请勿回复。</p>
              <p>© 2025 双Token认证系统. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`密码重置邮件已发送至: ${email}`);
  } catch (error) {
    console.error('邮件发送失败:', error);
    throw new Error('邮件发送失败');
  }
}

/**
 * 发送欢迎邮件（注册成功）
 */
async function sendWelcomeEmail(email, username) {
  const mailOptions = {
    from: `"认证系统" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: '欢迎注册！',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>欢迎加入！</h1>
          </div>
          <div class="content">
            <p>您好，${username}！</p>
            <p>感谢您注册双Token认证系统。您的账户已成功创建。</p>
            <p>您现在可以使用注册的邮箱和密码登录系统。</p>
            <p>祝您使用愉快！</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`欢迎邮件已发送至: ${email}`);
  } catch (error) {
    console.error('欢迎邮件发送失败:', error);
    // 注册成功但邮件发送失败不应该影响注册流程
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
```

---

## 完整代码示例

### Express服务器入口 (server.js)

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('错误:', err.stack);
  res.status(500).json({ 
    message: '服务器内部错误' 
  });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
```

### 数据库连接 (config/database.js)

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

---

## 安全建议

### 1. 密码安全
- 使用bcrypt加密密码，设置合理的salt轮数（建议12轮）
- 实施密码强度验证（长度、复杂度）
- 永远不要在日志或响应中暴露密码

### 2. Token安全
- 重置token使用加密存储（SHA-256哈希）
- 设置合理的过期时间（建议1小时）
- Token只能使用一次，使用后立即标记
- 防止token枚举攻击

### 3. 邮件安全
- 使用环境变量保护邮件凭据
- 使用应用专用密码而非主密码
- 实施邮件发送频率限制
- 验证邮件地址格式

### 4. API安全
- 实施速率限制（防止暴力破解）
- 使用HTTPS加密传输
- 防止邮箱枚举攻击（统一返回消息）
- 添加CSRF保护

### 5. 数据库安全
- 使用参数化查询防止SQL注入
- 设置适当的索引提高查询性能
- 定期清理过期token
- 实施数据库访问权限控制

---

## 测试建议

### 使用Postman测试

**1. 测试注册**
```
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

**2. 测试忘记密码**
```
POST http://localhost:3001/api/auth/forgot-password
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**3. 测试重置密码**
```
POST http://localhost:3001/api/auth/reset-password
Content-Type: application/json

{
  "token": "从邮件中获取的token",
  "newPassword": "NewSecurePass123!"
}
```

---

## 下一步

1. 实施速率限制（使用express-rate-limit）
2. 添加邮箱验证功能
3. 实施账户锁定机制（多次失败登录后）
4. 添加日志记录系统
5. 部署到生产环境前的安全审计

完整的双Token认证系统现已准备就绪！
