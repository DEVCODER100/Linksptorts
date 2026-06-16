import { Router } from 'express';
import {
  getMatches, getMyPredictions, getLeaderboard, runSync,
} from '../controllers/predictionController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

// Read-only bracket (Phase A). Pick submission is added in Phase C.
router.get('/', optionalAuth, getMatches);
router.get('/mine', protect, getMyPredictions);
router.get('/leaderboard', optionalAuth, getLeaderboard);

// Scheduler-triggered sync (secret-protected inside the controller).
router.post('/sync', runSync);

export default router;
