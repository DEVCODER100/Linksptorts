import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IListing extends Document {
  organizationId: Types.ObjectId;
  createdBy: Types.ObjectId;
  type: 'trial' | 'event' | 'tournament' | 'admission' | 'training_camp';
  title: string;
  description: string;
  sports: string[];
  startDate: Date;
  endDate?: Date;
  location: { address?: string; city?: string; state?: string; isOnline?: boolean };
  eligibility: {
    ageMin?: number; ageMax?: number; gender?: string;
    experienceLevel?: string; paraClassifications?: string[];
    achievementRequirements?: string;
  };
  physicalRequirements?: { heightMin?: number; heightMax?: number; weightMin?: number; weightMax?: number };
  participantLimit?: number;
  participantCount: number;
  registrationDeadline?: Date;
  participantFee?: number;
  customQuestions: {
    id: string; question: string; type: 'text' | 'multiple_choice' | 'yes_no';
    options?: string[]; required?: boolean;
  }[];
  documentRequired: boolean;
  documentDescription?: string;
  banner?: string;
  contactInfo?: string;
  status: 'draft' | 'pending' | 'published' | 'closed' | 'completed' | 'cancelled';
  cancellationReason?: string;
  paymentId?: Types.ObjectId;
  rejectionReason?: string;
  allowWithdrawal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema<IListing>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['trial', 'event', 'tournament', 'admission', 'training_camp'], required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    sports: [{ type: String }],
    startDate: { type: Date, required: true },
    endDate: Date,
    location: { address: String, city: String, state: String, isOnline: { type: Boolean, default: false } },
    eligibility: {
      ageMin: Number,
      ageMax: Number,
      gender: String,
      experienceLevel: String,
      paraClassifications: [String],
      achievementRequirements: String,
    },
    physicalRequirements: { heightMin: Number, heightMax: Number, weightMin: Number, weightMax: Number },
    participantLimit: Number,
    participantCount: { type: Number, default: 0 },
    registrationDeadline: Date,
    participantFee: { type: Number, default: 0 },
    customQuestions: [
      {
        id: String,
        question: String,
        type: { type: String, enum: ['text', 'multiple_choice', 'yes_no'] },
        options: [String],
        required: Boolean,
      },
    ],
    documentRequired: { type: Boolean, default: false },
    documentDescription: String,
    banner: String,
    contactInfo: String,
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'closed', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    cancellationReason: String,
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    rejectionReason: String,
    allowWithdrawal: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ListingSchema.index({ status: 1, type: 1, sports: 1 });
ListingSchema.index({ title: 'text', description: 'text' });
ListingSchema.index({ startDate: 1 });
ListingSchema.index({ 'location.state': 1, 'location.city': 1 });

export const Listing = mongoose.model<IListing>('Listing', ListingSchema);
