import mongoose, { Schema, Document, Types } from 'mongoose';

// A user's pick, keyed generically so the same collection holds both kinds:
//   key "M{matchNo}"   → the team predicted to WIN that knockout match
//   key "OPP{matchNo}" → the third-place team predicted to fill that R32 match's
//                        uncertain opponent slot
// pickTeam is the team NAME (stable across the tournament).
export interface IPrediction extends Document {
  userId: Types.ObjectId;
  key: string;
  pickTeam: string;
  points: number | null; // null until settled; then a score (e.g. 3) or 0
  createdAt: Date;
  updatedAt: Date;
}

const PredictionSchema = new Schema<IPrediction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    key: { type: String, required: true },
    pickTeam: { type: String, required: true },
    points: { type: Number, default: null },
  },
  { timestamps: true }
);

// One prediction per user per key — enforced at the DB level.
PredictionSchema.index({ userId: 1, key: 1 }, { unique: true });

export const Prediction = mongoose.model<IPrediction>('Prediction', PredictionSchema);
