import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJobApplication extends Document {
  jobId: Types.ObjectId;
  applicantId: Types.ObjectId;
  coverLetter?: string;
  status: 'applied' | 'shortlisted' | 'rejected';
  rejectionReason?: string;
  appliedAt: Date;
  statusUpdatedAt?: Date;
  savedBy: Types.ObjectId[];
}

const JobApplicationSchema = new Schema<IJobApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    applicantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coverLetter: { type: String, maxlength: 2000 },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'rejected'],
      default: 'applied',
    },
    rejectionReason: String,
    appliedAt: { type: Date, default: Date.now },
    statusUpdatedAt: Date,
    savedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

JobApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

export const JobApplication = mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema);
