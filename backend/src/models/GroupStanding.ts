import mongoose, { Schema, Document } from 'mongoose';

export interface IStandingRow {
  position: number;
  team: string;
  played: number;
  points: number;
  goalDifference: number;
  goalsFor: number;
}

// One document per group (A–L), holding the current table from the API.
export interface IGroupStanding extends Document {
  group: string; // 'A'..'L'
  table: IStandingRow[];
  updatedAt: Date;
}

const RowSchema = new Schema<IStandingRow>(
  {
    position: Number,
    team: String,
    played: Number,
    points: Number,
    goalDifference: Number,
    goalsFor: Number,
  },
  { _id: false }
);

const GroupStandingSchema = new Schema<IGroupStanding>(
  {
    group: { type: String, required: true, unique: true, index: true },
    table: [RowSchema],
  },
  { timestamps: true }
);

export const GroupStanding = mongoose.model<IGroupStanding>('GroupStanding', GroupStandingSchema);
