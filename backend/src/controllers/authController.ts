import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AthleteProfile } from '../models/AthleteProfile';
import { CoachProfile } from '../models/CoachProfile';
import { Organization } from '../models/Organization';
import { generateAccessToken, generateRefreshToken, generateOTP, generateSlug, verifyRefreshToken } from '../utils/jwt';
import { sendEmail, emailTemplates } from '../utils/email';
import { sendSMS, normalizePhone, toE164India } from '../utils/sms';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

// Frontend base URL for OAuth redirects. Ignores stale localhost/vercel values that
// may linger in hosted env config — production lives at linksports.in.
const FRONTEND_URL = (() => {
  const fromEnv = process.env.FRONTEND_URL || process.env.CLIENT_URL || '';
  if (process.env.NODE_ENV !== 'production' && fromEnv.includes('localhost')) return fromEnv;
  if (fromEnv && !fromEnv.includes('localhost') && !fromEnv.includes('vercel.app')) return fromEnv;
  return 'https://linksports.in';
})();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // 'none' for cross-origin production; 'lax' for dev (strict blocks cross-port cookies)
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password, role, fullName, organizationName, organizationType, phone, contactPerson, city } = req.body;
    const email = req.body.email?.toLowerCase()?.trim();

    if (!email) {
      sendError(res, 'Email is required', 400, 'VALIDATION_ERROR');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      sendError(res, 'Enter a valid email address', 400, 'VALIDATION_ERROR');
      return;
    }
    if (!password || password.length < 8) {
      sendError(res, 'Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
      return;
    }
    if (fullName && !/^[A-Za-z][A-Za-z\s.'-]*$/.test(String(fullName).trim())) {
      sendError(res, 'Name can only contain letters, spaces, . - and \'', 400, 'VALIDATION_ERROR');
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      sendError(res, 'Email already registered', 409, 'DUPLICATE_EMAIL');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.create({
      email,
      passwordHash,
      role,
      phone,
      emailOtp: otp,
      emailOtpExpiry: otpExpiry,
      isVerified: false,
      isApproved: role === 'professional' ? false : true,
    });

    const slug = generateSlug(fullName || organizationName || email.split('@')[0]);

    if (role === 'athlete') {
      await AthleteProfile.create({ userId: user._id, fullName: fullName || email.split('@')[0], profileUrl: slug });
    } else if (role === 'coach') {
      await CoachProfile.create({ userId: user._id, fullName: fullName || email.split('@')[0], profileUrl: slug });
    } else if (role === 'organization') {
      await Organization.create({
        userId: user._id,
        name: organizationName || email.split('@')[0],
        contactPerson: contactPerson || undefined,
        city: city || undefined,
        type: organizationType || 'academy',
        contact: { phone, email },
        profileUrl: slug,
        verificationStatus: 'pending',
        isVerified: false,
      });
    }

    // Always log OTP so it's visible in Render/server logs for debugging
    console.log(`\n[OTP] ── ${email}: ${otp} ──\n`);
    try {
      await sendEmail({ to: email, ...emailTemplates.verifyEmail(otp, fullName || 'User') });
      console.log(`[Email] OTP sent to ${email}`);
    } catch (emailError) {
      console.error('[Email] FAILED to send OTP:', emailError);
    }

    sendSuccess(res, { userId: user._id, email: user.email, role: user.role }, 'Registration successful. Please verify your email.', 201);
  } catch (error: unknown) {
    console.error('Register error:', error);
    if ((error as { code?: number })?.code === 11000) {
      sendError(res, 'Email already registered', 409, 'DUPLICATE_EMAIL');
      return;
    }
    sendError(res, 'Registration failed', 500, 'REGISTER_ERROR');
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email?.toLowerCase()?.trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+emailOtp +emailOtpExpiry');

    if (!user) { sendError(res, 'User not found', 404, 'NOT_FOUND'); return; }
    if (user.isVerified) { sendError(res, 'Email already verified', 400, 'ALREADY_VERIFIED'); return; }
    if (!user.emailOtp || user.emailOtp !== otp) { sendError(res, 'Invalid OTP', 400, 'INVALID_OTP'); return; }
    if (user.emailOtpExpiry && user.emailOtpExpiry < new Date()) { sendError(res, 'OTP expired', 400, 'OTP_EXPIRED'); return; }

    user.isVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    await user.save();

    sendSuccess(res, null, 'Email verified successfully');
  } catch (error) {
    sendError(res, 'Verification failed', 500, 'VERIFY_ERROR');
  }
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.toLowerCase()?.trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+emailOtp +emailOtpExpiry');
    if (!user) { sendError(res, 'User not found', 404, 'NOT_FOUND'); return; }
    if (user.isVerified) { sendError(res, 'Email already verified', 400, 'ALREADY_VERIFIED'); return; }

    const otp = generateOTP();
    user.emailOtp = otp;
    user.emailOtpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    console.log(`\n[OTP] ── Resend ${normalizedEmail}: ${otp} ──\n`);
    try {
      await sendEmail({ to: normalizedEmail, ...emailTemplates.verifyEmail(otp, normalizedEmail.split('@')[0]) });
      console.log(`[Email] Resend OTP sent to ${normalizedEmail}`);
    } catch (emailError) {
      console.error('[Email] FAILED to resend OTP:', emailError);
    }

    sendSuccess(res, null, 'OTP resent successfully');
  } catch (err) {
    console.error('resendOtp error:', err);
    sendError(res, 'Failed to resend OTP', 500);
  }
};

