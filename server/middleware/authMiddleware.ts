/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: '未提供认证token' });
    }

    const secret: jwt.Secret = process.env.ACCESS_TOKEN_SECRET as jwt.Secret;

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            if ((err as any).name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Access token已过期' });
            }
            return res.status(403).json({ message: 'Token无效' });
        }

        (req as any).user = user
        next()
    })
}
