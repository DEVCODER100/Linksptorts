import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types';
import { Match, IMatch } from '../models/Match';
import { Prediction, PredictionPick } from '../models/Prediction';
import { User } from '../models/User';
import { AthleteProfile } from '../models/AthleteProfile';
import { CoachProfile } from '../models/CoachProfile';
import { Organization } from '../models/Organization';
import { syncPredictions } from '../services/predictionSync';
import { sendSuccess, sendError } from '../utils/response';

const isKnockout = (stage: string) => stage !== 'GROUP_STAGE';

// Valid picks depend on the stage: knockouts have no draw.
const validPick = (stage: string, pick: string): pick is PredictionPick =>
  isKnockout(stage) ? pick === 'HOME' || pick === 'AWAY' : pick === 'HOME' || pick === 'DRAW' || pick === 'AWAY';

// A match is locked once it kicks off (or is no longer 'upcoming').
const isLocked = (m: IMatch) => m.status !== 'upcoming' || new Date(m.kickoffUtc).getTime() <= Date.now();

const serializeMatch = (m: IMatch, myPick?: PredictionPick | null) => ({
  _id: m._id,
  extId: m.extId,
  stage: m.stage,
  groupLabel: m.groupLabel || null,
  homeTeam: m.homeTeam,
  awayTeam: m.awayTeam,
  kickoffUtc: m.kickoffUtc,
  status: m.status,
  homeScore: m.homeScore ?? null,
  awayScore: m.awayScore ?? null,
  isKnockout: isKnockout(m.stage),
  locked: isLocked(m),
  myPick: myPick ?? null,
});

// GET /api/v1/predictions — read-only list, sorted by kickoff.
// Attaches the caller's own pick per match when authenticated.
export const getMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matches = await Match.find({}).sort({ kickoffUtc: 1 });

    let pickByMatch = new Map<string, PredictionPick>();
    if (req.user?._id) {
      const preds = await Prediction.find({ userId: req.user._id }).select('matchId pick');
      pickByMatch = new Map(preds.map((p) => [String(p.matchId), p.pick]));
    }

    sendSuccess(res, matches.map((m) => serializeMatch(m, pickByMatch.get(String(m._id)))), 'Matches fetched');
  } catch {
    sendError(res, 'Failed to fetch matches', 500);
  }
};

// POST /api/v1/predictions/:matchId/predict — submit/change ONE pick for a match.
// Server-side kickoff lock is the source of truth (UI disabling is not enough).
export const createPrediction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;
    const { pick } = req.body as { pick?: string };

    if (!Types.ObjectId.isValid(matchId)) {
      sendError(res, 'Invalid match', 400);
      return;
    }
    const match = await Match.findById(matchId);
    if (!match) {
      sendError(res, 'Match not found', 404);
      return;
    }
    if (isLocked(match)) {
      sendError(res, 'Predictions are locked for this match', 409, 'LOCKED');
      return;
    }
    if (!pick || !validPick(match.stage, pick)) {
      sendError(res, isKnockout(match.stage) ? 'Pick must be HOME or AWAY' : 'Pick must be HOME, DRAW or AWAY', 400);
      return;
    }

    // One per (userId, matchId), enforced by the unique index; upsert allows
    // editing the pick up until kickoff. points stays null until settlement.
    const prediction = await Prediction.findOneAndUpdate(
      { userId: req.user!._id, matchId: match._id },
      { $set: { pick } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    sendSuccess(res, { matchId: match._id, pick: prediction.pick }, 'Prediction saved', 201);
  } catch (err) {
    // Duplicate-key race → treat as a normal update outcome.
    if ((err as { code?: number }).code === 11000) {
      sendError(res, 'Could not save prediction, please retry', 409);
      return;
    }
    sendError(res, 'Failed to save prediction', 500);
  }
};

// GET /api/v1/predictions/mine — the user's picks, results, and total points.
export const getMyPredictions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const preds = await Prediction.find({ userId: req.user!._id })
      .populate<{ matchId: IMatch }>('matchId')
      .sort({ createdAt: -1 });

    const items = preds
      .filter((p) => p.matchId) // guard against a deleted match
      .map((p) => {
        const m = p.matchId as unknown as IMatch;
        return {
          predictionId: p._id,
          matchId: m._id,
          stage: m.stage,
          groupLabel: m.groupLabel || null,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          kickoffUtc: m.kickoffUtc,
          status: m.status,
          homeScore: m.homeScore ?? null,
          awayScore: m.awayScore ?? null,
          pick: p.pick,
          points: p.points,
          settled: p.points !== null,
        };
      });

    const totalPoints = items.reduce((sum, i) => sum + (i.points || 0), 0);
    sendSuccess(res, { items, totalPoints }, 'My predictions fetched');
  } catch {
    sendError(res, 'Failed to fetch your predictions', 500);
  }
};

// Resolve a display name for each user id (names live on profile collections,
// not on User). Falls back to the email handle.
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

// GET /api/v1/predictions/leaderboard — all users ranked by total points.
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
      rank: i + 1,
      userId: r._id,
      name: names.get(String(r._id)) || 'Member',
      totalPoints: r.totalPoints,
      correct: r.correct,
      predictions: r.predictions,
      isMe: meId === String(r._id),
    }));

    sendSuccess(res, leaderboard, 'Leaderboard fetched');
  } catch {
    sendError(res, 'Failed to fetch leaderboard', 500);
  }
};

// POST /api/v1/predictions/sync — triggered by the scheduler (GitHub Actions).
// Guarded by a shared secret header, NOT user auth.
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
