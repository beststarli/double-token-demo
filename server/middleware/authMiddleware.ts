/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '未提供认证token' });
    }

    try {
        const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
        (req as any).user = user;
        next();
    } catch (err: any) {
        if (err && err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Access token已过期' });
        }
        return res.status(403).json({ message: 'Token无效' });
    }
}
