import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { syncPredictions } from '../services/predictionSync';

// Manual one-off sync (useful for verifying API coverage and for local runs).
// In production the same syncPredictions() runs via the secret-protected
// POST /api/v1/predictions/sync endpoint, triggered by GitHub Actions.
const run = async () => {
  await connectDB();
  try {
    const result = await syncPredictions();
    console.log(`✅ Sync complete — fetched ${result.fetched}, upserted ${result.upserted}.`);
  } catch (e) {
    console.error('❌ Sync failed:', (e as Error).message);
  }
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });
