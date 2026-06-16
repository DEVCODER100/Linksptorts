import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types';
import { Match, IMatch } from '../models/Match';
import { GroupStanding } from '../models/GroupStanding';
import { Prediction } from '../models/Prediction';
import { User } from '../models/User';
import { AthleteProfile } from '../models/AthleteProfile';
import { CoachProfile } from '../models/CoachProfile';
import { Organization } from '../models/Organization';
import { syncPredictions } from '../services/predictionSync';
import { candidateOpponents } from '../services/thirdPlaceResolver';
import { GroupTable } from '../services/footballData';
import { Slot, slotLabel, ROUND_LABELS, Round } from '../config/wc2026Bracket';
import { sendSuccess, sendError } from '../utils/response';

const isLocked = (m: IMatch) => m.status !== 'upcoming' || new Date(m.kickoffUtc).getTime() <= Date.now();

const serializeMatch = (m: IMatch) => {
  const home = m.home as unknown as Slot;
  const away = m.away as unknown as Slot;
  return {
    matchNo: m.matchNo,
    round: m.round,
    roundLabel: ROUND_LABELS[m.round as Round] || m.round,
    kickoffUtc: m.kickoffUtc,
    venue: m.venue || null,
    homeSlot: home,
    awaySlot: away,
    homeLabel: slotLabel(home),
    awayLabel: slotLabel(away),
    homeTeam: m.homeTeam || null,
    awayTeam: m.awayTeam || null,
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
    status: m.status,
    winner: m.winner ?? null,
    locked: isLocked(m),
    opponentMatch: home.type === 'GROUP_THIRD' || away.type === 'GROUP_THIRD',
  };
};

const standingsToTables = (docs: { group: string; table: GroupTable['table'] }[]): GroupTable[] =>
  docs.map((d) => ({ group: d.group, table: d.table }));

// GET /api/v1/predictions — full bracket + opponent candidates + the caller's picks.
export const getMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [matches, standings] = await Promise.all([
      Match.find({}).sort({ matchNo: 1 }),
      GroupStanding.find({}),
    ]);
    const tables = standingsToTables(standings as unknown as { group: string; table: GroupTable['table'] }[]);

    // Candidate third-place opponents for each opponent match (from current standings).
    const candidates: Record<number, { group: string; team: string }[]> = {};
    for (const m of matches) {
      const away = m.away as unknown as Slot;
      if (away.type === 'GROUP_THIRD') candidates[m.matchNo] = candidateOpponents(away.candidates, tables);
    }

    let myPicks: Record<string, string> = {};
    if (req.user?._id) {
      const preds = await Prediction.find({ userId: req.user._id }).select('key pickTeam');
      myPicks = Object.fromEntries(preds.map((p) => [p.key, p.pickTeam]));
    }

    sendSuccess(res, { matches: matches.map(serializeMatch), candidates, myPicks }, 'Bracket fetched');
  } catch {
    sendError(res, 'Failed to fetch the bracket', 500);
  }
};

// POST /api/v1/predictions/pick — save one pick (winner "M{n}" or opponent "OPP{n}").
// Server-side lock is authoritative; the UI disabling is not enough.
export const createPick = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key, pickTeam } = req.body as { key?: string; pickTeam?: string };
    const match = /^(M|OPP)(\d+)$/.exec(key || '');
    if (!match) { sendError(res, 'Invalid pick key', 400); return; }
    if (!pickTeam || typeof pickTeam !== 'string') { sendError(res, 'A team is required', 400); return; }

    const isOpp = match[1] === 'OPP';
    const matchNo = Number(match[2]);
    const doc = await Match.findOne({ matchNo });
    if (!doc) { sendError(res, 'Match not found', 404); return; }

    if (isLocked(doc)) { sendError(res, 'This match is locked', 409, 'LOCKED'); return; }

    if (isOpp) {
      const away = doc.away as unknown as Slot;
      if (away.type !== 'GROUP_THIRD') { sendError(res, 'This match has no opponent to predict', 400); return; }
      if (doc.awayTeam) { sendError(res, 'The opponent is already decided', 409, 'LOCKED'); return; }
      // Validate against candidate third-place teams when standings are available.
      const standings = await GroupStanding.find({});
      const cands = candidateOpponents(away.candidates, standingsToTables(standings as unknown as { group: string; table: GroupTable['table'] }[]));
      if (cands.length && !cands.some((c) => c.team === pickTeam)) {
        sendError(res, 'That team is not a possible opponent for this match', 400);
        return;
      }
    }

    await Prediction.findOneAndUpdate(
      { userId: req.user!._id, key: key as string },
      { $set: { pickTeam } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    sendSuccess(res, { key, pickTeam }, 'Pick saved', 201);
  } catch (err) {
    if ((err as { code?: number }).code === 11000) { sendError(res, 'Could not save, please retry', 409); return; }
    sendError(res, 'Failed to save pick', 500);
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
