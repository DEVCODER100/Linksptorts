import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { PredictionMatch } from '../models/PredictionMatch';

// FIFA World Cup 2026 — sample upcoming fixtures for the prediction game.
// Dates are set in the near future so matches are open for voting.
const day = (offset: number, hh = 21, mm = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hh, mm, 0, 0);
  return d;
};

const matches = [
  { teamA: 'Argentina', teamAFlag: '🇦🇷', teamB: 'France',      teamBFlag: '🇫🇷', stage: 'Group Stage', matchDate: day(2) },
  { teamA: 'Brazil',    teamAFlag: '🇧🇷', teamB: 'Germany',     teamBFlag: '🇩🇪', stage: 'Group Stage', matchDate: day(2, 18) },
  { teamA: 'Spain',     teamAFlag: '🇪🇸', teamB: 'England',     teamBFlag: '🏴',  stage: 'Group Stage', matchDate: day(3) },
  { teamA: 'Portugal',  teamAFlag: '🇵🇹', teamB: 'Netherlands', teamBFlag: '🇳🇱', stage: 'Group Stage', matchDate: day(3, 18) },
  { teamA: 'India',     teamAFlag: '🇮🇳', teamB: 'Japan',       teamBFlag: '🇯🇵', stage: 'Group Stage', matchDate: day(4) },
  { teamA: 'USA',       teamAFlag: '🇺🇸', teamB: 'Mexico',      teamBFlag: '🇲🇽', stage: 'Group Stage', matchDate: day(4, 18) },
  { teamA: 'Belgium',   teamAFlag: '🇧🇪', teamB: 'Croatia',     teamBFlag: '🇭🇷', stage: 'Group Stage', matchDate: day(5) },
  { teamA: 'Italy',     teamAFlag: '🇮🇹', teamB: 'Uruguay',     teamBFlag: '🇺🇾', stage: 'Group Stage', matchDate: day(5, 18) },
  { teamA: 'Morocco',   teamAFlag: '🇲🇦', teamB: 'Senegal',     teamBFlag: '🇸🇳', stage: 'Group Stage', matchDate: day(6) },
  { teamA: 'Colombia',  teamAFlag: '🇨🇴', teamB: 'South Korea', teamBFlag: '🇰🇷', stage: 'Group Stage', matchDate: day(6, 18) },
];

const run = async () => {
  await connectDB();
  let made = 0;
  for (const m of matches) {
    const exists = await PredictionMatch.findOne({ teamA: m.teamA, teamB: m.teamB, stage: m.stage });
    if (exists) { console.log(`skip ${m.teamA} vs ${m.teamB} (exists)`); continue; }
    await PredictionMatch.create({ ...m, status: 'upcoming', result: null, votes: [] });
    made++;
    console.log(`match: ${m.teamA} vs ${m.teamB} — ${m.matchDate.toISOString()}`);
  }
  console.log(`\n✅ Done. Created ${made} new prediction matches.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });
