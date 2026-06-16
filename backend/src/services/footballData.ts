// Server-side client for football-data.org (free tier). The API key is read from
// env and NEVER sent to the client. Source of truth for results & standings.
const BASE_URL = 'https://api.football-data.org/v4';
const COMPETITION = process.env.FOOTBALL_DATA_COMPETITION || 'WC';

const authHeaders = () => {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error('FOOTBALL_DATA_API_KEY is not set');
  return { 'X-Auth-Token': key };
};

const get = async (path: string) => {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`football-data.org ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
};

// ── Standings ──────────────────────────────────────────────────────────────
export interface StandingRow {
  position: number;
  team: string;
  played: number;
  points: number;
  goalDifference: number;
  goalsFor: number;
}
export interface GroupTable {
  group: string; // 'A'..'L'
  table: StandingRow[];
}

interface ApiStandings {
  standings?: {
    stage: string;
    type: string;
    group: string | null; // 'GROUP_A'
    table: {
      position: number;
      team: { name: string | null };
      playedGames: number;
      points: number;
      goalDifference: number;
      goalsFor: number;
    }[];
  }[];
}

export const fetchStandings = async (): Promise<GroupTable[]> => {
  const data = (await get(`/competitions/${COMPETITION}/standings`)) as ApiStandings;
  return (data.standings || [])
    .filter((s) => s.type === 'TOTAL' && s.group)
    .map((s) => ({
      group: (s.group as string).replace('GROUP_', ''),
      table: (s.table || []).map((r) => ({
        position: r.position,
        team: r.team?.name || 'TBD',
        played: r.playedGames,
        points: r.points,
        goalDifference: r.goalDifference,
        goalsFor: r.goalsFor,
      })),
    }));
};

// ── Knockout match results ───────────────────────────────────────────────────
export interface ApiResult {
  extId: string;
  stage: string;
  status: 'upcoming' | 'live' | 'finished';
  utcDate: string;
  homeTeam: string | null;
  awayTeam: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winner: 'HOME' | 'AWAY' | null; // overall winner incl. ET/penalties
}

interface ApiMatches {
  matches?: {
    id: number;
    stage: string;
    utcDate: string;
    status: string;
    homeTeam: { name: string | null };
    awayTeam: { name: string | null };
    score: { winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null; fullTime: { home: number | null; away: number | null } };
  }[];
}

const mapStatus = (s: string): ApiResult['status'] =>
  ['IN_PLAY', 'PAUSED', 'SUSPENDED'].includes(s) ? 'live' : ['FINISHED', 'AWARDED'].includes(s) ? 'finished' : 'upcoming';

// All non-group-stage (knockout) matches, normalized.
export const fetchKnockoutResults = async (): Promise<ApiResult[]> => {
  const data = (await get(`/competitions/${COMPETITION}/matches`)) as ApiMatches;
  return (data.matches || [])
    .filter((m) => m.stage && m.stage !== 'GROUP_STAGE')
    .map((m) => ({
      extId: String(m.id),
      stage: m.stage,
      status: mapStatus(m.status),
      utcDate: m.utcDate,
      homeTeam: m.homeTeam?.name ?? null,
      awayTeam: m.awayTeam?.name ?? null,
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null,
      winner: m.score?.winner === 'HOME_TEAM' ? 'HOME' : m.score?.winner === 'AWAY_TEAM' ? 'AWAY' : null,
    }));
};
