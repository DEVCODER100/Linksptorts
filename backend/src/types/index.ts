import { Request } from 'express';
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash?: string;
  authProvider: 'email' | 'google' | 'apple';
  role: 'athlete' | 'coach' | 'professional' | 'organization' | 'admin';
  isVerified: boolean;
  isApproved: boolean;
  isSuspended: boolean;
  phone?: string;
  emailOtp?: string;
  emailOtpExpiry?: Date;
  phoneOtp?: string;
  phoneOtpExpiry?: Date;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  needsRoleSelection?: boolean;
  failedLoginAttempts?: number;
  lockUntil?: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

export interface JwtPayload {
  id: string;
  role: string;
  email: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  cursor?: string;
  sort?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
    nextCursor?: string;
  };
}
