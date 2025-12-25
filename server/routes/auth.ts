import { Router } from 'express';
import { login, refresh, verify, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.get('/verify', authenticateToken, verify);
router.post('/logout', logout);

export default router;
