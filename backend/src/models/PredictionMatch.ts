import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPredictionVote {
  userId: Types.ObjectId;
  pick: 'teamA' | 'teamB';
  votedAt: Date;
}

export interface IPredictionMatch extends Document {
  teamA: string;
  teamAFlag?: string;
  teamB: string;
  teamBFlag?: string;
  matchDate: Date;
  stage?: string;
  status: 'upcoming' | 'locked' | 'finished';
  result: 'teamA' | 'teamB' | 'draw' | null;
  votes: IPredictionVote[];
  createdAt: Date;
  updatedAt: Date;
}

const PredictionMatchSchema = new Schema<IPredictionMatch>(
  {
    teamA: { type: String, required: true, trim: true },
    teamAFlag: { type: String, trim: true },
    teamB: { type: String, required: true, trim: true },
    teamBFlag: { type: String, trim: true },
    matchDate: { type: Date, required: true },
    stage: { type: String, trim: true },
    status: {
      type: String,
      enum: ['upcoming', 'locked', 'finished'],
      default: 'upcoming',
    },
    result: {
      type: String,
      enum: ['teamA', 'teamB', 'draw', null],
      default: null,
    },
    votes: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        pick: { type: String, enum: ['teamA', 'teamB'], required: true },
        votedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

PredictionMatchSchema.index({ matchDate: 1 });

export const PredictionMatch = mongoose.model<IPredictionMatch>('PredictionMatch', PredictionMatchSchema);
