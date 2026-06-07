import { Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../types';
import { Payment, Coupon } from '../models/Payment';
import { Listing } from '../models/Listing';
import { Job } from '../models/Job';
import { sendSuccess, sendError } from '../utils/response';

const LISTING_FEE = 50;

let razorpay: any = null;

const getRazorpay = async () => {
  if (razorpay) return razorpay;
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id') {
    const Razorpay = (await import('razorpay')).default;
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, referenceId, referenceType, couponCode } = req.body;

    let amount = LISTING_FEE;
    let discountAmount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        const now = new Date();
        if ((!coupon.validUntil || coupon.validUntil > now) && coupon.validFrom <= now) {
          if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
            if (coupon.discountType === 'percentage') {
              discountAmount = Math.floor(amount * coupon.discountValue / 100);
            } else {
              discountAmount = Math.min(coupon.discountValue, amount);
            }
          }
        }
      }
    }

    amount = Math.max(0, amount - discountAmount);

    const payment = await Payment.create({
      userId: req.user!._id,
      type,
      amount,
      discountAmount,
      couponCode,
      referenceId,
      referenceType,
      status: 'pending',
    });

    if (amount === 0) {
      payment.status = 'success';
      await payment.save();

      if (couponCode) {
        await Coupon.findOneAndUpdate({ code: couponCode.toUpperCase() }, { $inc: { usedCount: 1 } });
      }

      if (referenceType === 'Listing') {
        await Listing.findByIdAndUpdate(referenceId, { paymentId: payment._id, status: 'pending' });
      } else if (referenceType === 'Job') {
        await Job.findByIdAndUpdate(referenceId, { paymentId: payment._id, status: 'pending' });
      }

      sendSuccess(res, { payment, orderId: null, amount: 0, isFree: true });
      return;
    }

    const rzp = await getRazorpay();
    if (!rzp) {
      sendSuccess(res, {
        payment, orderId: `mock_order_${Date.now()}`, amount: amount * 100,
        key: 'mock_key', isMock: true,
      });
      return;
    }

    const order = await rzp.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: payment._id.toString(),
      notes: { paymentId: payment._id.toString(), type, referenceId, referenceType },
    });

    payment.razorpayOrderId = order.id;
    await payment.save();

    sendSuccess(res, {
      payment,
      orderId: order.id,
      amount: amount * 100,
      key: process.env.RAZORPAY_KEY_ID,
      currency: 'INR',
    });
  } catch { sendError(res, 'Failed to create payment order', 500); }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) { sendError(res, 'Payment not found', 404); return; }

    if (razorpayOrderId && razorpayPaymentId && razorpaySignature && process.env.RAZORPAY_KEY_SECRET) {
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSig !== razorpaySignature) {
        payment.status = 'failed';
        await payment.save();
        sendError(res, 'Payment verification failed', 400); return;
      }
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'success';
    await payment.save();

    if (payment.couponCode) {
      await Coupon.findOneAndUpdate({ code: payment.couponCode }, { $inc: { usedCount: 1 } });
    }

    if (payment.referenceType === 'Listing' && payment.referenceId) {
      await Listing.findByIdAndUpdate(payment.referenceId, { paymentId: payment._id, status: 'pending' });
    } else if (payment.referenceType === 'Job' && payment.referenceId) {
      await Job.findByIdAndUpdate(payment.referenceId, { paymentId: payment._id, status: 'pending' });
    }

    sendSuccess(res, payment, 'Payment verified');
  } catch { sendError(res, 'Payment verification failed', 500); }
};

export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    sendSuccess(res, payments);
  } catch { sendError(res, 'Failed to get transactions', 500); }
};

export const validateCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) { sendError(res, 'Invalid coupon code', 400); return; }

    const now = new Date();
    if (coupon.validUntil && coupon.validUntil < now) {
      sendError(res, 'Coupon expired', 400); return;
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      sendError(res, 'Coupon usage limit reached', 400); return;
    }

    const amount = LISTING_FEE;
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.floor(amount * coupon.discountValue / 100);
    } else {
      discountAmount = Math.min(coupon.discountValue, amount);
    }

    sendSuccess(res, {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount: amount - discountAmount,
    });
  } catch { sendError(res, 'Coupon validation failed', 500); }
};
