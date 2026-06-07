import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConnection extends Document {
  requesterId: Types.ObjectId;
  recipientId: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  note?: string;
  createdAt: Date;
  acceptedAt?: Date;
}

export interface IFollow extends Document {
  followerId: Types.ObjectId;
  followingId: Types.ObjectId;
  createdAt: Date;
}

export interface IBlock extends Document {
  blockerId: Types.ObjectId;
  blockedId: Types.ObjectId;
  createdAt: Date;
}

const ConnectionSchema = new Schema<IConnection>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
    },
    note: { type: String, maxlength: 300 },
    acceptedAt: Date,
  },
  { timestamps: true }
);

ConnectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
ConnectionSchema.index({ recipientId: 1, status: 1 });

const FollowSchema = new Schema<IFollow>(
  {
    followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    followingId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const BlockSchema = new Schema<IBlock>(
  {
    blockerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    blockedId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

BlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

export const Connection = mongoose.model<IConnection>('Connection', ConnectionSchema);
export const Follow = mongoose.model<IFollow>('Follow', FollowSchema);
export const Block = mongoose.model<IBlock>('Block', BlockSchema);
