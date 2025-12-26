/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

// PostgreSQL 连接池配置（从环境变量读取）
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'double_token',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',

    // 可选：SSL 配置（生产环境启用）
    // ssl: { rejectUnauthorized: false },
})

// 错误处理：连接失败时抛出
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
})

// 简单的内存存储，用于演示 refresh token 的存储/撤销
const refreshTokenStore = new Set<string>()

export async function hello(req: Request, res: Response) {
    res.json({ message: 'Hello from authController' });
}

export async function testDb(req: Request, res: Response) {
    const client = await pool.connect();  // 获取连接
    try {
        // 简单查询：测试连接 + 检查表是否存在
        const result = await client.query('SELECT NOW() AS current_time, version() AS pg_version;');
        res.json({
            message: '数据库连接成功！',
            data: result.rows[0],  // 返回当前时间和 PG 版本
            tables: 'users 和 refresh_tokens 表已就绪'  // 可选：额外查表
        });
    } catch (error) {
        console.error('数据库连接测试失败:', error);
        res.status(500).json({ message: '数据库连接失败', error: (error as Error).message });
    } finally {
        client.release();
    }
}

export async function login(req: Request, res: Response) {

    const client = await pool.connect();  // 获取连接

    try {
        const loginBody = (req.body && Object.keys(req.body).length ? req.body : req.query) as any;
        const { email, password } = loginBody;

        if (!email || !password) {
            return res.status(400).json({ message: '邮箱和密码不能为空' });
        }

        // 从 PostgreSQL 查询用户（参数化查询防 SQL 注入）
        const userQuery = await client.query('SELECT * FROM users WHERE email = $1', [email])
        const user = userQuery.rows[0]

        if (!user) {
            return res.status(401).json({ message: '邮箱或密码错误' });
        }

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: '邮箱或密码错误' });
        }

        // // 演示用的模拟用户
        // const user = {
        //     id: 1,
        //     email: email,
        //     password: await bcrypt.hash('password123', 10) // 实际应从数据库获取
        // };

        // // 验证密码
        // const isValidPassword = await bcrypt.compare(password, user.password);
        // if (!isValidPassword) {
        //     return res.status(401).json({ message: '邮箱或密码错误' });
        // }

        // // 演示用途：假设数据库中用户密码为 'password123'
        // const demoHash = await bcrypt.hash('password123', 10);
        // const isValidPassword = await bcrypt.compare(password, demoHash);
        // const userId = 1;

        const accessToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.ACCESS_TOKEN_SECRET as string,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.REFRESH_TOKEN_SECRET as string,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
        )

        // 插入 refresh token 到数据库（检查是否已存在旧的）
        // 先删除旧的（可选：每个用户只保留一个活跃 token）
        await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);
        // 插入新的
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);  // 7 天后
        await client.query(
            'INSERT INTO refresh_tokens (user_id, token, revoked, expires_at) VALUES ($1, $2, $3, $4)',
            [user.id, refreshToken, false, expiresAt]
        );

        // 存储 refresh token
        refreshTokenStore.add(refreshToken);

        // 将refresh token存储到数据库
        // await db.query(
        //   'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        //   [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
        // );

        res.json({ accessToken, refreshToken, user: { email: user.email } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: '服务器错误' });
    } finally {
        client.release();  // 释放连接
    }
}

