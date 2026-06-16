import { MatchStatus } from '../models/Match';

// Server-side client for football-data.org (free tier).
// The API key is read from env and NEVER sent to the client.
const BASE_URL = 'https://api.football-data.org/v4';
const COMPETITION = process.env.FOOTBALL_DATA_COMPETITION || 'WC';

export interface NormalizedMatch {
  extId: string;
  stage: string;
  groupLabel?: string;
  homeTeam: string;
  awayTeam: string;
  kickoffUtc: Date;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  // Overall winner per the API (accounts for extra time / penalties in knockouts).
  // Used only for settlement of knockout fixtures; not persisted.
  winner: 'HOME' | 'AWAY' | 'DRAW' | null;
}

// Raw shape (subset) returned by football-data.org /v4/competitions/{code}/matches
interface ApiMatch {
  id: number;
  stage: string;
  group: string | null;
  utcDate: string;
  status: string;
  homeTeam: { name: string | null };
  awayTeam: { name: string | null };
  score: {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    fullTime: { home: number | null; away: number | null };
  };
}

const mapWinner = (w: ApiMatch['score']['winner']): NormalizedMatch['winner'] => {
  if (w === 'HOME_TEAM') return 'HOME';
  if (w === 'AWAY_TEAM') return 'AWAY';
  if (w === 'DRAW') return 'DRAW';
  return null;
};

const mapStatus = (apiStatus: string): MatchStatus => {
  switch (apiStatus) {
    case 'IN_PLAY':
    case 'PAUSED':
    case 'SUSPENDED':
      return 'live';
    case 'FINISHED':
    case 'AWARDED':
      return 'finished';
    case 'POSTPONED':
      return 'postponed';
    case 'CANCELLED':
      return 'cancelled';
    case 'SCHEDULED':
    case 'TIMED':
    default:
      return 'upcoming';
  }
};

const normalize = (m: ApiMatch): NormalizedMatch => ({
  extId: String(m.id),
  stage: m.stage,
  groupLabel: m.group || undefined,
  homeTeam: m.homeTeam?.name || 'TBD',
  awayTeam: m.awayTeam?.name || 'TBD',
  kickoffUtc: new Date(m.utcDate),
  status: mapStatus(m.status),
  homeScore: m.score?.fullTime?.home ?? null,
  awayScore: m.score?.fullTime?.away ?? null,
  winner: mapWinner(m.score?.winner ?? null),
});

/** Fetch & normalize all matches for the configured competition (default: WC). */
export const fetchWorldCupMatches = async (): Promise<NormalizedMatch[]> => {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) {
    throw new Error('FOOTBALL_DATA_API_KEY is not set');
  }

  const res = await fetch(`${BASE_URL}/competitions/${COMPETITION}/matches`, {
    headers: { 'X-Auth-Token': key },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`football-data.org responded ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { matches?: ApiMatch[] };
  return (data.matches || []).map(normalize);
};
