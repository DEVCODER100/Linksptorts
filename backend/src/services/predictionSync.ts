import { Match, IMatch } from '../models/Match';
import { GroupStanding } from '../models/GroupStanding';
import { Prediction } from '../models/Prediction';
import { BRACKET, Slot } from '../config/wc2026Bracket';
import { fetchStandings, fetchKnockoutResults, GroupTable, ApiResult } from './footballData';
import { resolveFromStandings } from './thirdPlaceResolver';

export interface SyncResult {
  matchesEnsured: number;
  groupsSynced: number;
  teamsResolved: number;
  resultsIngested: number;
  predictionsSettled: number;
}

// Idempotently award points: +3 for a correct pick, 0 otherwise — only ever
// touching predictions whose points are still null, so re-runs never double-count.
const settleKey = async (key: string, correctTeam: string): Promise<number> => {
  const a = await Prediction.updateMany({ key, points: null, pickTeam: correctTeam }, { $set: { points: 3 } });
  const b = await Prediction.updateMany({ key, points: null, pickTeam: { $ne: correctTeam } }, { $set: { points: 0 } });
  return (a.modifiedCount || 0) + (b.modifiedCount || 0);
};

// Insert the 32 knockout fixtures from static config if missing. Only structural
// fields are set on insert — resolved teams/scores are never clobbered.
export const ensureBracket = async (): Promise<number> => {
  const ops = BRACKET.map((m) => ({
    updateOne: {
      filter: { matchNo: m.matchNo },
      update: {
        $setOnInsert: {
          matchNo: m.matchNo,
          round: m.round,
          kickoffUtc: new Date(`${m.date}T19:00:00Z`),
          venue: m.venue,
          home: m.home,
          away: m.away,
          status: 'upcoming',
        },
      },
      upsert: true,
    },
  }));
  // Cast: bulkWrite's typing doesn't narrow the union Slot subdoc cleanly.
  const res = await Match.bulkWrite(ops as Parameters<typeof Match.bulkWrite>[0], { ordered: false });
  return (res.upsertedCount || 0);
};

const syncStandings = async (tables: GroupTable[]): Promise<number> => {
  const ops = tables.map((g) => ({
    updateOne: { filter: { group: g.group }, update: { $set: { table: g.table } }, upsert: true },
  }));
  if (ops.length) await GroupStanding.bulkWrite(ops, { ordered: false });
  return tables.length;
};

// A group's table is final once every team has played its 3 matches.
const isGroupComplete = (g?: GroupTable) => !!g && g.table.length >= 4 && g.table.every((r) => r.played >= 3);

const teamAt = (g: GroupTable | undefined, position: number): string | null => {
  if (!isGroupComplete(g)) return null;
  return g!.table.find((r) => r.position === position)?.team ?? null;
};

/** Full sync: bracket → standings → results → cascade slot resolution. */
export const syncPredictions = async (): Promise<SyncResult> => {
  const matchesEnsured = await ensureBracket();

  const [tables, results] = await Promise.all([fetchStandings(), fetchKnockoutResults()]);
  const groupsSynced = await syncStandings(tables);

  const byGroup = new Map(tables.map((g) => [g.group, g]));

  // Once every group is final, resolve the 8 third-place opponent slots via the
  // FIFA allocation table (matchNo → team filling that match's GROUP_THIRD slot).
  const allGroupsComplete = tables.length >= 12 && tables.every(isGroupComplete);
  const oppByMatch = allGroupsComplete ? resolveFromStandings(tables) : new Map<number, string>();

  // Index API results by an unordered team-pair key for mapping to our fixtures.
  const pairKey = (a: string, b: string) => [a, b].sort().join(' | ');
  const resultByPair = new Map<string, ApiResult>();
  for (const r of results) if (r.homeTeam && r.awayTeam) resultByPair.set(pairKey(r.homeTeam, r.awayTeam), r);

  // Winner/loser team per match, built up as we walk the bracket in order so
  // later rounds resolve from earlier results in a single pass.
  const winnerOf = new Map<number, string>();
  const loserOf = new Map<number, string>();

  const resolveSlot = (s: Slot, matchNo: number): string | null => {
    switch (s.type) {
      case 'GROUP_WINNER': return teamAt(byGroup.get(s.group), 1);
      case 'GROUP_RUNNER_UP': return teamAt(byGroup.get(s.group), 2);
      case 'GROUP_THIRD': return oppByMatch.get(matchNo) ?? null; // FIFA allocation
      case 'WINNER_OF': return winnerOf.get(s.matchNo) ?? null;
      case 'RUNNER_UP_OF': return loserOf.get(s.matchNo) ?? null;
    }
  };

  const docs = await Match.find({}).sort({ matchNo: 1 });
  const byNo = new Map(docs.map((d) => [d.matchNo, d]));
  let teamsResolved = 0;
  let resultsIngested = 0;

  for (const cfg of BRACKET) {
    const doc = byNo.get(cfg.matchNo) as IMatch | undefined;
    if (!doc) continue;

    const homeTeam = resolveSlot(cfg.home, cfg.matchNo);
    const awayTeam = resolveSlot(cfg.away, cfg.matchNo);
    if ((homeTeam && homeTeam !== doc.homeTeam) || (awayTeam && awayTeam !== doc.awayTeam)) teamsResolved++;
    if (homeTeam) doc.homeTeam = homeTeam;
    if (awayTeam) doc.awayTeam = awayTeam;

    // Attach the real result if both teams are known and the API has the fixture.
    if (doc.homeTeam && doc.awayTeam) {
      const r = resultByPair.get(pairKey(doc.homeTeam, doc.awayTeam));
      if (r) {
        doc.extId = r.extId;
        doc.status = r.status;
        doc.kickoffUtc = new Date(r.utcDate);
        // Map API home/away scores onto our orientation by team name.
        doc.homeScore = r.homeTeam === doc.homeTeam ? r.homeScore : r.awayScore;
        doc.awayScore = r.homeTeam === doc.homeTeam ? r.awayScore : r.homeScore;
        const winTeam = r.winner === 'HOME' ? r.homeTeam : r.winner === 'AWAY' ? r.awayTeam : null;
        if (winTeam) {
          doc.winner = winTeam === doc.homeTeam ? 'home' : 'away';
          winnerOf.set(cfg.matchNo, winTeam);
          loserOf.set(cfg.matchNo, winTeam === doc.homeTeam ? doc.awayTeam : doc.homeTeam);
        }
        resultsIngested++;
      }
    }

    await doc.save();
  }

  // ── Settlement ───────────────────────────────────────────────────────────
  let predictionsSettled = 0;
  // Winner picks: score against the actual winner of each finished match.
  for (const [matchNo, winTeam] of winnerOf) {
    predictionsSettled += await settleKey(`M${matchNo}`, winTeam);
  }
  // Opponent picks: score against the real third-place team in each slot.
  for (const [matchNo, team] of oppByMatch) {
    predictionsSettled += await settleKey(`OPP${matchNo}`, team);
  }

  return { matchesEnsured, groupsSynced, teamsResolved, resultsIngested, predictionsSettled };
};
