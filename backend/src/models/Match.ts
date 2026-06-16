import mongoose, { Schema, Document } from 'mongoose';
import { Round, Slot } from '../config/wc2026Bracket';

export type MatchStatus = 'upcoming' | 'live' | 'finished';

// A knockout fixture (matches 73–104). Slot definitions come from static config;
// resolved teams / scores / status come ONLY from the API sync.
export interface IMatch extends Document {
  matchNo: number;          // 73–104, unique
  round: Round;
  kickoffUtc: Date;
  venue?: string;
  home: Slot;               // slot definition (how this side is filled)
  away: Slot;
  homeTeam?: string | null; // resolved team name (null until known)
  awayTeam?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  status: MatchStatus;
  winner?: 'home' | 'away' | null; // who advanced (from API)
  extId?: string | null;    // provider match id once mapped
  createdAt: Date;
  updatedAt: Date;
}

const SlotSchema = new Schema(
  {
    type: { type: String, required: true },
    group: String,
    candidates: [String],
    matchNo: Number,
  },
  { _id: false }
);

const MatchSchema = new Schema<IMatch>(
  {
    matchNo: { type: Number, required: true, unique: true, index: true },
    round: { type: String, required: true },
    kickoffUtc: { type: Date, required: true, index: true },
    venue: String,
    home: { type: SlotSchema, required: true },
    away: { type: SlotSchema, required: true },
    homeTeam: { type: String, default: null },
    awayTeam: { type: String, default: null },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
    status: { type: String, enum: ['upcoming', 'live', 'finished'], default: 'upcoming', index: true },
    winner: { type: String, enum: ['home', 'away', null], default: null },
    extId: { type: String, default: null },
  },
  { timestamps: true }
);

export const Match = mongoose.model<IMatch>('Match', MatchSchema);
