import { Match } from '../models/Match';
import { Prediction, PredictionPick } from '../models/Prediction';
import { fetchWorldCupMatches, NormalizedMatch } from './footballData';

export interface SyncResult {
  fetched: number;
  upserted: number;
  settled: number; // predictions newly scored this run
}

// Determine the correct pick for a finished match.
//  - Group stage: from the final score (HOME / AWAY / DRAW).
//  - Knockout: the team that advanced, per the API winner (handles ET/penalties).
// Returns null if it can't be determined (don't settle — leave points null).
const correctPickFor = (m: NormalizedMatch): PredictionPick | null => {
  if (m.stage === 'GROUP_STAGE') {
    if (m.homeScore == null || m.awayScore == null) return null;
    if (m.homeScore > m.awayScore) return 'HOME';
    if (m.awayScore > m.homeScore) return 'AWAY';
    return 'DRAW';
  }
  // Knockout — must resolve to one side that advanced.
  if (m.winner === 'HOME') return 'HOME';
  if (m.winner === 'AWAY') return 'AWAY';
  return null;
};

/**
 * Pull World Cup matches, upsert fixtures/statuses/scores, then settle
 * predictions for finished matches. Idempotent end-to-end:
 *  - match upserts keyed on extId
 *  - settlement only touches predictions whose points are still null,
 *    so re-running never double-counts.
 */
export const syncPredictions = async (): Promise<SyncResult> => {
  const matches = await fetchWorldCupMatches();

  const ops = matches.map((m) => ({
    updateOne: {
      filter: { extId: m.extId },
      update: {
        $set: {
          stage: m.stage,
          groupLabel: m.groupLabel,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          kickoffUtc: m.kickoffUtc,
          status: m.status,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
        },
      },
      upsert: true,
    },
  }));

  if (ops.length > 0) {
    await Match.bulkWrite(ops, { ordered: false });
  }

  // ── Settlement ───────────────────────────────────────────────────────────
  const finished = matches.filter((m) => m.status === 'finished');
  let settled = 0;

  if (finished.length > 0) {
    // Map extId → our Match _id (matches were just upserted).
    const docs = await Match.find({ extId: { $in: finished.map((m) => m.extId) } }).select('_id extId');
    const idByExt = new Map(docs.map((d) => [d.extId, d._id]));

    for (const m of finished) {
      const correct = correctPickFor(m);
      const matchId = idByExt.get(m.extId);
      if (!correct || !matchId) continue;

      // Idempotent: only score predictions that haven't been settled yet.
      const correctRes = await Prediction.updateMany(
        { matchId, points: null, pick: correct },
        { $set: { points: 3 } }
      );
      const wrongRes = await Prediction.updateMany(
        { matchId, points: null, pick: { $ne: correct } },
        { $set: { points: 0 } }
      );
      settled += (correctRes.modifiedCount || 0) + (wrongRes.modifiedCount || 0);
    }
  }

  return { fetched: matches.length, upserted: ops.length, settled };
};
