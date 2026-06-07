import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User';

const email = process.argv[2];
if (!email) { console.error('Usage: npx ts-node make-admin.ts <email>'); process.exit(1); }

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const user = await User.findOneAndUpdate({ email }, { role: 'admin', isVerified: true }, { new: true });
  if (!user) { console.error('User not found:', email); process.exit(1); }
  console.log(`✅ ${user.email} is now admin`);
  await mongoose.disconnect();
};

run().catch(console.error);
