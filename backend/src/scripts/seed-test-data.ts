import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/database';
import { User } from '../models/User';
import { AthleteProfile } from '../models/AthleteProfile';
import { CoachProfile } from '../models/CoachProfile';

const PASSWORD = 'TestPass123!';

const slug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
  '-' + Math.random().toString(36).slice(2, 8);

// ── Students / Athletes ──────────────────────────────────────────────
const athletes = [
  { name: 'Aarav Mehta',   sport: 'Cricket',    city: 'Mumbai',    state: 'Maharashtra', gender: 'male',   pos: 'Batsman' },
  { name: 'Diya Sharma',   sport: 'Badminton',  city: 'Hyderabad', state: 'Telangana',   gender: 'female', pos: 'Singles' },
  { name: 'Rohan Nair',    sport: 'Football',   city: 'Kochi',     state: 'Kerala',      gender: 'male',   pos: 'Striker' },
  { name: 'Ishita Verma',  sport: 'Athletics',  city: 'Delhi',     state: 'Delhi',       gender: 'female', pos: 'Sprinter' },
  { name: 'Karan Singh',   sport: 'Kabaddi',    city: 'Jaipur',    state: 'Rajasthan',   gender: 'male',   pos: 'Raider' },
  { name: 'Ananya Reddy',  sport: 'Tennis',     city: 'Bengaluru', state: 'Karnataka',   gender: 'female', pos: 'All-Court' },
  { name: 'Vivaan Patel',  sport: 'Hockey',     city: 'Ahmedabad', state: 'Gujarat',     gender: 'male',   pos: 'Midfielder' },
  { name: 'Sara Khan',     sport: 'Swimming',   city: 'Pune',      state: 'Maharashtra', gender: 'female', pos: 'Freestyle' },
];

// ── Coaches ──────────────────────────────────────────────────────────
const coaches = [
  { name: 'Coach Rajesh Kumar', sport: 'Cricket',   city: 'Mumbai',    state: 'Maharashtra', gender: 'male',   exp: 12 },
  { name: 'Coach Meena Iyer',   sport: 'Badminton', city: 'Hyderabad', state: 'Telangana',   gender: 'female', exp: 9  },
  { name: 'Coach David Fernandes', sport: 'Football', city: 'Goa',     state: 'Goa',         gender: 'male',   exp: 15 },
  { name: 'Coach Priya Desai',  sport: 'Athletics', city: 'Pune',      state: 'Maharashtra', gender: 'female', exp: 7  },
  { name: 'Coach Harpreet Gill', sport: 'Kabaddi',  city: 'Ludhiana',  state: 'Punjab',      gender: 'male',   exp: 11 },
];

const run = async () => {
  await connectDB();
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  let made = 0;

  for (const a of athletes) {
    const email = a.name.toLowerCase().replace(/\s+/g, '.') + '@test.com';
    if (await User.findOne({ email })) { console.log(`skip ${email} (exists)`); continue; }
    const user = await User.create({ email, passwordHash, role: 'athlete', isVerified: true, isApproved: true, phone: '' });
    await AthleteProfile.create({
      userId: user._id,
      fullName: a.name,
      primarySport: a.sport,
      position: a.pos,
      gender: a.gender,
      location: { city: a.city, state: a.state, country: 'India' },
      availabilityStatus: 'open_for_trials',
      visibility: 'public',
      tagline: `${a.sport} player from ${a.city}`,
      profileUrl: slug(a.name),
    });
    made++;
    console.log(`athlete: ${a.name} (${email})`);
  }

  for (const c of coaches) {
    const email = c.name.toLowerCase().replace(/\s+/g, '.').replace('coach.', '') + '@test.com';
    if (await User.findOne({ email })) { console.log(`skip ${email} (exists)`); continue; }
    const user = await User.create({ email, passwordHash, role: 'coach', isVerified: true, isApproved: true, phone: '' });
    await CoachProfile.create({
      userId: user._id,
      fullName: c.name,
      sportsSpecialization: [c.sport],
      experienceYears: c.exp,
      gender: c.gender,
      location: { city: c.city, state: c.state, country: 'India' },
      availability: 'full_time',
      visibility: 'public',
      bio: `${c.exp}+ years coaching ${c.sport} in ${c.city}.`,
      profileUrl: slug(c.name),
    });
    made++;
    console.log(`coach:   ${c.name} (${email})`);
  }

  console.log(`\n✅ Done. Created ${made} new users. Password for all: ${PASSWORD}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });
