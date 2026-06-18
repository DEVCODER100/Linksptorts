import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import passport from 'passport';

import { configurePassport } from './config/passport';
import { errorHandler, notFound } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import profileRoutes from './routes/profiles';
import connectionRoutes from './routes/connections';
import listingRoutes from './routes/listings';
import jobRoutes from './routes/jobs';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import userReviewRoutes, { reviewRouter } from './routes/reviews';
import predictorRoutes from './routes/predictor';

import { AthleteProfile } from './models/AthleteProfile';
import { CoachProfile } from './models/CoachProfile';
import { Organization } from './models/Organization';
import { User } from './models/User';
import { Listing } from './models/Listing';
import { Job } from './models/Job';

const app = express();

// Trust proxy X-Forwarded-For headers (required for express-rate-limit on Render/Vercel)
app.set('trust proxy', 1);

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Configured at the CDN/reverse-proxy level
}));

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://www.linksports.in',
  'https://linksports.in',
];

app.use(cors({
  origin: (origin, callback) => {
    // Native mobile apps send no Origin header — always allow
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow Vercel preview/prod deployments
    if (/\.vercel\.app$/.test(new URL(origin).hostname)) return callback(null, true);
    // Allow any localhost/192.168.x.x origin in development
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Sanitize all incoming data — strip MongoDB operators ($, .) from user input
app.use(mongoSanitize({ replaceWith: '_' }));

app.use(passport.initialize());
configurePassport();

// Serve uploaded files (local dev only — production should use Cloudinary)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later.' } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 50 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many authentication attempts.' } },
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many search requests.' } },
});

app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
// OAuth redirect routes are excluded from the auth rate limiter (not brute-force targets)
app.use('/api/v1/auth/oauth', authRoutes);
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/connections', connectionRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/users', userReviewRoutes);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/predictor', predictorRoutes);

// ── Global search (rate-limited, sanitized) ───────────────────────────────────
app.get('/api/v1/search', searchLimiter, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    const safePage = Math.max(1, Math.min(100, parseInt(page as string) || 1));
    const safeLimit = Math.max(1, Math.min(20, parseInt(limit as string) || 20));
    const skip = (safePage - 1) * safeLimit;

    let profileFilter: Record<string, unknown> = {};

    if (q && typeof q === 'string' && q.trim()) {
      const raw = q.trim().slice(0, 200);
      const safe = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(safe, 'i');

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
      const isPhone = /^\+?[\d\s\-().]{7,}$/.test(raw) && /\d{6,}/.test(raw.replace(/\D/g, ''));

      if (isEmail) {
        const users = await User.find({ email: re }).select('_id').lean();
        const ids = users.map((u: any) => u._id);
        profileFilter.$or = [{ email: re }, ...(ids.length ? [{ userId: { $in: ids } }] : [])];
      } else if (isPhone) {
        const digits = raw.replace(/\D/g, '');
        const phoneRe = new RegExp(digits, 'i');
        const users = await User.find({ phone: phoneRe }).select('_id').lean();
        const ids = users.map((u: any) => u._id);
        profileFilter.$or = [{ phone: phoneRe }, ...(ids.length ? [{ userId: { $in: ids } }] : [])];
      } else {
        const nameStr = raw.startsWith('@') ? raw.slice(1) : raw;
        const nameSafe = nameStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const nameRe = new RegExp(nameSafe, 'i');
        profileFilter.$or = [{ fullName: nameRe }, { username: nameRe }, { name: nameRe }, { tagline: nameRe }];
      }
    }

    const [athletes, coaches, organizations, listings, jobs] = await Promise.all([
      AthleteProfile.find({ ...profileFilter, visibility: 'public' })
        .limit(safeLimit).skip(skip)
        .select('fullName photo primarySport location profileUrl username'),
      CoachProfile.find({ ...profileFilter, visibility: 'public' })
        .limit(safeLimit).skip(skip)
        .select('fullName photo sportsSpecialization location profileUrl'),
      Organization.find({ ...profileFilter, verificationStatus: 'verified' })
        .limit(safeLimit).skip(skip)
        .select('name logo sports contact profileUrl'),
      Listing.find({ status: 'published' })
        .limit(5).select('title type sports startDate location')
        .populate('organizationId', 'name logo'),
      Job.find({ status: 'published' })
        .limit(5).select('title category location jobType'),
    ]);

    res.json({ success: true, data: { athletes, coaches, organizations, listings, jobs } });
  } catch {
    res.status(500).json({ success: false, error: { message: 'Search failed' } });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
