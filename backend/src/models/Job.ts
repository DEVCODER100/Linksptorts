import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJob extends Document {
  organizationId: Types.ObjectId;
  createdBy: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  location: string;
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship';
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  requiredQualifications: string[];
  skills: string[];
  applicationDeadline?: Date;
  status: 'draft' | 'pending' | 'published' | 'closed';
  applicantCount: number;
  paymentId?: Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['coach', 'pe_teacher', 'fitness_trainer', 'sports_physio', 'nutritionist', 'manager', 'admin', 'other'],
      required: true,
    },
    location: { type: String, required: true },
    jobType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'internship'],
      required: true,
    },
    experienceLevel: String,
    salaryMin: Number,
    salaryMax: Number,
    requiredQualifications: [String],
    skills: [String],
    applicationDeadline: Date,
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'closed'],
      default: 'draft',
    },
    applicantCount: { type: Number, default: 0 },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    rejectionReason: String,
  },
  { timestamps: true }
);

JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ status: 1, category: 1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);