const MAX_FAILED_ATTEMPTS = 10;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body; // 'email' acts as identifier (email, username, or slug)
    let user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash +refreshTokens +failedLoginAttempts +lockUntil') as any;

    if (!user) {
      const identifier = email.toLowerCase().trim();
      // Use exact string match ($eq) to prevent regex injection / ReDoS attacks
      const athlete = await AthleteProfile.findOne({
        $or: [
          { username: { $eq: identifier } },
          { profileUrl: { $eq: identifier } },
        ],
      }).select('userId');

      if (athlete) {
        user = await User.findById(athlete.userId).select('+passwordHash +refreshTokens +failedLoginAttempts +lockUntil');
      } else {
        const coach = await CoachProfile.findOne({ profileUrl: { $eq: identifier } }).select('userId');
        if (coach) {
          user = await User.findById(coach.userId).select('+passwordHash +refreshTokens +failedLoginAttempts +lockUntil');
        } else {
          const org = await Organization.findOne({ profileUrl: { $eq: identifier } }).select('userId');
          if (org) user = await User.findById(org.userId).select('+passwordHash +refreshTokens +failedLoginAttempts +lockUntil');
        }
      }
    }

    if (!user || !user.passwordHash) {
      sendError(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');
      return;
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      sendError(res, `Account temporarily locked. Try again in ${minutesLeft} minute(s).`, 429, 'ACCOUNT_LOCKED');
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        user.failedLoginAttempts = 0;
        await user.save();
        sendError(res, 'Too many failed attempts. Account locked for 15 minutes.', 429, 'ACCOUNT_LOCKED');
      } else {
        await user.save();
        sendError(res, 'Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }
      return;
    }

    // Reset failed attempts on successful password match
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
    }

    if (!user.isVerified) {
      await user.save();
      sendError(res, 'Please verify your email first', 401, 'EMAIL_NOT_VERIFIED');
      return;
    }

    if (user.isSuspended) {
      sendError(res, 'Your account has been suspended', 403, 'SUSPENDED');
      return;
    }

    const payload = { id: user._id.toString(), role: user.role, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    user.lastLoginAt = new Date();
    await user.save();

    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    sendSuccess(res, {
      accessToken,
      // Also return the refresh token so SPA clients on a different domain (where the
      // httpOnly cookie is blocked as a third-party cookie) can persist the session.
      refreshToken,
      user: { id: user._id, email: user.email, role: user.role, isVerified: user.isVerified },
    }, 'Login successful');
  } catch {
    sendError(res, 'Login failed', 500, 'LOGIN_ERROR');
  }
};

// ── Phone OTP login ───────────────────────────────────────────────────────────
// Build a regex that matches a stored phone (which may contain +91, spaces, or
// dashes) by its last 10 digits, so "+91 98765 43210" matches "9876543210".
const buildPhoneMatchRegex = (tenDigits: string): RegExp =>
  new RegExp(tenDigits.split('').join('\\D*') + '$');

const findUserByPhone = async (rawPhone: string, selectFields = '') => {
  const ten = normalizePhone(rawPhone);
  if (ten.length !== 10) return null;
  const query = User.findOne({ phone: buildPhoneMatchRegex(ten) }).sort({ createdAt: -1 });
  return selectFields ? query.select(selectFields) : query;
};

// Step 1: user enters phone → we generate an OTP and send it via SMS.
export const sendPhoneOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const ten = normalizePhone(req.body?.phone);
    if (ten.length !== 10) {
      sendError(res, 'Enter a valid 10-digit phone number', 400, 'INVALID_PHONE');
      return;
    }

    const user: any = await findUserByPhone(ten, '+phoneOtp +phoneOtpExpiry');
    // Respond the same way whether or not the account exists, to avoid leaking
    // which phone numbers are registered. (OTP is only saved/sent if a user exists.)
    if (user) {
      const otp = generateOTP();
      user.phoneOtp = otp;
      user.phoneOtpExpiry = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      console.log(`\n[Phone OTP] ── +91${ten}: ${otp} ──\n`);
      await sendSMS(toE164India(ten), `Your LinkSports login OTP is ${otp}. It expires in 15 minutes. Do not share it with anyone.`);
    } else {
      console.log(`\n[Phone OTP] No account found for +91${ten} (no OTP sent)\n`);
    }

    sendSuccess(res, { phone: ten }, 'If an account exists for this number, an OTP has been sent.');
  } catch (err) {
    console.error('sendPhoneOtp error:', err);
    sendError(res, 'Failed to send OTP', 500);
  }
};

