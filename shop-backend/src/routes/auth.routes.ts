import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

// OTP & Password Reset
router.post('/send-otp', AuthController.sendOTP);
router.post('/verify-otp', AuthController.verifyOTP);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.get('/me', optionalAuthenticate, AuthController.getMe);
router.put('/profile', authenticate, AuthController.updateProfile);

export default router;
