import mongoose, { Schema, Document, Types } from 'mongoose';

// A user's single pick for a match.
//  - Group stage: HOME | DRAW | AWAY
//  - Knockout:    HOME | AWAY  (the team predicted to advance)
export type PredictionPick = 'HOME' | 'DRAW' | 'AWAY';

export interface IPrediction extends Document {
  userId: Types.ObjectId;
  matchId: Types.ObjectId;
  pick: PredictionPick;
  points: number | null;   // null until the match is settled; then 3 or 0
  createdAt: Date;
  updatedAt: Date;
}

const PredictionSchema = new Schema<IPrediction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    pick: { type: String, enum: ['HOME', 'DRAW', 'AWAY'], required: true },
    points: { type: Number, default: null },
  },
  { timestamps: true }
);

// One prediction per user per match — enforced at the DB level.
PredictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });

export const Prediction = mongoose.model<IPrediction>('Prediction', PredictionSchema);
