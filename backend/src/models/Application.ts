import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IApplication extends Document {
  listingId: Types.ObjectId;
  applicantId: Types.ObjectId;
  applicantProfileType: 'athlete' | 'coach' | 'professional';
  answers: { questionId: string; answer: string }[];
  documents: string[];
  paymentId?: Types.ObjectId;
  status: 'applied' | 'shortlisted' | 'rejected' | 'withdrawn';
  rejectionReason?: string;
  appliedAt: Date;
  statusUpdatedAt?: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    applicantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicantProfileType: { type: String, enum: ['athlete', 'coach', 'professional'], required: true },
    answers: [{ questionId: String, answer: String }],
    documents: [String],
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'rejected', 'withdrawn'],
      default: 'applied',
    },
    rejectionReason: String,
    appliedAt: { type: Date, default: Date.now },
    statusUpdatedAt: Date,
  },
  { timestamps: true }
);

ApplicationSchema.index({ listingId: 1, applicantId: 1 }, { unique: true });
ApplicationSchema.index({ applicantId: 1, status: 1 });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
