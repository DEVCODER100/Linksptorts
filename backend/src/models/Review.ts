import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  reviewee: Types.ObjectId;   // user being reviewed
  reviewer: Types.ObjectId;   // user writing the review
  rating: number;             // 1–5
  comment?: string;
  isReported: boolean;
  reportReason?: string;
  reportedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    reviewee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000, trim: true },
    isReported: { type: Boolean, default: false },
    reportReason: { type: String, maxlength: 500 },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// One review per reviewer-reviewee pair
ReviewSchema.index({ reviewee: 1, reviewer: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
