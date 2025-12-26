# 双Token认证系统 Demo

这是一个完整的双Token（Access Token + Refresh Token）认证系统演示项目，包含前端界面和后端实现指南。

## 目录

- [系统概述](#系统概述)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [核心功能](#核心功能)
- [快速开始](#快速开始)
- [双Token认证机制](#双token认证机制)
- [API接口文档](#api接口文档)
- [后端实现](#后端实现)
- [安全最佳实践](#安全最佳实践)
- [部署指南](#部署指南)
- [常见问题](#常见问题)

---

## 系统概述

本项目实现了一个现代化的双Token认证系统，采用前后端分离架构：

- **前端**：React + Vite + TypeScript + React Router
- **后端**：Node.js + Express（需自行实现）
- **认证方式**：JWT双Token机制（Access Token + Refresh Token）

### 为什么使用双Token？

- **Access Token**：短期有效（15分钟），用于API访问授权
- **Refresh Token**：长期有效（7天），用于刷新Access Token
- **优势**：平衡了安全性和用户体验，减少了频繁登录的需求

---

## 技术栈

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2 | UI框架 |
| Vite | 6.0 | 构建工具 |
| TypeScript | 5.x | 类型安全 |
| React Router | 7.11 | 路由管理 |
| Tailwind CSS | 4.1 | 样式框架 |
| Radix UI | - | 无障碍UI组件 |
| Lucide React | - | 图标库 |

### 后端技术（推荐）

| 技术 | 用途 |
|------|------|
| Express.js | Web框架 |
| jsonwebtoken | JWT生成和验证 |
| bcryptjs | 密码加密 |
| nodemailer | 邮件发送 |
| MySQL/PostgreSQL | 数据库 |

---

## 项目结构

```
dual-token-auth-demo/
├── src/
│   ├── components/              # 组件目录
│   │   ├── ui/                  # 基础UI组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── login-form.tsx       # 登录表单
│   │   ├── register-form.tsx    # 注册表单
│   │   └── forgot-password-form.tsx  # 忘记密码表单
│   ├── pages/                   # 页面组件
│   │   ├── Login.tsx            # 登录页
│   │   ├── Register.tsx         # 注册页
│   │   ├── ForgotPassword.tsx   # 忘记密码页
│   │   └── Dashboard.tsx        # 控制面板
│   ├── lib/                     # 工具函数
│   │   └── utils.ts             # 通用工具
│   ├── styles/                  # 样式文件
│   │   └── globals.css          # 全局样式
│   ├── App.tsx                  # 路由配置
│   └── main.tsx                 # 应用入口
├── EXPRESS_BACKEND_GUIDE.md     # 后端实现指南（登录/Token）
├── EXPRESS_REGISTER_RESET_GUIDE.md  # 后端实现指南（注册/重置）
├── vite.config.ts               # Vite配置
├── tsconfig.json                # TypeScript配置
└── package.json                 # 依赖配置
```

---

## 核心功能

### 用户认证

- ✅ **用户登录**：邮箱+密码登录，返回双Token
- ✅ **用户注册**：用户名、邮箱、密码注册
- ✅ **忘记密码**：通过邮箱接收重置链接
- ✅ **密码重置**：使用Token重置密码
- ✅ **自动登出**：Token过期自动跳转登录页

### Token管理

- ✅ **双Token机制**：Access Token（短期）+ Refresh Token（长期）
- ✅ **自动刷新**：Access Token过期前自动刷新
- ✅ **Token验证**：访问保护路由前验证Token有效性
- ✅ **安全存储**：sessionStorage存储Access Token，localStorage存储Refresh Token

### 用户界面

- ✅ **响应式设计**：适配桌面和移动设备
- ✅ **深色主题**：现代化的深色配色方案
- ✅ **表单验证**：实时输入验证和错误提示
- ✅ **加载状态**：操作过程中的加载反馈
- ✅ **路由保护**：未登录自动重定向到登录页

---

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd dual-token-auth-demo
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# 后端API地址
VITE_API_URL=http://localhost:3001
```

### 4. 启动开发服务器

```bash
npm run dev
```

前端应用将在 http://localhost:5173 启动

### 5. 构建生产版本

```bash
npm run build
npm run preview
```

---

## 双Token认证机制

### 工作流程

```
┌─────────────┐                    ┌─────────────┐
│   用户登录   │                    │  后端服务器  │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  1. POST /api/auth/login        │
       │  { email, password }             │
       ├─────────────────────────────────>│
       │                                  │
       │  2. 返回双Token                  │
       │  { accessToken, refreshToken }   │
       │<─────────────────────────────────┤
       │                                  │
       │  3. 使用Access Token访问API      │
       │  Authorization: Bearer <token>   │
       ├─────────────────────────────────>│
       │                                  │
       │  4. Token验证通过，返回数据      │
       │<─────────────────────────────────┤
       │                                  │
       │  5. Access Token过期             │
       │  POST /api/auth/refresh          │
       │  { refreshToken }                │
       ├─────────────────────────────────>│
       │                                  │
       │  6. 返回新的Access Token         │
       │  { accessToken }                 │
       │<─────────────────────────────────┤
       │                                  │
```

### Token生命周期

| Token类型 | 有效期 | 存储位置 | 用途 |
|-----------|--------|----------|------|
| Access Token | 15分钟 | sessionStorage | API访问授权 |
| Refresh Token | 7天 | localStorage | 刷新Access Token |

### 自动刷新机制

前端在以下情况会自动刷新Token：

1. **API返回401**：Access Token过期时自动调用刷新接口
2. **定时检查**：定期检查Token过期时间
3. **页面加载**：应用启动时验证Token有效性

---

## API接口文档

### 基础信息

- **Base URL**: `http://localhost:3001/api`
- **Content-Type**: `application/json`
- **Authorization**: `Bearer {accessToken}`

### 1. 用户登录

```http
POST /api/auth/login
```

**请求参数：**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应示例：**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "testuser"
  }
}
```

### 2. 用户注册

```http
POST /api/auth/register
```

**请求参数：**

```json
{
  "username": "testuser",
  "email": "user@example.com",
  "password": "password123"
}
```

**响应示例：**

```json
{
  "message": "注册成功",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "user@example.com"
  }
}
```

### 3. Token刷新

```http
POST /api/auth/refresh
```

**请求参数：**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应示例：**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. 验证Token

```http
GET /api/auth/verify
Authorization: Bearer {accessToken}
```

**响应示例：**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "testuser"
  }
}
```

### 5. 用户登出

```http
POST /api/auth/logout
```

**请求参数：**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应示例：**

```json
{
  "message": "登出成功"
}
```

### 6. 忘记密码

```http
POST /api/auth/forgot-password
```

**请求参数：**

```json
{
  "email": "user@example.com"
}
```

**响应示例：**

```json
{
  "message": "密码重置链接已发送到您的邮箱"
}
```

### 7. 重置密码

```http
POST /api/auth/reset-password
```

**请求参数：**

```json
{
  "token": "reset-token-from-email",
  "newPassword": "newPassword123"
}
```

**响应示例：**

```json
{
  "message": "密码重置成功，请使用新密码登录"
}
```

---

## 后端实现

### 快速开始

项目包含两份详细的后端实现指南：

1. **`EXPRESS_BACKEND_GUIDE.md`**
   - JWT Token生成和验证
   - 登录/登出实现
   - Token刷新机制
   - 中间件配置
   - 数据库Schema设计

2. **`EXPRESS_REGISTER_RESET_GUIDE.md`**
   - 用户注册实现
   - 密码加密（bcrypt）
   - 忘记密码流程
   - 邮件发送配置
   - 密码重置Token管理

### 后端依赖安装

```bash
# 创建后端项目
mkdir backend && cd backend
npm init -y

# 安装依赖
npm install express jsonwebtoken bcryptjs dotenv cors
npm install nodemailer mysql2
npm install --save-dev @types/express @types/jsonwebtoken @types/bcryptjs
```

### 环境变量配置

创建 `backend/.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# JWT密钥（请使用强随机字符串）
ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-min-32-chars
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-min-32-chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# 数据库配置
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=auth_system

# 邮件配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# 前端URL
FRONTEND_URL=http://localhost:5173
```

### 数据库Schema

```sql
-- 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Refresh Token表
CREATE TABLE refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token TEXT NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 密码重置Token表
CREATE TABLE password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 安全最佳实践

### 1. Token安全

- ✅ **强密钥**：使用至少32字符的随机字符串作为JWT密钥
- ✅ **短期有效**：Access Token设置短期有效期（15分钟）
- ✅ **安全存储**：避免将Token存储在localStorage（XSS风险）
- ✅ **HTTPS传输**：生产环境必须使用HTTPS
- ✅ **Token轮换**：实现Refresh Token轮换机制

### 2. 密码安全

- ✅ **强度验证**：要求至少8个字符，包含字母和数字
- ✅ **bcrypt加密**：使用bcrypt进行密码哈希（12轮）
- ✅ **防暴力破解**：实施登录失败次数限制
- ✅ **密码重置**：通过邮件验证身份

### 3. API安全

- ✅ **CORS配置**：正确配置允许的源
- ✅ **速率限制**：防止暴力破解和DDoS攻击
- ✅ **输入验证**：严格验证所有用户输入
- ✅ **SQL注入防护**：使用参数化查询
- ✅ **CSRF保护**：使用CSRF Token

### 4. 前端安全

- ✅ **XSS防护**：React自动转义输出
- ✅ **敏感信息**：不在前端代码中硬编码密钥
- ✅ **路由保护**：未授权访问自动重定向
- ✅ **错误处理**：不暴露敏感错误信息

---

## 部署指南

### 前端部署

#### Vercel部署（推荐）

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel
```

#### 静态网站托管

```bash
# 构建
npm run build

# dist目录上传到托管服务
# Netlify / Vercel / GitHub Pages
```

### 后端部署

#### 使用PM2（生产环境）

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "auth-backend"

# 保存配置
pm2 save

# 开机自启
pm2 startup
```

#### Docker部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

```bash
# 构建镜像
docker build -t auth-backend .

# 运行容器
docker run -p 3001:3001 --env-file .env auth-backend
```

### 环境变量配置

确保在生产环境中设置所有必需的环境变量：

- JWT密钥（强随机字符串）
- 数据库连接信息
- 邮件服务配置
- CORS允许的源

---

## 常见问题

### Q1: Token刷新失败怎么办？

**A**: 检查以下几点：
- Refresh Token是否过期（7天）
- 后端Refresh Token是否被撤销
- JWT密钥是否配置正确
- 数据库中是否存在该Token记录

### Q2: 如何测试双Token机制？

**A**: 可以使用以下工具：
- **Postman**：测试API接口
- **jwt.io**：解码和验证JWT Token
- **浏览器开发者工具**：查看sessionStorage和localStorage

### Q3: 为什么登录后立即跳转到登录页？

**A**: 可能的原因：
- Access Token验证失败
- 后端返回的Token格式不正确
- Token存储失败
- 检查浏览器控制台的错误信息

### Q4: 如何实现"记住我"功能？

**A**: 修改Token存储策略：
- 勾选"记住我"：将Access Token也存储到localStorage
- 未勾选：使用sessionStorage（关闭浏览器后清除）

### Q5: 生产环境如何保护Token？

**A**: 最佳实践：
- 使用HttpOnly Cookie存储Refresh Token
- 使用内存或sessionStorage存储Access Token
- 启用HTTPS和CSRF保护
- 实施Token轮换机制

### Q6: 如何添加OAuth登录（Google/GitHub）？

**A**: 需要集成第三方OAuth库：
- 安装passport或next-auth
- 配置OAuth应用
- 实现OAuth回调处理
- 将OAuth用户映射到本地用户

### Q7: 忘记密码邮件发送失败？

**A**: 检查以下配置：
- 邮件服务器地址和端口
- 邮箱账号和应用专用密码（不是登录密码）
- Gmail需要启用"允许不够安全的应用"或使用应用专用密码
- 查看后端日志获取详细错误信息

---

## 开发团队

如需帮助或发现问题，请：

1. 查看项目文档（本README和后端实现指南）
2. 检查浏览器控制台和后端日志
3. 提交Issue到项目仓库

---

## 许可证

MIT License

---

## 更新日志

### v1.0.0 (2025-01-XX)

- ✅ 初始版本发布
- ✅ 实现双Token认证机制
- ✅ 完整的用户注册/登录/登出
- ✅ 忘记密码和密码重置功能
- ✅ 响应式UI设计
- ✅ 详细的后端实现文档

---

**祝您使用愉快！如有问题，请参考后端实现指南或提交Issue。**
