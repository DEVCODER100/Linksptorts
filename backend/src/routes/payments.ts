import { Router } from 'express';
import { createOrder, verifyPayment, getTransactionHistory, validateCoupon } from '../controllers/paymentController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/history', getTransactionHistory);
router.post('/validate-coupon', validateCoupon);

export default router;
