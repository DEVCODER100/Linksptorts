import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  userId: Types.ObjectId;
  type: 'listing_fee' | 'participant_fee';
  amount: number;
  currency: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'pending' | 'success' | 'failed';
  couponCode?: string;
  discountAmount: number;
  referenceId?: Types.ObjectId;
  referenceType?: string;
  createdAt: Date;
}

export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validFrom: Date;
  validUntil?: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['listing_fee', 'participant_fee'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    couponCode: String,
    discountAmount: { type: Number, default: 0 },
    referenceId: Schema.Types.ObjectId,
    referenceType: String,
  },
  { timestamps: true }
);

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true },
    validFrom: { type: Date, default: Date.now },
    validUntil: Date,
    usageLimit: Number,
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
