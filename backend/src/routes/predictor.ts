import { Router } from 'express';
import { savePrediction, getMyPrediction } from '../controllers/predictorController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/', protect, savePrediction);
router.get('/mine', protect, getMyPrediction);

export default router;
