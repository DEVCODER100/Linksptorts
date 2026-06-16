import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types';
import { Match, IMatch } from '../models/Match';
import { Prediction } from '../models/Prediction';
import { User } from '../models/User';
import { AthleteProfile } from '../models/AthleteProfile';
import { CoachProfile } from '../models/CoachProfile';
import { Organization } from '../models/Organization';
import { syncPredictions } from '../services/predictionSync';
import { Slot, slotLabel, ROUND_LABELS, Round } from '../config/wc2026Bracket';
import { sendSuccess, sendError } from '../utils/response';

const isThird = (s: Slot) => s.type === 'GROUP_THIRD';

const serializeMatch = (m: IMatch) => {
  const home = m.home as unknown as Slot;
  const away = m.away as unknown as Slot;
  return {
    _id: m._id,
    matchNo: m.matchNo,
    round: m.round,
    roundLabel: ROUND_LABELS[m.round as Round] || m.round,
    kickoffUtc: m.kickoffUtc,
    venue: m.venue || null,
    homeTeam: m.homeTeam || null,
    awayTeam: m.awayTeam || null,
    homeLabel: slotLabel(home),
    awayLabel: slotLabel(away),
    homeName: m.homeTeam || slotLabel(home),
    awayName: m.awayTeam || slotLabel(away),
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
    status: m.status,
    winner: m.winner ?? null,
    hasOpponentSlot: isThird(home) || isThird(away),
  };
};

// GET /api/v1/predictions — read-only bracket, ordered by match number.
export const getMatches = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matches = await Match.find({}).sort({ matchNo: 1 });
    sendSuccess(res, matches.map(serializeMatch), 'Bracket fetched');
  } catch {
    sendError(res, 'Failed to fetch the bracket', 500);
  }
};

// GET /api/v1/predictions/mine — the user's picks + total points.
export const getMyPredictions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const preds = await Prediction.find({ userId: req.user!._id }).sort({ key: 1 });
    const items = preds.map((p) => ({ key: p.key, pickTeam: p.pickTeam, points: p.points, settled: p.points !== null }));
    const totalPoints = items.reduce((s, i) => s + (i.points || 0), 0);
    sendSuccess(res, { items, totalPoints }, 'My predictions fetched');
  } catch {
    sendError(res, 'Failed to fetch your predictions', 500);
  }
};

// Display names live on profile collections, not User. Fall back to email handle.
const resolveNames = async (userIds: Types.ObjectId[]): Promise<Map<string, string>> => {
  const map = new Map<string, string>();
  const [athletes, coaches, orgs, users] = await Promise.all([
    AthleteProfile.find({ userId: { $in: userIds } }).select('userId fullName'),
    CoachProfile.find({ userId: { $in: userIds } }).select('userId fullName'),
    Organization.find({ userId: { $in: userIds } }).select('userId name'),
    User.find({ _id: { $in: userIds } }).select('email'),
  ]);
  for (const u of users) map.set(String(u._id), u.email?.split('@')[0] || 'Member');
  for (const a of athletes as Array<{ userId: Types.ObjectId; fullName?: string }>) if (a.fullName) map.set(String(a.userId), a.fullName);
  for (const c of coaches as Array<{ userId: Types.ObjectId; fullName?: string }>) if (c.fullName) map.set(String(c.userId), c.fullName);
  for (const o of orgs as Array<{ userId: Types.ObjectId; name?: string }>) if (o.name) map.set(String(o.userId), o.name);
  return map;
};

// GET /api/v1/predictions/leaderboard — users ranked by total points.
export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rows = await Prediction.aggregate<{ _id: Types.ObjectId; totalPoints: number; predictions: number; correct: number }>([
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: { $ifNull: ['$points', 0] } },
          predictions: { $sum: 1 },
          correct: { $sum: { $cond: [{ $eq: ['$points', 3] }, 1, 0] } },
        },
      },
      { $sort: { totalPoints: -1, correct: -1, predictions: 1 } },
      { $limit: 200 },
    ]);

    const names = await resolveNames(rows.map((r) => r._id));
    const meId = req.user?._id ? String(req.user._id) : null;
    const leaderboard = rows.map((r, i) => ({
      rank: i + 1, userId: r._id, name: names.get(String(r._id)) || 'Member',
      totalPoints: r.totalPoints, correct: r.correct, predictions: r.predictions, isMe: meId === String(r._id),
    }));
    sendSuccess(res, leaderboard, 'Leaderboard fetched');
  } catch {
    sendError(res, 'Failed to fetch leaderboard', 500);
  }
};

// POST /api/v1/predictions/sync — scheduler-triggered (secret-protected).
export const runSync = async (req: Request, res: Response): Promise<void> => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.header('x-cron-secret') !== secret) {
    sendError(res, 'Not authorized', 401, 'UNAUTHORIZED');
    return;
  }
  try {
    const result = await syncPredictions();
    sendSuccess(res, result, 'Sync complete');
  } catch (err) {
    sendError(res, `Sync failed: ${(err as Error).message}`, 502);
  }
};
