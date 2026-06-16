import mongoose, { Schema, Document } from 'mongoose';

// Normalized match status. Results & statuses are sourced ONLY from the football
// data API by the sync job — never from user input.
export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'postponed' | 'cancelled';

export interface IMatch extends Document {
  extId: string;            // provider match id (football-data.org) — unique
  stage: string;            // GROUP_STAGE | LAST_16 | QUARTER_FINALS | SEMI_FINALS | THIRD_PLACE | FINAL
  groupLabel?: string;      // e.g. "GROUP_A" (null for knockout)
  homeTeam: string;
  awayTeam: string;
  kickoffUtc: Date;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    extId: { type: String, required: true, unique: true, index: true },
    stage: { type: String, required: true },
    groupLabel: { type: String },
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    kickoffUtc: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'finished', 'postponed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
  },
  { timestamps: true }
);

// A match is a knockout fixture when it isn't part of the group stage.
MatchSchema.virtual('isKnockout').get(function (this: IMatch) {
  return this.stage !== 'GROUP_STAGE';
});

export const Match = mongoose.model<IMatch>('Match', MatchSchema);