export async function register(req: Request, res: Response) {
    const client = await pool.connect();
    try {
        const body = (req.body && Object.keys(req.body).length ? req.body : req.query) as any;
        const { email, password } = body;
        if (!email || !password) {
            return res.status(400).json({ message: '邮箱和密码不能为空' });
        }

        // 检查用户是否已存在
        const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: '该邮箱已被注册' });
        }

        // 哈希密码并插入用户
        const hashed = await bcrypt.hash(password, 10);
        // 尝试插入 username（若表中没有 username 列，请调整为只插入 email/password）
        const insertResult = await client.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
            [email, hashed]
        );
        const user = insertResult.rows[0];

        // 生成 tokens
        const accessSecret: jwt.Secret = process.env.ACCESS_TOKEN_SECRET as unknown as jwt.Secret;
        const refreshSecret: jwt.Secret = process.env.REFRESH_TOKEN_SECRET as unknown as jwt.Secret
        const accessOptions: jwt.SignOptions = { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' };
        const refreshOptions: jwt.SignOptions = { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' };

        const accessToken = jwt.sign({ userId: user.id, email: user.email }, accessSecret, accessOptions);
        const refreshToken = jwt.sign({ userId: user.id, email: user.email }, refreshSecret, refreshOptions);

        // 保存 refresh token 到数据库
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await client.query(
            'INSERT INTO refresh_tokens (user_id, token, revoked, expires_at) VALUES ($1, $2, $3, $4)',
            [user.id, refreshToken, false, expiresAt]
        );

        res.status(201).json({ accessToken, refreshToken, user: { email: user.email } });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: '注册失败' });
    } finally {
        client.release();
    }
}

export async function refresh(req: Request, res: Response) {

    const client = await pool.connect();

    try {

        const refreshBody = (req.body && Object.keys(req.body).length ? req.body : req.query) as any;
        const { refreshToken } = refreshBody;

        if (!refreshToken) {
            return res.status(401).json({ message: '未提供refresh token' });
        }

        // 查询数据库中 token 是否存在、未撤销且未过期
        const tokenQuery = await client.query(
            'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false AND expires_at > NOW()',
            [refreshToken]
        );
        const tokenRecord = tokenQuery.rows[0];

        if (!tokenRecord) {
            return res.status(401).json({ message: 'Refresh token已被撤销或不存在' });
        }

        // 验证 refresh token
        let decoded: any;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string);
        } catch (err) {
            console.error('Refresh token verification error:', err);
            return res.status(401).json({ message: 'Refresh token无效或已过期' });
        }

        // 生成新 access token
        const newAccessToken = jwt.sign(
            { userId: decoded.userId, email: decoded.email },
            process.env.ACCESS_TOKEN_SECRET as string,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
        );

        // 可选：token 轮换（生成新 refresh token，撤销旧的）
        // const newRefreshToken = jwt.sign(
        //   { userId: decoded.userId, email: decoded.email },
        //   process.env.REFRESH_TOKEN_SECRET as string,
        //   { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
        // );
        // await client.query('UPDATE refresh_tokens SET revoked = true, expires_at = NOW() WHERE token = $1', [refreshToken]);
        // const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        // await client.query(
        //   'INSERT INTO refresh_tokens (user_id, token, revoked, expires_at) VALUES ($1, $2, $3, $4)',
        //   [decoded.userId, newRefreshToken, false, newExpiresAt]
        // );

        res.json({
            accessToken: newAccessToken,
            // refreshToken: newRefreshToken  // 如果启用轮换
        });
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ message: 'Token刷新失败' });
    } finally {
        client.release();
    }
}

export async function verify(req: Request, res: Response) {
    // authenticateToken 中间件已将 user 挂载到 req
    res.json({
        user: {
            email: (req as any).user?.email
        }
    })
}

export async function logout(req: Request, res: Response) {

    const client = await pool.connect();

    try {
        const logoutBody = (req.body && Object.keys(req.body).length ? req.body : req.query) as any;
        const { refreshToken } = logoutBody;

        if (refreshToken) {
            // 更新数据库中 token 为 revoked
            await client.query(
                'UPDATE refresh_tokens SET revoked = true, expires_at = NOW() WHERE token = $1',
                [refreshToken]
            );
        }

        res.json({ message: '登出成功' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: '登出失败' });
    } finally {
        client.release();
    }
}

export async function forget(req: Request, res: Response) {
    const client = await pool.connect()

    try {
        console.log('Received password reset request:', req.body)
        res.json({ message: '密码重置请求已发送至您的邮箱' });
    } catch (error) {
        console.error('Password reset error:', error)
        res.status(500).json({ message: '密码重置请求发生失败' })
    }
    finally {
        client.release()
    }
}
