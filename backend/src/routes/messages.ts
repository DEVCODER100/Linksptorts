import { Router } from 'express';
import {
  getConversations, getOrCreateConversation, getMessages, sendMessage, getUnreadCount,
} from '../controllers/messageController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/conversations/:userId/with', getOrCreateConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.get('/unread', getUnreadCount);

export default router;
