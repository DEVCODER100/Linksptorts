import { THIRD_PLACE_ALLOCATION } from '../config/thirdPlaceAllocation';
import { GroupTable } from './footballData';

export interface ThirdInfo {
  group: string;
  team: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
}

// The 3rd-placed team of each group (skips groups without a real 3rd-place team yet).
export const thirdsFromStandings = (groups: GroupTable[]): ThirdInfo[] => {
  const out: ThirdInfo[] = [];
  for (const g of groups) {
    const row = g.table.find((r) => r.position === 3);
    if (row && row.team && row.team !== 'TBD') {
      out.push({ group: g.group, team: row.team, points: row.points, goalDifference: row.goalDifference, goalsFor: row.goalsFor });
    }
  }
  return out;
};

// FIFA ranking of third-placed teams: points → goal difference → goals for.
// (Disciplinary/draw-of-lots tiebreaks aren't in the feed; fall back to group letter.)
export const bestEightThirds = (thirds: ThirdInfo[]): ThirdInfo[] =>
  [...thirds]
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.group.localeCompare(b.group))
    .slice(0, 8);

// Given the 8 qualifying groups + their 3rd-place team, map each opponent match
// (74,77,79,80,81,82,85,87) to the team that fills its third-place slot.
export const resolveOpponentSlots = (qualifyingGroups: string[], teamByGroup: Map<string, string>): Map<number, string> => {
  const key = [...qualifyingGroups].sort().join('');
  const alloc = THIRD_PLACE_ALLOCATION[key];
  const out = new Map<number, string>();
  if (!alloc) return out;
  for (const [matchNo, group] of Object.entries(alloc)) {
    const team = teamByGroup.get(group);
    if (team) out.set(Number(matchNo), team);
  }
  return out;
};

// Convenience: resolve straight from standings once the group stage is final.
export const resolveFromStandings = (groups: GroupTable[]): Map<number, string> => {
  const best8 = bestEightThirds(thirdsFromStandings(groups));
  if (best8.length < 8) return new Map();
  const teamByGroup = new Map(best8.map((t) => [t.group, t.team]));
  return resolveOpponentSlots(best8.map((t) => t.group), teamByGroup);
};

// Candidate third-place teams for an opponent match (the 3rd-place team of each
// candidate group that currently exists). Used to populate the prediction UI
// before the bracket is finalised.
export const candidateOpponents = (candidateGroups: string[], groups: GroupTable[]): { group: string; team: string }[] => {
  const byGroup = new Map(groups.map((g) => [g.group, g]));
  const out: { group: string; team: string }[] = [];
  for (const g of candidateGroups) {
    const row = byGroup.get(g)?.table.find((r) => r.position === 3);
    if (row && row.team && row.team !== 'TBD') out.push({ group: g, team: row.team });
  }
  return out;
};
