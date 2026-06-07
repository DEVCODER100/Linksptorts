/**
 * MySQL SQL Dump → MongoDB Migration Script
 *
 * Reads the SQL dump file (no live MySQL connection needed).
 *
 * Steps:
 *   1.  Copy the .sql dump file into backend/ and set MYSQL_DUMP_PATH in .env
 *       e.g.  MYSQL_DUMP_PATH=./u993820046_connect_sport.sql
 *   2.  npm run migrate
 */

import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import { User } from '../models/User';
import { AthleteProfile } from '../models/AthleteProfile';
import { CoachProfile } from '../models/CoachProfile';
import { Organization } from '../models/Organization';

// ── SQL dump parser ───────────────────────────────────────────────────────────

type Row = Record<string, string | null>;

/**
 * Extract all rows from INSERT statements for a given table.
 * Handles multi-row INSERTs: INSERT INTO `t` (cols) VALUES (...),(...),...;
 */
function parseTable(sql: string, table: string): Row[] {
  const rows: Row[] = [];

  // Match the INSERT block for this table
  const blockRe = new RegExp(
    `INSERT INTO \`${table}\`\\s*\\(([^)]+)\\)\\s*VALUES\\s*([\\s\\S]+?);(?=\\s*(?:--|/\\*|INSERT|CREATE|ALTER|DROP|SET|COMMIT|$))`,
    'gi'
  );

  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockRe.exec(sql)) !== null) {
    const colLine = blockMatch[1];
    const valuesBlock = blockMatch[2];

    // Parse column names
    const cols = colLine
      .split(',')
      .map((c) => c.trim().replace(/`/g, ''));

    // Split individual rows — match each (...)
    const rowRe = /\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRe.exec(valuesBlock)) !== null) {
      const raw = rowMatch[1];
      const values = splitValues(raw);
      const row: Row = {};
      cols.forEach((col, i) => {
        const v = values[i] ?? null;
        row[col] = v === 'NULL' ? null : unquote(v);
      });
      rows.push(row);
    }
  }

  return rows;
}

/** Split a raw VALUES row string respecting quoted strings */
function splitValues(raw: string): string[] {
  const parts: string[] = [];
  let cur = '';
  let inStr = false;
  let escape = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) { cur += ch; escape = false; continue; }
    if (ch === '\\') { cur += ch; escape = true; continue; }
    if (ch === "'" && !inStr) { inStr = true; cur += ch; continue; }
    if (ch === "'" && inStr) { inStr = false; cur += ch; continue; }
    if (ch === ',' && !inStr) { parts.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  parts.push(cur.trim());
  return parts;
}

function unquote(v: string | undefined): string | null {
  if (v === undefined || v === 'NULL') return null;
  if (v.startsWith("'") && v.endsWith("'")) {
    return v.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }
  return v;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const toStr  = (v: string | null | undefined): string => v ?? '';
const toNum  = (v: string | null | undefined): number => Number(v) || 0;
const toDate = (v: string | null | undefined): Date | undefined => {
  if (!v || v === '0000-00-00' || v === '0000-00-00 00:00:00') return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
};
const fixHash = (h: string | null): string =>
  h ? h.replace(/^\$2y\$/, '$2b$') : '$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const slugify = (name: string, suffix: string): string =>
  toStr(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '-' + suffix;

function byId<T extends Row>(rows: T[], key = 'player_id'): Record<string, T[]> {
  return rows.reduce((m, r) => {
    const k = toStr(r[key]);
    m[k] = [...(m[k] || []), r];
    return m;
  }, {} as Record<string, T[]>);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // ── Load SQL dump ──────────────────────────────────────────────────────────
  const dumpPath = process.env.MYSQL_DUMP_PATH
    ? path.resolve(process.env.MYSQL_DUMP_PATH)
    : path.resolve(__dirname, '../../u993820046_connect_sport.sql');

  if (!fs.existsSync(dumpPath)) {
    console.error(`\n❌ SQL dump not found at: ${dumpPath}`);
    console.error('   Place the .sql file in the backend/ directory and set MYSQL_DUMP_PATH in .env\n');
    process.exit(1);
  }

  console.log(`📂 Reading SQL dump: ${dumpPath}`);
  const sql = fs.readFileSync(dumpPath, 'utf8');
  console.log(`   File size: ${(sql.length / 1024).toFixed(0)} KB`);

  // ── Parse all tables ───────────────────────────────────────────────────────
  console.log('🔍 Parsing tables…');
  const players       = parseTable(sql, 'players');
  const coaches       = parseTable(sql, 'coaches');
  const proAccounts   = parseTable(sql, 'pro_accounts');
  const achievements  = parseTable(sql, 'achievements');
  const clubs         = parseTable(sql, 'clubs');
  const tournaments   = parseTable(sql, 'tournaments');
  const highlights    = parseTable(sql, 'highlights');
  const playerEdus    = parseTable(sql, 'player_education');
  const coachExp      = parseTable(sql, 'coaching_experience');
  const coachCerts    = parseTable(sql, 'coach_certifications');

  console.log(`   players: ${players.length}, coaches: ${coaches.length}, orgs: ${proAccounts.length}`);
  console.log(`   achievements: ${achievements.length}, clubs: ${clubs.length}, tournaments: ${tournaments.length}`);

  // ── Connect MongoDB ────────────────────────────────────────────────────────
  console.log('\n🔗 Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('✅ MongoDB connected');

  // Clear existing data
  console.log('🧹 Clearing existing collections…');
  await Promise.all([
    User.deleteMany({}),
    AthleteProfile.deleteMany({}),
    CoachProfile.deleteMany({}),
    Organization.deleteMany({}),
  ]);

  // Pre-build lookup maps
  const achMap   = byId(achievements,  'player_id');
  const clubMap  = byId(clubs,         'player_id');
  const tournMap = byId(tournaments,   'player_id');
  const hlMap    = byId(highlights,    'player_id');
  const eduMap   = byId(playerEdus,    'player_id');
  const cexpMap  = byId(coachExp,      'coach_id');
  const ccertMap = byId(coachCerts,    'coach_id');

  // ── Athletes ───────────────────────────────────────────────────────────────
  console.log('\n👟 Migrating athletes…');
  let ok = 0, fail = 0;

  for (const p of players) {
    try {
      const user = await User.create({
        name:             p.full_name || p.username || 'Unknown',
        email:            p.email!,
        password:         fixHash(p.password_hash),
        role:             'athlete',
        phone:            p.mobile_no,
        isEmailVerified:  p.email_verified === '1',
        accountStatus:    p.status === 'active' ? 'active' : 'suspended',
      });

      const pid = toStr(p.id);

      await AthleteProfile.create({
        userId:          user._id,
        profileUrl:      slugify(toStr(p.full_name || p.username), pid),
        fullName:        p.full_name || p.name || p.username || 'Unknown',
        bio:             p.bio || p.about || '',
        photo:           p.profile_picture_path || p.profile_pic || '',
        primarySport:    p.sport_type || 'Football',
        sports:          [p.sport_type || 'Football'],
        gender:          (p.gender || '').toLowerCase() as 'male' | 'female' | 'other',
        dateOfBirth:     toDate(p.dob),
        height:          p.height_unit === 'ft' ? toNum(p.height) * 30.48 : toNum(p.height),
        weight:          toNum(p.weight),
        primaryPosition: p.primary_position || '',
        location: {
          city:    p.city    || '',
          state:   p.state   || '',
          country: p.nationality || 'India',
          pincode: p.pincode || '',
          address: p.address || '',
        },
        experienceLevel:
          toNum(p.years_of_experience) >= 10 ? 'elite'
          : toNum(p.years_of_experience) >= 5 ? 'advanced'
          : toNum(p.years_of_experience) >= 2 ? 'intermediate'
          : 'beginner',
        socialLinks: {
          instagram: p.instagram_url || '',
          twitter:   p.twitter_url   || '',
          linkedin:  p.linkedin_url  || '',
        },
        achievements: (achMap[pid] || []).map((a) => ({
          title:       toStr(a.title),
          year:        toStr(a.year),
          level:       toStr(a.category),
          description: toStr(a.description),
          issuedBy:    toStr(a.issuing_organization),
        })),
        playingHistory: (clubMap[pid] || []).map((c) => ({
          teamName:    toStr(c.club_name),
          sport:       p.sport_type || 'Football',
          role:        toStr(c.position),
          from:        toDate(c.start_year),
          to:          toDate(c.end_year),
          isCurrent:   c.is_current === '1',
          description: toStr(c.description),
        })),
        tournaments: (tournMap[pid] || []).map((t) => ({
          name:     toStr(t.tournament_name),
          sport:    p.sport_type || 'Football',
          year:     toStr(t.start_date).slice(0, 4),
          level:    toStr(t.tournament_level),
          result:   toStr(t.result),
          location: toStr(t.location),
        })),
        media: (hlMap[pid] || []).map((h) => ({
          type:     'video' as const,
          url:      toStr(h.video_url),
          caption:  toStr(h.highlight_name),
        })),
        education: (eduMap[pid] || []).map((e) => ({
          institution:  toStr(e.school_name),
          degree:       toStr(e.degree),
          fieldOfStudy: toStr(e.field_of_study),
          from:         toDate(e.start_year),
          to:           toDate(e.end_year),
        })),
        profileCompletion:
          Math.round([p.bio, p.primary_position, p.city, p.dob, p.gender].filter(Boolean).length / 5 * 100),
        availabilityStatus: 'available_immediately',
        isParaAthlete: false,
      });

      ok++;
    } catch (err) {
      fail++;
      if (fail <= 5) console.error(`  ⚠️  Player ${p.email}: ${(err as Error).message}`);
    }
  }
  console.log(`   ✅ ${ok} athletes migrated${fail ? `, ⚠️ ${fail} failed` : ''}`);

  // ── Coaches ────────────────────────────────────────────────────────────────
  console.log('\n🏋️  Migrating coaches…');
  ok = 0; fail = 0;

  for (const c of coaches) {
    try {
      const user = await User.create({
        name:            c.full_name || c.username || 'Unknown',
        email:           c.email!,
        password:        fixHash(c.password_hash),
        role:            'coach',
        phone:           c.mobile_no,
        isEmailVerified: c.email_verified === '1',
        accountStatus:   c.account_status === 'active' ? 'active' : 'suspended',
      });

      const cid = toStr(c.id);

      await CoachProfile.create({
        userId:              user._id,
        profileUrl:          slugify(toStr(c.full_name || c.username), cid),
        fullName:            c.full_name || c.username || 'Unknown',
        bio:                 c.bio || '',
        photo:               c.profile_picture_path || '',
        sportsSpecialization: c.specialization ? [c.specialization] : [],
        yearsOfExperience:   toNum(c.experience_years),
        coachingPhilosophy:  c.coaching_philosophy || '',
        location: {
          city:    c.location || '',
          country: c.country  || 'India',
        },
        isAvailableForHire: c.account_status === 'active',
        socialLinks: { linkedin: c.linkedin_url || '' },
        experience: (cexpMap[cid] || []).map((e) => ({
          organization: toStr(e.organization_name),
          role:         toStr(e.role),
          from:         toDate(e.start_date),
          to:           toDate(e.end_date),
          isCurrent:    e.is_current === '1',
          description:  toStr(e.description),
        })),
        certifications: (ccertMap[cid] || []).map((cert) => ({
          name:          toStr(cert.certificate_name),
          issuedBy:      toStr(cert.issuing_authority),
          level:         toStr(cert.license_level),
          licenseNumber: toStr(cert.license_number),
          issueDate:     toDate(cert.issue_date),
          expiryDate:    toDate(cert.expiry_date),
        })),
        isVerified:       c.is_verified === '1',
        verificationLevel: c.verification_level || 'basic',
      });

      ok++;
    } catch (err) {
      fail++;
      if (fail <= 5) console.error(`  ⚠️  Coach ${c.email}: ${(err as Error).message}`);
    }
  }
  console.log(`   ✅ ${ok} coaches migrated${fail ? `, ⚠️ ${fail} failed` : ''}`);

  // ── Organizations ──────────────────────────────────────────────────────────
  console.log('\n🏢 Migrating organizations…');
  ok = 0; fail = 0;

  for (const o of proAccounts) {
    try {
      const user = await User.create({
        name:            o.academy_name || o.contact_person || 'Organization',
        email:           o.email!,
        password:        fixHash(o.password || o.password_hash),
        role:            'organization',
        phone:           o.phone || o.mobile_no,
        isEmailVerified: true,
        accountStatus:   o.status === 'approved' ? 'active' : 'pending',
      });

      await Organization.create({
        userId:      user._id,
        name:        o.academy_name || 'Organization',
        type:        'academy',
        description: o.description || '',
        logo:        o.logo || o.profile_image || '',
        location: {
          city:    o.city  || '',
          state:   o.state || '',
          country: 'India',
          address: [o.house_number, o.street, o.locality].filter(Boolean).join(', '),
          pincode: o.pincode || '',
        },
        contactEmail: o.email,
        contactPhone: o.phone || o.whatsapp || '',
        sports:       o.sport_type ? [o.sport_type] : [],
        isVerified:   o.status === 'approved',
        verificationStatus: o.status === 'approved' ? 'verified'
          : o.status === 'rejected' ? 'rejected'
          : 'pending',
      });

      ok++;
    } catch (err) {
      fail++;
      if (fail <= 5) console.error(`  ⚠️  Org ${o.email}: ${(err as Error).message}`);
    }
  }
  console.log(`   ✅ ${ok} organizations migrated${fail ? `, ⚠️ ${fail} failed` : ''}`);

  // ── Final counts ───────────────────────────────────────────────────────────
  const [uCount, aCount, cCount, oCount] = await Promise.all([
    User.countDocuments(),
    AthleteProfile.countDocuments(),
    CoachProfile.countDocuments(),
    Organization.countDocuments(),
  ]);

  console.log('\n════════════════════════════════════');
  console.log('  ✅ Migration complete!');
  console.log(`  Users:         ${uCount}`);
  console.log(`  Athletes:      ${aCount}`);
  console.log(`  Coaches:       ${cCount}`);
  console.log(`  Organizations: ${oCount}`);
  console.log('════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