// Step 2: user enters the OTP → we verify it and log them in.
export const loginWithPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const ten = normalizePhone(req.body?.phone);
    const otp = String(req.body?.otp || '').trim();
    if (ten.length !== 10 || !otp) {
      sendError(res, 'Phone number and OTP are required', 400, 'VALIDATION_ERROR');
      return;
    }

    const user: any = await findUserByPhone(ten, '+phoneOtp +phoneOtpExpiry +refreshTokens');
    if (!user || !user.phoneOtp) {
      sendError(res, 'Invalid or expired OTP. Please request a new one.', 400, 'INVALID_OTP');
      return;
    }
    if (user.phoneOtp !== otp) {
      sendError(res, 'Incorrect OTP. Please check and try again.', 400, 'INVALID_OTP');
      return;
    }
    if (user.phoneOtpExpiry && user.phoneOtpExpiry < new Date()) {
      sendError(res, 'OTP has expired. Please request a new one.', 400, 'OTP_EXPIRED');
      return;
    }
    if (user.isSuspended) {
      sendError(res, 'Your account has been suspended', 403, 'SUSPENDED');
      return;
    }

    // Phone OTP success also verifies the account (proves number ownership).
    user.isVerified = true;
    user.phoneOtp = undefined;
    user.phoneOtpExpiry = undefined;

    const payload = { id: user._id.toString(), role: user.role, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refresh = generateRefreshToken(payload);

    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refresh];
    user.lastLoginAt = new Date();
    await user.save();

    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refresh, COOKIE_OPTIONS);

    sendSuccess(res, {
      accessToken,
      refreshToken: refresh,
      user: { id: user._id, email: user.email, role: user.role, isVerified: user.isVerified },
    }, 'Login successful');
  } catch (err) {
    console.error('loginWithPhone error:', err);
    sendError(res, 'Phone login failed', 500);
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) { sendError(res, 'Refresh token required', 401); return; }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshTokens');

    if (!user || !user.refreshTokens?.includes(token)) {
      sendError(res, 'Invalid refresh token', 401); return;
    }

    const payload = { id: user._id.toString(), role: user.role, email: user.email };
    const accessToken = generateAccessToken(payload);

    // Do NOT rotate the refresh token. Reusing the same long-lived (30d) token keeps
    // the refresh chain stable and immune to multi-request / multi-tab races that would
    // otherwise invalidate it and force a re-login. Logout still revokes it server-side.
    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', token, COOKIE_OPTIONS);
    sendSuccess(res, { accessToken, refreshToken: token }, 'Token refreshed');
  } catch {
    sendError(res, 'Token refresh failed', 401);
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (token && req.user) {
      const user = await User.findById(req.user._id).select('+refreshTokens');
      if (user) {
        user.refreshTokens = (user.refreshTokens || []).filter((t) => t !== token);
        await user.save();
      }
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    sendSuccess(res, null, 'Logged out successfully');
  } catch {
    sendError(res, 'Logout failed', 500);
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  // Normalize email — DB stores lowercase, query must match
  const normalizedEmail = email?.toLowerCase()?.trim();
  if (!normalizedEmail) { sendError(res, 'Email is required', 400); return; }

  const user = await User.findOne({ email: normalizedEmail }).select('+emailOtp +emailOtpExpiry');

  // Always respond the same way so we don't leak which emails exist
  if (!user) { sendSuccess(res, null, 'If that email is registered, an OTP has been sent'); return; }

  const otp = generateOTP();
  user.emailOtp = otp;
  user.emailOtpExpiry = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  try {
    await sendEmail({ to: normalizedEmail, ...emailTemplates.resetPassword(otp, normalizedEmail.split('@')[0]) });
    sendSuccess(res, null, 'OTP sent to your email');
  } catch {
    sendError(res, 'Failed to send OTP email. Please try again later.', 500);
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      sendError(res, 'Email, OTP and new password are required', 400); return;
    }
    if (newPassword.length < 8) {
      sendError(res, 'Password must be at least 8 characters', 400); return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      sendError(res, 'Password must contain uppercase, lowercase, and a number', 400); return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+emailOtp +emailOtpExpiry +passwordHash');

    if (!user || !user.emailOtp) {
      sendError(res, 'Invalid or expired OTP. Please request a new one.', 400, 'INVALID_OTP'); return;
    }
    if (user.emailOtp !== String(otp).trim()) {
      sendError(res, 'Incorrect OTP. Please check and try again.', 400, 'INVALID_OTP'); return;
    }
    if (user.emailOtpExpiry && user.emailOtpExpiry < new Date()) {
      sendError(res, 'OTP has expired. Please request a new one.', 400, 'OTP_EXPIRED'); return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    user.refreshTokens = [];
    await user.save();

    sendSuccess(res, null, 'Password reset successfully. You can now log in.');
  } catch (err) {
    console.error('resetPassword error:', err);
    sendError(res, 'Password reset failed', 500);
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) { sendError(res, 'User not found', 404); return; }

    let profile = null;
    if (user.role === 'athlete') {
      profile = await AthleteProfile.findOne({ userId: user._id });
    } else if (user.role === 'coach') {
      profile = await CoachProfile.findOne({ userId: user._id });
    } else if (user.role === 'organization') {
      profile = await Organization.findOne({ userId: user._id });
    }

    sendSuccess(res, { user, profile });
  } catch {
    sendError(res, 'Failed to get user', 500);
  }
};

export const googleCallback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.redirect(`${FRONTEND_URL}/auth/login?error=oauth_failed`); return; }

    const user = req.user;
    const needsRole = user.needsRoleSelection === true;
    const payload = { id: user._id.toString(), role: user.role, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const dbUser = await User.findById(user._id).select('+refreshTokens');
    if (dbUser) {
      dbUser.refreshTokens = [...(dbUser.refreshTokens || []).slice(-4), refreshToken];
      dbUser.lastLoginAt = new Date();
      await dbUser.save();
    }

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    const newUserParam = needsRole ? '&newUser=true' : '';
    // Pass the refresh token to the SPA so it can persist the session in localStorage.
    // Required because the httpOnly cookie is a blocked third-party cookie when the
    // frontend and backend are on different domains.
    res.redirect(`${FRONTEND_URL}/auth/login?token=${accessToken}&refresh=${encodeURIComponent(refreshToken)}${newUserParam}`);
  } catch {
    res.redirect(`${FRONTEND_URL}/auth/login?error=oauth_failed`);
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      sendError(res, 'Current and new password are required', 400); return;
    }
    if (newPassword.length < 8) { sendError(res, 'Password must be at least 8 characters', 400); return; }
    if (!/(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(newPassword)) {
      sendError(res, 'Password needs uppercase, number, and special character', 400); return;
    }

    const user = await User.findById(req.user!._id).select('+passwordHash');
    if (!user) { sendError(res, 'User not found', 404); return; }

    if (!user.passwordHash) {
      sendError(res, 'Cannot change password for social login accounts', 400, 'SOCIAL_ACCOUNT'); return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) { sendError(res, 'Current password is incorrect', 401, 'INVALID_PASSWORD'); return; }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('changePassword error:', error);
    sendError(res, 'Failed to change password', 500);
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    // Remove all associated data
    await Promise.allSettled([
      AthleteProfile.deleteOne({ userId }),
      CoachProfile.deleteOne({ userId }),
      Organization.deleteOne({ userId }),
    ]);

    await User.findByIdAndDelete(userId);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    sendSuccess(res, null, 'Account deleted successfully');
  } catch (error) {
    console.error('deleteAccount error:', error);
    sendError(res, 'Failed to delete account', 500);
  }
};

export const updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    const validRoles = ['athlete', 'coach', 'professional', 'organization'];
    if (!validRoles.includes(role)) { sendError(res, 'Invalid role', 400, 'INVALID_ROLE'); return; }

    const user = await User.findById(req.user!._id);
    if (!user) { sendError(res, 'User not found', 404); return; }

    const oldRole = user.role;
    user.role = role;
    user.needsRoleSelection = false;
    await user.save();

    const slug = generateSlug(user.email.split('@')[0]);

    if (role === 'coach' && oldRole !== 'coach') {
      await CoachProfile.findOneAndUpdate(
        { userId: user._id },
        { $setOnInsert: { userId: user._id, fullName: user.email.split('@')[0], profileUrl: slug } },
        { upsert: true, new: true }
      );
    } else if (role === 'organization' && oldRole !== 'organization') {
      await Organization.findOneAndUpdate(
        { userId: user._id },
        { $setOnInsert: { userId: user._id, name: user.email.split('@')[0], type: 'academy', contact: { email: user.email }, profileUrl: slug, verificationStatus: 'pending', isVerified: false } },
        { upsert: true, new: true }
      );
    }

    const payload = { id: user._id.toString(), role: user.role, email: user.email };
    const newAccessToken = generateAccessToken(payload);
    sendSuccess(res, { accessToken: newAccessToken, role: user.role }, 'Role updated');
  } catch (error) {
    console.error('updateRole error:', error);
    sendError(res, 'Failed to update role', 500);
  }
};
