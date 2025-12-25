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
