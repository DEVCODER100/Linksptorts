import { Router } from 'express';
import { protect, optionalAuth } from '../middleware/auth';
import {
  getUserReviews,
  getUserRating,
  addReview,
  updateReview,
  deleteReview,
  reportReview,
} from '../controllers/reviewController';

const router = Router();

// User-scoped review routes (mounted at /api/v1/users)
router.get('/:id/reviews', optionalAuth, getUserReviews);
router.get('/:id/rating', optionalAuth, getUserRating);
router.post('/:id/reviews', protect, addReview);

// Review-specific routes (mounted at /api/v1/reviews)
export const reviewRouter = Router();
reviewRouter.put('/:id', protect, updateReview);
reviewRouter.delete('/:id', protect, deleteReview);
reviewRouter.post('/:id/report', protect, reportReview);

export default router;
