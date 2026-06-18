import mongoose, { Schema, Document, Types } from 'mongoose';

// One saved bracket prediction per user (any role — player, coach, etc.).
// `data` is the full predictor state blob; `champion` is the picked winner.
export interface IPredictorSubmission extends Document {
  userId: Types.ObjectId;
  champion?: string;
  data: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const PredictorSubmissionSchema = new Schema<IPredictorSubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    champion: { type: String },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const PredictorSubmission = mongoose.model<IPredictorSubmission>('PredictorSubmission', PredictorSubmissionSchema);
