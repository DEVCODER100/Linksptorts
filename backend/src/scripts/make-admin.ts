import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { User } from '../models/User';

// Promote a user to admin (or create an admin) so the admin dashboard is reachable.
//   npm run make-admin -- you@example.com                  (promote existing user)
//   npm run make-admin -- you@example.com YourPassword123  (set password / create)
const run = async () => {
  const email = (process.argv[2] || '').toLowerCase().trim();
  const password = process.argv[3];
  if (!email) { console.error('Usage: npm run make-admin -- <email> [password]'); process.exit(1); }

  await connectDB();
  let user = await User.findOne({ email }).select('+passwordHash');
  if (user) {
    user.role = 'admin';
    user.isVerified = true;
    user.isApproved = true;
    if (password) user.passwordHash = password; // hashed by the User pre-save hook
    await user.save();
    console.log(`✅ ${email} is now an admin${password ? ' (password updated)' : ''}.`);
  } else {
    if (!password) { console.error('No such user — pass a password to create one: npm run make-admin -- <email> <password>'); process.exit(1); }
    user = await User.create({ email, passwordHash: password, role: 'admin', isVerified: true, isApproved: true });
    console.log(`✅ Created admin ${email}.`);
  }
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });
