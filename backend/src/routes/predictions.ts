import { Router } from 'express';
import { getMatches, voteOnMatch, createMatch, updateMatch } from '../controllers/predictionController';
import { protect, optionalAuth, authorize } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getMatches);
router.post('/:id/vote', protect, voteOnMatch);

// Admin-only fixture management
router.post('/', protect, authorize('admin'), createMatch);
router.patch('/:id', protect, authorize('admin'), updateMatch);

export default router;
