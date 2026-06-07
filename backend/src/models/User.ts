import mongoose, { Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, select: false },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'apple'],
      default: 'email',
    },
    role: {
      type: String,
      enum: ['athlete', 'coach', 'professional', 'organization', 'admin'],
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    phone: { type: String, trim: true },
    emailOtp: { type: String, select: false },
    emailOtpExpiry: { type: Date, select: false },
    phoneOtp: { type: String, select: false },
    phoneOtpExpiry: { type: Date, select: false },
    refreshTokens: [{ type: String, select: false }],
    lastLoginAt: { type: Date },
    needsRoleSelection: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.pre('save', async function (next) {
  if (this.isModified('passwordHash') && this.passwordHash) {
    if (!this.passwordHash.startsWith('$2')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
  }
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);
