import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAthleteProfile extends Document {
  userId: Types.ObjectId;
  fullName: string;
  username?: string; // New field
  photo?: string;
  dob?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  location: { 
    address?: string; 
    pincode?: string; 
    city?: string; 
    state?: string; 
    country?: string 
  };
  email?: string;
  phone?: string;
  primarySport?: string;
  secondarySports: string[];
  position?: string;
  dominantSide?: 'left' | 'right' | 'both';
  height?: number;
  heightUnit?: 'cm' | 'm' | 'ft'; // New field
  weight?: number;
  isParaAthlete: boolean;
  paraClassification?: string;
  achievements: {
    title: string; 
    year?: number; 
    level?: string; 
    category?: string; // New field (category)
    description?: string; 
    document?: string;
  }[];
  tournaments: {
    name: string; 
    startDate?: Date; // New field
    endDate?: Date;   // New field
    year?: number; 
    location?: string; 
    result?: string;
    description?: string; // New field
  }[];
  playingHistory: {
    organization: string; 
    role?: string; 
    startDate?: Date; 
    endDate?: Date; 
    current?: boolean;
    description?: string; // New field
  }[];
  education: {
    institution: string; 
    degree?: string; 
    fieldOfStudy?: string; // New field
    startYear?: number;    // New field
    endYear?: number;      // New field
    year?: number; 
    sportsAchievements?: string;
    description?: string;  // New field
  }[];
  certifications: { name: string; issuer?: string; year?: number; document?: string }[];
  media: { 
    type: 'photo' | 'video'; 
    url: string; 
    title?: string; 
    thumbnail?: string;
    platform?: 'YouTube' | 'Instagram' | 'Vimeo' | 'Other'; // New field
  }[];
  socialLinks: { 
    instagram?: string; 
    youtube?: string; 
    twitter?: string; 
    facebook?: string; 
    linkedin?: string;
    whatsapp?: string; // New field
  };
  tagline?: string; // New field (for short bio)
  aboutBio?: string;
  careerHighlights?: string; // New field
  goalsAspirations?: string; // New field
  yearsOfExperience?: number; // New field
  experienceLevel?: string; // New field
  strengths?: string; // New field
  featuredVideoUrl?: string; // New field
  institutionName?: string; // New field
  currentEducation?: string; // New field
  availabilityStatus?: 'open_for_trials' | 'looking_for_academy' | 'available_for_selection' | 'not_available';
  profileUrl: string;
  visibility: 'public' | 'connections' | 'private';
  followerCount: number;
  connectionCount: number;
  profileCompletion: number;
  coachReferences: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const AthleteProfileSchema = new Schema<IAthleteProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    username: { type: String, trim: true },
    photo: String,
    dob: Date,
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    location: { 
      address: String,
      pincode: String,
      city: String, 
      state: String, 
      country: { type: String, default: 'India' } 
    },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    primarySport: String,
    secondarySports: [String],
    position: String,
    dominantSide: { type: String, enum: ['left', 'right', 'both'] },
    height: Number,
    heightUnit: { type: String, enum: ['cm', 'm', 'ft'], default: 'cm' },
    weight: Number,
    isParaAthlete: { type: Boolean, default: false },
    paraClassification: String,
    achievements: [{ 
      title: String, 
      year: Number, 
      level: String, 
      category: String,
      description: String, 
      document: String 
    }],
    tournaments: [{ 
      name: String, 
      startDate: Date,
      endDate: Date,
      year: Number, 
      location: String, 
      result: String,
      description: String
    }],
    playingHistory: [{ 
      organization: String, 
      role: String, 
      startDate: Date, 
      endDate: Date, 
      current: Boolean,
      description: String
    }],
    education: [{ 
      institution: String, 
      degree: String, 
      fieldOfStudy: String,
      startYear: Number,
      endYear: Number,
      year: Number, 
      sportsAchievements: String,
      description: String
    }],
    certifications: [{ name: String, issuer: String, year: Number, document: String }],
    media: [{ 
      type: { type: String, enum: ['photo', 'video'] }, 
      url: String, 
      title: String, 
      thumbnail: String,
      platform: { type: String, enum: ['YouTube', 'Instagram', 'Vimeo', 'Other'] }
    }],
    socialLinks: { 
      instagram: String, 
      youtube: String, 
      twitter: String, 
      facebook: String, 
      linkedin: String,
      whatsapp: String
    },
    tagline: String,
    aboutBio: { type: String, maxlength: 5000 },
    careerHighlights: String,
    goalsAspirations: String,
    yearsOfExperience: Number,
    experienceLevel: String,
    strengths: String,
    featuredVideoUrl: String,
    institutionName: String,
    currentEducation: String,
    availabilityStatus: {
      type: String,
      enum: ['open_for_trials', 'looking_for_academy', 'available_for_selection', 'not_available'],
      default: 'open_for_trials'
    },
    profileUrl: { type: String, unique: true, sparse: true, index: true },
    visibility: { type: String, enum: ['public', 'connections', 'private'], default: 'public' },
    followerCount: { type: Number, default: 0 },
    connectionCount: { type: Number, default: 0 },
    profileCompletion: { type: Number, default: 0 },
    coachReferences: [{ type: Schema.Types.ObjectId, ref: 'CoachProfile' }],
  },
  { timestamps: true }
);

AthleteProfileSchema.index({ primarySport: 1, 'location.state': 1, 'location.city': 1 });
AthleteProfileSchema.index({ fullName: 'text', aboutBio: 'text', tagline: 'text', username: 'text' });

export const AthleteProfile = mongoose.model<IAthleteProfile>('AthleteProfile', AthleteProfileSchema);
