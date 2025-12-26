import { Router } from 'express'
import { authenticateToken } from '../middleware/authMiddleware.ts'
import { login, refresh, verify, logout, hello, testDb } from '../controllers/authController.ts'

const router = Router();

router.get('/hello', hello)
router.get('/testdb', testDb)
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/verify', authenticateToken, verify);
router.post('/logout', logout);

export default router;
