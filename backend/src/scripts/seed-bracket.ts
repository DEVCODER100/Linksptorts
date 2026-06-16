import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { ensureBracket } from '../services/predictionSync';

// Insert the 32 knockout fixtures from static config (no API key needed).
// Teams/scores fill in later via the sync job once FOOTBALL_DATA_API_KEY is set.
const run = async () => {
  await connectDB();
  const inserted = await ensureBracket();
  console.log(`✅ Bracket ensured — ${inserted} new fixtures inserted (existing ones untouched).`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });
