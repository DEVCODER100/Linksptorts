import { Router } from 'express';
import {
  sendConnectionRequest, respondToConnection, withdrawConnection,
  getConnections, getPendingRequests, followUser, blockUser, getConnectionStatus,
  getConnectionStatusesBulk,
} from '../controllers/connectionController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getConnections);
router.post('/request', sendConnectionRequest);
router.get('/pending', getPendingRequests);
router.post('/:id/respond', respondToConnection);
router.delete('/:id', withdrawConnection);
router.post('/follow', followUser);
router.post('/block', blockUser);
router.get('/status/:userId', getConnectionStatus);
router.post('/statuses', getConnectionStatusesBulk);

export default router;
