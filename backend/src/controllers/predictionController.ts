import { Response } from 'express';
import { AuthRequest } from '../types';
import { PredictionMatch, IPredictionMatch } from '../models/PredictionMatch';
import { sendSuccess, sendError } from '../utils/response';

/** Shape each match for the client — derived tallies only, never the raw votes array. */
const serializeMatch = (match: IPredictionMatch, userId?: string) => {
  const teamACount = match.votes.filter((v) => v.pick === 'teamA').length;
  const teamBCount = match.votes.filter((v) => v.pick === 'teamB').length;
  const myPick = userId
    ? match.votes.find((v) => String(v.userId) === String(userId))?.pick ?? null
    : null;
  return {
    _id: match._id,
    teamA: match.teamA,
    teamAFlag: match.teamAFlag,
    teamB: match.teamB,
    teamBFlag: match.teamBFlag,
    matchDate: match.matchDate,
    stage: match.stage,
    status: match.status,
    result: match.result,
    teamACount,
    teamBCount,
    total: teamACount + teamBCount,
    myPick,
  };
};

// GET /api/v1/predictions — list matches with vote tallies (+ caller's own pick if logged in)
export const getMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matches = await PredictionMatch.find({}).sort({ matchDate: 1 });
    const userId = req.user?._id ? String(req.user._id) : undefined;
    sendSuccess(res, matches.map((m) => serializeMatch(m, userId)), 'Matches fetched');
  } catch {
    sendError(res, 'Failed to fetch matches', 500);
  }
};

// POST /api/v1/predictions/:id/vote — cast or change a vote (one per user per match)
export const voteOnMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pick } = req.body as { pick?: string };
    if (pick !== 'teamA' && pick !== 'teamB') {
      sendError(res, 'Pick must be either teamA or teamB', 400);
      return;
    }

    const match = await PredictionMatch.findById(req.params.id);
    if (!match) {
      sendError(res, 'Match not found', 404);
      return;
    }

    if (match.status !== 'upcoming' || match.matchDate.getTime() <= Date.now()) {
      sendError(res, 'Voting is closed for this match', 400);
      return;
    }

    const userId = req.user!._id;
    const existing = match.votes.find((v) => String(v.userId) === String(userId));
    if (existing) {
      existing.pick = pick;
      existing.votedAt = new Date();
    } else {
      match.votes.push({ userId, pick, votedAt: new Date() });
    }
    await match.save();

    sendSuccess(res, serializeMatch(match, String(userId)), 'Vote recorded');
  } catch {
    sendError(res, 'Failed to record vote', 500);
  }
};

// POST /api/v1/predictions — admin: create a fixture
export const createMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamA, teamAFlag, teamB, teamBFlag, matchDate, stage } = req.body;
    if (!teamA || !teamB || !matchDate) {
      sendError(res, 'teamA, teamB and matchDate are required', 400);
      return;
    }
    const match = await PredictionMatch.create({ teamA, teamAFlag, teamB, teamBFlag, matchDate, stage });
    sendSuccess(res, serializeMatch(match), 'Match created', 201);
  } catch {
    sendError(res, 'Failed to create match', 500);
  }
};

// PATCH /api/v1/predictions/:id — admin: update status/result/details
export const updateMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allowed: (keyof IPredictionMatch)[] = ['teamA', 'teamAFlag', 'teamB', 'teamBFlag', 'matchDate', 'stage', 'status', 'result'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const match = await PredictionMatch.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!match) {
      sendError(res, 'Match not found', 404);
      return;
    }
    sendSuccess(res, serializeMatch(match), 'Match updated');
  } catch {
    sendError(res, 'Failed to update match', 500);
  }
};
