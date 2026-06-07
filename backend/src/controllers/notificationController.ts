import { Response } from 'express';
import { AuthRequest } from '../types';
import { Notification } from '../models/Notification';
import { sendSuccess, sendError } from '../utils/response';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unread] = await Promise.all([
      Notification.find({ recipientId: req.user!._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments({ recipientId: req.user!._id }),
      Notification.countDocuments({ recipientId: req.user!._id, isRead: false }),
    ]);

    sendSuccess(res, { notifications, unreadCount: unread }, 'Notifications fetched', 200, {
      total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit),
    });
  } catch { sendError(res, 'Failed to get notifications', 500); }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, recipientId: req.user!._id },
      { isRead: true }
    );
    sendSuccess(res, null, 'Notification marked as read');
  } catch { sendError(res, 'Failed to mark notification', 500); }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ recipientId: req.user!._id, isRead: false }, { isRead: true });
    sendSuccess(res, null, 'All notifications marked as read');
  } catch { sendError(res, 'Failed to mark notifications', 500); }
};
