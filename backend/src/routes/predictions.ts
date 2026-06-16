import { Router } from 'express';
import {
  getMatches, createPrediction, getMyPredictions, getLeaderboard, runSync,
} from '../controllers/predictionController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

// Read-only matches view (attaches the caller's pick when logged in).
router.get('/', optionalAuth, getMatches);

// The user's own picks + total points.
router.get('/mine', protect, getMyPredictions);

// Public leaderboard (highlights the caller's row when logged in).
router.get('/leaderboard', optionalAuth, getLeaderboard);

// Submit / change one pick for a match (server-side kickoff lock inside).
router.post('/:matchId/predict', protect, createPrediction);

// Scheduler-triggered sync (secret-protected inside the controller).
router.post('/sync', runSync);

export default router;
