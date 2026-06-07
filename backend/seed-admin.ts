import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const email = 'admin@linksports.in';
  const password = 'Admin@123';

  const existing = await User.findOne({ email }).select('+passwordHash');

  if (existing) {
    existing.role = 'admin';
    existing.isVerified = true;
    existing.isSuspended = false;
    existing.passwordHash = password; // pre-save hook hashes it
    await existing.save();
    console.log('✅ Existing user updated to admin:', email);
  } else {
    await User.create({
      email,
      passwordHash: password, // pre-save hook hashes it
      role: 'admin',
      isVerified: true,
      authProvider: 'email',
    });
    console.log('✅ Admin user created:', email);
  }

  await mongoose.disconnect();
};

run().catch(console.error);
