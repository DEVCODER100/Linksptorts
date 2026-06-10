import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICoachProfile extends Document {
  userId: Types.ObjectId;
  fullName: string;
  photo?: string;
  dob?: Date;
  gender?: string;
  location: { city?: string; state?: string; country?: string };
  email?: string;
  phone?: string;
  qualifications: { name: string; issuer?: string; year?: number; document?: string }[];
  sportsSpecialization: string[];
  ageGroupsCoached: string[];
  experience: { organization: string; role?: string; startDate?: Date; endDate?: Date; current?: boolean }[];
  education: { institution: string; degree?: string; fieldOfStudy?: string; startYear?: number; endYear?: number; description?: string; isCurrent?: boolean }[];
  athletesDeveloped: Types.ObjectId[];
  tournamentResults: { tournament: string; team?: string; result?: string; year?: number }[];
  playersTrained: { name: string; result?: string; description?: string; year?: number }[];
  coachingPhilosophy?: string;
  bio?: string;
  hourlyRate?: string;
  countryCode?: string;
  availability: 'full_time' | 'part_time' | 'freelance' | 'consulting' | 'not_available' | 'looking' | 'open' | 'not_looking';
  aboutBio?: string;
  socialLinks: { instagram?: string; youtube?: string; twitter?: string; linkedin?: string };
  profileUrl: string;
  visibility: 'public' | 'connections' | 'private';
  followerCount: number;
  connectionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CoachProfileSchema = new Schema<ICoachProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    photo: String,
    dob: Date,
    gender: String,
    location: { city: String, state: String, country: { type: String, default: 'India' } },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    qualifications: [{ name: String, issuer: String, year: Number, document: String }],
    sportsSpecialization: [String],
    ageGroupsCoached: [String],
    experience: [{ organization: String, role: String, startDate: Date, endDate: Date, current: Boolean }],
    education: [{ institution: String, degree: String, fieldOfStudy: String, startYear: Number, endYear: Number, description: String, isCurrent: Boolean }],
    athletesDeveloped: [{ type: Schema.Types.ObjectId, ref: 'AthleteProfile' }],
    tournamentResults: [{ tournament: String, team: String, result: String, year: Number }],
    playersTrained: [{ name: String, result: String, description: String, year: Number }],
    coachingPhilosophy: { type: String, maxlength: 2000 },
    bio: { type: String, maxlength: 2000 },
    hourlyRate: String,
    countryCode: String,
    availability: {
      type: String,
      enum: ['full_time', 'part_time', 'freelance', 'consulting', 'not_available', 'looking', 'open', 'not_looking'],
      default: 'open',
    },
    aboutBio: { type: String, maxlength: 2000 },
    socialLinks: { instagram: String, youtube: String, twitter: String, linkedin: String },
    profileUrl: { type: String, unique: true, index: true },
    visibility: { type: String, enum: ['public', 'connections', 'private'], default: 'public' },
    followerCount: { type: Number, default: 0 },
    connectionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CoachProfileSchema.index({ fullName: 'text', coachingPhilosophy: 'text' });

export const CoachProfile = mongoose.model<ICoachProfile>('CoachProfile', CoachProfileSchema);
