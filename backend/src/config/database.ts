import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI as string;
  // Resilient connect: never crash the server if the DB is briefly unreachable
  // (e.g. Atlas IP whitelist / network). Keep retrying in the background and
  // let the HTTP server start so the app stays reachable and auto-reconnects.
  const attempt = async (): Promise<void> => {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error('MongoDB connection failed — retrying in 5s:', (error as Error).message);
      setTimeout(attempt, 5000);
    }
  };
  await attempt();
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
