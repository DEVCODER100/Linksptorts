import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import { Review } from '../models/Review';
import { User } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

/** GET /users/:id/reviews — public */
export const getUserReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) { sendError(res, 'Invalid user ID', 400); return; }

    const reviews = await Review.find({ reviewee: id, isReported: false })
      .populate('reviewer', 'username role')
      .sort({ createdAt: -1 })
      .limit(50);

    sendSuccess(res, reviews, 'Reviews fetched');
  } catch { sendError(res, 'Failed to fetch reviews', 500); }
};

/** GET /users/:id/rating — public */
export const getUserRating = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) { sendError(res, 'Invalid user ID', 400); return; }

    const result = await Review.aggregate([
      { $match: { reviewee: new mongoose.Types.ObjectId(id), isReported: false } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
    ]);

    const data = result[0]
      ? { averageRating: Math.round(result[0].averageRating * 10) / 10, totalReviews: result[0].totalReviews }
      : { averageRating: 0, totalReviews: 0 };

    sendSuccess(res, data, 'Rating fetched');
  } catch { sendError(res, 'Failed to fetch rating', 500); }
};

/** POST /users/:id/reviews — auth required */
export const addReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reviewerId = req.user!._id;

    if (!mongoose.isValidObjectId(id)) { sendError(res, 'Invalid user ID', 400); return; }
    if (id === String(reviewerId)) { sendError(res, 'You cannot review yourself', 400); return; }

    const reviewee = await User.findById(id);
    if (!reviewee) { sendError(res, 'User not found', 404); return; }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) { sendError(res, 'Rating must be between 1 and 5', 400); return; }

    const review = await Review.create({
      reviewee: id,
      reviewer: reviewerId,
      rating: Number(rating),
      comment: comment?.trim().slice(0, 1000),
    });

    await review.populate('reviewer', 'username role');
    sendSuccess(res, review, 'Review submitted', 201);
  } catch (err: any) {
    if (err.code === 11000) { sendError(res, 'You have already reviewed this user', 409); return; }
    sendError(res, 'Failed to submit review', 500);
  }
};

/** PUT /reviews/:id — auth required, own review only */
export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) { sendError(res, 'Invalid review ID', 400); return; }

    const review = await Review.findOne({ _id: id, reviewer: req.user!._id });
    if (!review) { sendError(res, 'Review not found', 404); return; }

    const { rating, comment } = req.body;
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) { sendError(res, 'Rating must be between 1 and 5', 400); return; }
      review.rating = Number(rating);
    }
    if (comment !== undefined) review.comment = comment?.trim().slice(0, 1000);

    await review.save();
    await review.populate('reviewer', 'username role');
    sendSuccess(res, review, 'Review updated');
  } catch { sendError(res, 'Failed to update review', 500); }
};

/** DELETE /reviews/:id — auth required, own review only */
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) { sendError(res, 'Invalid review ID', 400); return; }

    const review = await Review.findOneAndDelete({ _id: id, reviewer: req.user!._id });
    if (!review) { sendError(res, 'Review not found', 404); return; }

    sendSuccess(res, null, 'Review deleted');
  } catch { sendError(res, 'Failed to delete review', 500); }
};

/** POST /reviews/:id/report — auth required */
export const reportReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) { sendError(res, 'Invalid review ID', 400); return; }

    const review = await Review.findById(id);
    if (!review) { sendError(res, 'Review not found', 404); return; }
    if (review.isReported) { sendError(res, 'This review has already been reported', 400); return; }

    review.isReported = true;
    review.reportReason = req.body.reason?.trim().slice(0, 500);
    review.reportedBy = req.user!._id;
    await review.save();

    sendSuccess(res, null, 'Review reported');
  } catch { sendError(res, 'Failed to report review', 500); }
};
