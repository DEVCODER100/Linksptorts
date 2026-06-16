// ── FIFA World Cup 2026 knockout bracket — static structure ──────────────────
// 48 teams, 12 groups (A–L). Knockout = Round of 32 (matches 73–88) → R16
// (89–96) → QF (97–100) → SF (101–102) → Bronze (103) → Final (104).
// Each match has two slots whose occupant is resolved from group standings,
// FIFA's third-place allocation, or earlier match results.

export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;

export type Round = 'R32' | 'R16' | 'QF' | 'SF' | 'BRONZE' | 'FINAL';

export type Slot =
  | { type: 'GROUP_WINNER'; group: string }
  | { type: 'GROUP_RUNNER_UP'; group: string }
  | { type: 'GROUP_THIRD'; candidates: string[] } // third place from one of these groups
  | { type: 'WINNER_OF'; matchNo: number }
  | { type: 'RUNNER_UP_OF'; matchNo: number };

export interface BracketMatch {
  matchNo: number;
  round: Round;
  date: string; // YYYY-MM-DD (kickoff time filled from the API; placeholder 19:00 UTC)
  venue: string;
  home: Slot;
  away: Slot;
}

const w = (group: string): Slot => ({ type: 'GROUP_WINNER', group });
const r = (group: string): Slot => ({ type: 'GROUP_RUNNER_UP', group });
const t = (candidates: string[]): Slot => ({ type: 'GROUP_THIRD', candidates });
const W = (matchNo: number): Slot => ({ type: 'WINNER_OF', matchNo });
const RU = (matchNo: number): Slot => ({ type: 'RUNNER_UP_OF', matchNo });

export const BRACKET: BracketMatch[] = [
  // ── Round of 32 ────────────────────────────────────────────────────────────
  { matchNo: 73, round: 'R32', date: '2026-06-28', venue: 'Los Angeles Stadium', home: r('A'), away: r('B') },
  { matchNo: 74, round: 'R32', date: '2026-06-29', venue: 'Boston Stadium', home: w('E'), away: t(['A', 'B', 'C', 'D', 'F']) },
  { matchNo: 75, round: 'R32', date: '2026-06-29', venue: 'Estadio Monterrey', home: w('F'), away: r('C') },
  { matchNo: 76, round: 'R32', date: '2026-06-29', venue: 'Houston Stadium', home: w('C'), away: r('F') },
  { matchNo: 77, round: 'R32', date: '2026-06-30', venue: 'New York New Jersey Stadium', home: w('I'), away: t(['C', 'D', 'F', 'G', 'H']) },
  { matchNo: 78, round: 'R32', date: '2026-06-30', venue: 'Dallas Stadium', home: r('E'), away: r('I') },
  { matchNo: 79, round: 'R32', date: '2026-06-30', venue: 'Mexico City Stadium', home: w('A'), away: t(['C', 'E', 'F', 'H', 'I']) },
  { matchNo: 80, round: 'R32', date: '2026-07-01', venue: 'Atlanta Stadium', home: w('L'), away: t(['E', 'H', 'I', 'J', 'K']) },
  { matchNo: 81, round: 'R32', date: '2026-07-01', venue: 'San Francisco Bay Area Stadium', home: w('D'), away: t(['B', 'E', 'F', 'I', 'J']) },
  { matchNo: 82, round: 'R32', date: '2026-07-01', venue: 'Seattle Stadium', home: w('G'), away: t(['A', 'E', 'H', 'I', 'J']) },
  { matchNo: 83, round: 'R32', date: '2026-07-02', venue: 'Toronto Stadium', home: r('K'), away: r('L') },
  { matchNo: 84, round: 'R32', date: '2026-07-02', venue: 'Los Angeles Stadium', home: w('H'), away: r('J') },
  { matchNo: 85, round: 'R32', date: '2026-07-02', venue: 'BC Place Vancouver', home: w('B'), away: t(['E', 'F', 'G', 'I', 'J']) },
  { matchNo: 86, round: 'R32', date: '2026-07-03', venue: 'Miami Stadium', home: w('J'), away: r('H') },
  { matchNo: 87, round: 'R32', date: '2026-07-03', venue: 'Kansas City Stadium', home: w('K'), away: t(['D', 'E', 'I', 'J', 'L']) },
  { matchNo: 88, round: 'R32', date: '2026-07-03', venue: 'Dallas Stadium', home: r('D'), away: r('G') },
  // ── Round of 16 ────────────────────────────────────────────────────────────
  { matchNo: 89, round: 'R16', date: '2026-07-04', venue: 'Philadelphia Stadium', home: W(74), away: W(77) },
  { matchNo: 90, round: 'R16', date: '2026-07-04', venue: 'Houston Stadium', home: W(73), away: W(75) },
  { matchNo: 91, round: 'R16', date: '2026-07-05', venue: 'New York New Jersey Stadium', home: W(76), away: W(78) },
  { matchNo: 92, round: 'R16', date: '2026-07-05', venue: 'Mexico City Stadium', home: W(79), away: W(80) },
  { matchNo: 93, round: 'R16', date: '2026-07-06', venue: 'Dallas Stadium', home: W(83), away: W(84) },
  { matchNo: 94, round: 'R16', date: '2026-07-06', venue: 'Seattle Stadium', home: W(81), away: W(82) },
  { matchNo: 95, round: 'R16', date: '2026-07-07', venue: 'Atlanta Stadium', home: W(86), away: W(88) },
  { matchNo: 96, round: 'R16', date: '2026-07-07', venue: 'BC Place Vancouver', home: W(85), away: W(87) },
  // ── Quarter-finals ─────────────────────────────────────────────────────────
  { matchNo: 97, round: 'QF', date: '2026-07-09', venue: 'Boston Stadium', home: W(89), away: W(90) },
  { matchNo: 98, round: 'QF', date: '2026-07-10', venue: 'Los Angeles Stadium', home: W(93), away: W(94) },
  { matchNo: 99, round: 'QF', date: '2026-07-11', venue: 'Miami Stadium', home: W(91), away: W(92) },
  { matchNo: 100, round: 'QF', date: '2026-07-11', venue: 'Kansas City Stadium', home: W(95), away: W(96) },
  // ── Semi-finals ────────────────────────────────────────────────────────────
  { matchNo: 101, round: 'SF', date: '2026-07-14', venue: 'Dallas Stadium', home: W(97), away: W(98) },
  { matchNo: 102, round: 'SF', date: '2026-07-15', venue: 'Atlanta Stadium', home: W(99), away: W(100) },
  // ── Bronze final & Final ───────────────────────────────────────────────────
  { matchNo: 103, round: 'BRONZE', date: '2026-07-18', venue: 'Miami Stadium', home: RU(101), away: RU(102) },
  { matchNo: 104, round: 'FINAL', date: '2026-07-19', venue: 'New York New Jersey Stadium', home: W(101), away: W(102) },
];

// Human label for an unresolved slot (used in the UI before teams are known).
export const slotLabel = (s: Slot): string => {
  switch (s.type) {
    case 'GROUP_WINNER': return `Winner Group ${s.group}`;
    case 'GROUP_RUNNER_UP': return `Runner-up Group ${s.group}`;
    case 'GROUP_THIRD': return `3rd: ${s.candidates.join('/')}`;
    case 'WINNER_OF': return `Winner Match ${s.matchNo}`;
    case 'RUNNER_UP_OF': return `Loser Match ${s.matchNo}`;
  }
};

export const ROUND_LABELS: Record<Round, string> = {
  R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarter-finals', SF: 'Semi-finals', BRONZE: 'Third-place play-off', FINAL: 'Final',
};
