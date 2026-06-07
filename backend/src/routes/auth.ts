import { Router } from 'express';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import {
  register, login, verifyEmail, resendOtp, refreshToken, logout,
  forgotPassword, resetPassword, getMe, googleCallback, updateRole,
  changePassword, deleteAccount, sendPhoneOtp, loginWithPhone,
} from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

// Strict rate limiter for OTP-related endpoints: max 5 requests per 15 min per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many OTP requests. Please wait 15 minutes before trying again.' } },
});

router.post('/register', register);
router.post('/verify-email', otpLimiter, verifyEmail);
router.post('/resend-otp', otpLimiter, resendOtp);
router.post('/login', login);
router.post('/phone/send-otp', otpLimiter, sendPhoneOtp);
router.post('/phone/login', otpLimiter, loginWithPhone);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', otpLimiter, resetPassword);
router.get('/me', protect, getMe);
router.patch('/update-role', protect, updateRole);
router.post('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

router.get('/oauth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id') {
    return res.status(400).json({ success: false, error: { message: 'Google login is not configured on this server yet.' } });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/oauth/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id') {
    return res.redirect('/auth/login?error=not_configured');
  }
  passport.authenticate('google', { failureRedirect: '/auth/login', session: false })(req, res, next);
}, googleCallback);

export default router;
