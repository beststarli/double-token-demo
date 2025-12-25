import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 简单的内存存储，用于演示 refresh token 的存储/撤销
const refreshTokenStore = new Set<string>();

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: '邮箱和密码不能为空' });
        }

        // 演示用途：假设数据库中用户密码为 'password123'
        const demoHash = await bcrypt.hash('password123', 10);
        const isValidPassword = await bcrypt.compare(password, demoHash);
        if (!isValidPassword) {
            return res.status(401).json({ message: '邮箱或密码错误' });
        }

        const userId = 1;

        const accessToken = jwt.sign(
            { userId, email },
            process.env.ACCESS_TOKEN_SECRET as string,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
        );

        const refreshToken = jwt.sign(
            { userId, email },
            process.env.REFRESH_TOKEN_SECRET as string,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
        );

        // 存储 refresh token
        refreshTokenStore.add(refreshToken);

        res.json({ accessToken, refreshToken, user: { email } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
}

export async function refresh(req: Request, res: Response) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ message: '未提供refresh token' });
        }

        if (!refreshTokenStore.has(refreshToken)) {
            return res.status(401).json({ message: 'Refresh token已被撤销或不存在' });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string);
        } catch (err) {
            console.error('Refresh token verification error:', err);
            return res.status(401).json({ message: 'Refresh token无效或已过期' });
        }

        const newAccessToken = jwt.sign(
            { userId: decoded.userId, email: decoded.email },
            process.env.ACCESS_TOKEN_SECRET as string,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
        );

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ message: 'Token刷新失败' });
    }
}

export async function verify(req: Request, res: Response) {
    // authenticateToken 中间件已将 user 挂载到 req
    res.json({ user: { email: (req as any).user?.email } });
}

export async function logout(req: Request, res: Response) {
    try {
        const { refreshToken } = req.body;
        if (refreshToken && refreshTokenStore.has(refreshToken)) {
            refreshTokenStore.delete(refreshToken);
        }
        res.json({ message: '登出成功' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: '登出失败' });
    }
}
