import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User';

const check = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const users = await User.find({}, 'email role isVerified passwordHash');
  console.log('Current Users in DB:');
  console.log(JSON.stringify(users, null, 2));
  await mongoose.disconnect();
};

check();
