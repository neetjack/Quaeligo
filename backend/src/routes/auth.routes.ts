import { Router } from 'express';
import { login, updateAccount } from '../controllers/admin.auth.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { loginLimiter } from '../middlewares/rateLimit.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', loginLimiter, asyncHandler(login));
router.put('/admin/account', authMiddleware, asyncHandler(updateAccount));

export default router;
