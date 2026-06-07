import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { User } from '../models/User';

const seed = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding database...');

    // Create a test admin
    const adminEmail = 'admin@linksports.in';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        email: adminEmail,
        passwordHash: 'admin123',
        role: 'admin',
        isVerified: true,
      });
      console.log(`✅ Admin created: ${adminEmail} / admin123`);
    } else {
      console.log(`ℹ️ Admin already exists: ${adminEmail}`);
    }

    // Create a test athlete
    const athleteEmail = 'athlete@linksports.in';
    const existingAthlete = await User.findOne({ email: athleteEmail });

    if (!existingAthlete) {
      await User.create({
        email: athleteEmail,
        passwordHash: 'athlete123',
        role: 'athlete',
        isVerified: true,
      });
      console.log(`✅ Athlete created: ${athleteEmail} / athlete123`);
    } else {
      console.log(`ℹ️ Athlete already exists: ${athleteEmail}`);
    }

    console.log('✨ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
