import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrganization extends Document {
  userId: Types.ObjectId;
  name: string;
  contactPerson?: string;
  city?: string;
  state?: string;
  pincode?: string;
  type: string;
  logo?: string;
  banner?: string;
  description?: string;
  address?: string;
  showAddress?: boolean;
  contact: { phone?: string; email?: string; website?: string };
  alternatePhone?: string;
  showPhone?: boolean;
  sports: string[];
  facilities?: string;
  coachingStaff: Types.ObjectId[];
  achievements: { title: string; year?: number; description?: string }[];
  verificationDocuments: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isVerified: boolean;
  teamMembers: { userId: Types.ObjectId; role: 'super_admin' | 'content_admin' | 'job_admin' }[];
  profileUrl: string;
  followerCount: number;
  connectionCount: number;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    type: {
      type: String,
      enum: ['academy', 'school', 'university', 'club', 'federation', 'organizer', 'corporate', 'agency', 'brand'],
      required: true,
    },
    logo: String,
    banner: String,
    description: String,
    address: String,
    showAddress: { type: Boolean, default: false },
    contact: { phone: String, email: String, website: String },
    alternatePhone: String,
    showPhone: { type: Boolean, default: true },
    sports: [String],
    facilities: String,
    coachingStaff: [{ type: Schema.Types.ObjectId, ref: 'CoachProfile' }],
    achievements: [{ title: String, year: Number, description: String }],
    verificationDocuments: [String],
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    isVerified: { type: Boolean, default: false },
    teamMembers: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['super_admin', 'content_admin', 'job_admin'] },
      },
    ],
    profileUrl: { type: String, unique: true, index: true },
    followerCount: { type: Number, default: 0 },
    connectionCount: { type: Number, default: 0 },
    rejectionReason: String,
  },
  { timestamps: true }
);

OrganizationSchema.index({ name: 'text', description: 'text' });

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
