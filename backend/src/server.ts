import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import passport from 'passport';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import { connectDB } from './config/database';
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

const app = express();
const server = http.createServer(app);

// Trust Render/proxy X-Forwarded-For headers (required for express-rate-limit on Render)
app.set('trust proxy', 1);

// ── Socket.IO (authenticated) ─────────────────────────────────────────────────
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Verify JWT on every socket connection
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    (socket as any).userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const authenticatedUserId = (socket as any).userId as string;

  // Only allow joining own room
  socket.join(`user_${authenticatedUserId}`);

  socket.on('send_message', (data) => {
    const { recipientId, message } = data;
    // Validate sender is authenticated user
    if (!recipientId || !message) return;
    io.to(`user_${recipientId}`).emit('receive_message', message);
  });

  socket.on('typing', (data) => {
    const { recipientId } = data;
    if (!recipientId) return;
    io.to(`user_${recipientId}`).emit('user_typing', { senderId: authenticatedUserId });
  });

  socket.on('disconnect', () => {
    // Intentionally silent
  });
});

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

// Serve uploaded files
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

// ── Global search (rate-limited, sanitized) ───────────────────────────────────
app.get('/api/v1/search', searchLimiter, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    const safePage = Math.max(1, Math.min(100, parseInt(page as string) || 1));
    const safeLimit = Math.max(1, Math.min(20, parseInt(limit as string) || 20));
    const skip = (safePage - 1) * safeLimit;

    const { AthleteProfile } = await import('./models/AthleteProfile');
    const { CoachProfile }   = await import('./models/CoachProfile');
    const { Organization }   = await import('./models/Organization');
    const { User }           = await import('./models/User');
    const { Listing }        = await import('./models/Listing');
    const { Job }            = await import('./models/Job');

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

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`LinkSports backend running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
};

start().catch(console.error);

export { io };
