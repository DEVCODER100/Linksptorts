import { Router } from 'express';
import {
  getMatches, createPick, getMyPredictions, getLeaderboard, runSync,
} from '../controllers/predictionController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

// Full bracket + candidates + the caller's picks.
router.get('/', optionalAuth, getMatches);
router.get('/mine', protect, getMyPredictions);
router.get('/leaderboard', optionalAuth, getLeaderboard);

// Save one pick (winner "M{n}" or opponent "OPP{n}"); server-side lock inside.
router.post('/pick', protect, createPick);

// Scheduler-triggered sync (secret-protected inside the controller).
router.post('/sync', runSync);

export default router;
