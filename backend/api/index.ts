import 'dotenv/config';
import mongoose from 'mongoose';
import app from '../src/app';

// Cache the Mongo connection across warm serverless invocations.
let connPromise: Promise<typeof mongoose> | null = null;
async function ensureDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  if (!connPromise) {
    connPromise = mongoose.connect(process.env.MONGODB_URI as string, {
      serverSelectionTimeoutMS: 10000,
    });
  }
  await connPromise;
}

export default async function handler(req: any, res: any) {
  try {
    await ensureDB();
  } catch (e) {
    console.error('MongoDB connection failed:', e);
  }
  return (app as unknown as (req: any, res: any) => void)(req, res);
}
