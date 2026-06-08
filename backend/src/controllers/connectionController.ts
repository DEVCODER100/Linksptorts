import { Response } from 'express';
import { AuthRequest } from '../types';
import { Connection, Follow, Block } from '../models/Connection';
import { AthleteProfile } from '../models/AthleteProfile';
import { CoachProfile } from '../models/CoachProfile';
import { Organization } from '../models/Organization';
import { Notification } from '../models/Notification';
import { sendSuccess, sendError } from '../utils/response';
import { getProfileName, getProfileLink, getProfileData } from '../utils/profile';



export const sendConnectionRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { recipientId, note } = req.body;
    const requesterId = req.user!._id.toString();

    if (requesterId === recipientId) {
      sendError(res, 'Cannot connect with yourself', 400); return;
    }

    const existing = await Connection.findOne({
      $or: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') { sendError(res, 'Already connected', 409); return; }
      if (existing.status === 'pending') { sendError(res, 'Request already sent', 409); return; }
      existing.status = 'pending';
      existing.note = note;
      await existing.save();
      sendSuccess(res, existing, 'Connection request sent');
      return;
    }

    const blocked = await Block.findOne({ blockerId: recipientId, blockedId: requesterId });
    if (blocked) { sendError(res, 'Cannot send request', 400); return; }

    const connection = await Connection.create({ requesterId, recipientId, note, status: 'pending' });

    const name = await getProfileName(requesterId, req.user!.role);
    const link = await getProfileLink(requesterId, req.user!.role);
    await Notification.create({
      recipientId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${name} wants to connect with you`,
      referenceId: connection._id,
      referenceType: 'Connection',
      link: link,
    });

    sendSuccess(res, connection, 'Connection request sent', 201);
  } catch { sendError(res, 'Failed to send request', 500); }
};

export const respondToConnection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' | 'reject'

    const connection = await Connection.findOne({ _id: id, recipientId: req.user!._id });
    if (!connection) { sendError(res, 'This request is no longer available', 404, 'NOT_FOUND'); return; }

    // Idempotent: if it's already been handled, don't error out with a confusing
    // "Failed to accept" — report the existing state so the UI can settle.
    if (connection.status !== 'pending') {
      if (connection.status === 'accepted') { sendSuccess(res, connection, 'Already connected'); return; }
      sendError(res, `This request was already ${connection.status}`, 409, 'ALREADY_HANDLED'); return;
    }

    connection.status = action === 'accept' ? 'accepted' : 'rejected';
    if (action === 'accept') connection.acceptedAt = new Date();
    await connection.save();

    if (action === 'accept') {
      await AthleteProfile.findOneAndUpdate({ userId: connection.requesterId }, { $inc: { connectionCount: 1 } });
      await AthleteProfile.findOneAndUpdate({ userId: req.user!._id }, { $inc: { connectionCount: 1 } });
      await CoachProfile.findOneAndUpdate({ userId: connection.requesterId }, { $inc: { connectionCount: 1 } });
      await CoachProfile.findOneAndUpdate({ userId: req.user!._id }, { $inc: { connectionCount: 1 } });

      const acceptorName = await getProfileName(req.user!._id.toString(), req.user!.role);
      const link = await getProfileLink(req.user!._id.toString(), req.user!.role);
      await Notification.create({
        recipientId: connection.requesterId,
        type: 'connection_accepted',
        title: 'Connection Accepted',
        message: `${acceptorName} accepted your connection request`,
        referenceId: connection._id,
        referenceType: 'Connection',
        link: link,
      });
    }

    sendSuccess(res, connection, `Connection ${action}ed`);
  } catch { sendError(res, 'Failed to respond to request', 500); }
};

export const withdrawConnection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const connection = await Connection.findOne({
      _id: id,
      $or: [{ requesterId: req.user!._id }, { recipientId: req.user!._id }],
    });

    if (!connection) { sendError(res, 'Connection not found', 404); return; }

    if (connection.status === 'accepted') {
      // Decrement counts for both parties across all possible profile types
      const userIds = [connection.requesterId, connection.recipientId];
      for (const id of userIds) {
        await AthleteProfile.findOneAndUpdate({ userId: id }, { $inc: { connectionCount: -1 } });
        await CoachProfile.findOneAndUpdate({ userId: id }, { $inc: { connectionCount: -1 } });
        await Organization.findOneAndUpdate({ userId: id }, { $inc: { connectionCount: -1 } });
      }
    }

    await connection.deleteOne();
    sendSuccess(res, null, 'Connection removed');
  } catch { sendError(res, 'Failed to remove connection', 500); }
};

export const getConnections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const userId = req.user!._id;

    const connections = await Connection.find({
      $or: [{ requesterId: userId }, { recipientId: userId }],
      status: 'accepted',
    })
      .populate('requesterId', 'email role')
      .populate('recipientId', 'email role')
      .skip(skip)
      .limit(Number(limit))
      .sort({ acceptedAt: -1 });

    const connectionsWithProfiles = await Promise.all(
      connections.map(async (conn) => {
        const obj = conn.toObject() as any;
        if (obj.requesterId && obj.requesterId._id) {
          obj.requesterProfile = await getProfileData(obj.requesterId._id.toString(), obj.requesterId.role);
        }
        if (obj.recipientId && obj.recipientId._id) {
          obj.recipientProfile = await getProfileData(obj.recipientId._id.toString(), obj.recipientId.role);
        }
        return obj;
      })
    );

    sendSuccess(res, connectionsWithProfiles);
  } catch { sendError(res, 'Failed to get connections', 500); }
};

export const getPendingRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requests = await Connection.find({ recipientId: req.user!._id, status: 'pending' })
      .populate('requesterId', 'email role')
      .sort({ createdAt: -1 });

    const requestsWithProfiles = await Promise.all(
      requests.map(async (reqItem) => {
        const obj = reqItem.toObject() as any;
        if (obj.requesterId && obj.requesterId._id) {
          obj.requesterProfile = await getProfileData(obj.requesterId._id.toString(), obj.requesterId.role);
        }
        return obj;
      })
    );

    sendSuccess(res, requestsWithProfiles);
  } catch { sendError(res, 'Failed to get requests', 500); }
};

export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { followingId } = req.body;
    const followerId = req.user!._id.toString();

    if (followerId === followingId) { sendError(res, 'Cannot follow yourself', 400); return; }

    const existing = await Follow.findOne({ followerId, followingId });
    if (existing) {
      await existing.deleteOne();
      await AthleteProfile.findOneAndUpdate({ userId: followingId }, { $inc: { followerCount: -1 } });
      await CoachProfile.findOneAndUpdate({ userId: followingId }, { $inc: { followerCount: -1 } });
      sendSuccess(res, null, 'Unfollowed');
      return;
    }

    await Follow.create({ followerId, followingId });
    await AthleteProfile.findOneAndUpdate({ userId: followingId }, { $inc: { followerCount: 1 } });
    await CoachProfile.findOneAndUpdate({ userId: followingId }, { $inc: { followerCount: 1 } });
    
    // Send notification
    const followerName = await getProfileName(followerId, req.user!.role);
    const followerLink = await getProfileLink(followerId, req.user!.role);
    await Notification.create({
      recipientId: followingId,
      type: 'new_follower',
      title: 'New Follower',
      message: `${followerName} started following you`,
      referenceId: followerId,
      referenceType: 'User',
      link: followerLink,
    });

    sendSuccess(res, null, 'Following', 201);
  } catch { sendError(res, 'Follow action failed', 500); }
};

export const blockUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { blockedId } = req.body;
    const blockerId = req.user!._id.toString();

    await Block.findOneAndUpdate({ blockerId, blockedId }, { blockerId, blockedId }, { upsert: true });
    await Connection.deleteOne({
      $or: [
        { requesterId: blockerId, recipientId: blockedId },
        { requesterId: blockedId, recipientId: blockerId },
      ],
    });

    sendSuccess(res, null, 'User blocked');
  } catch { sendError(res, 'Failed to block user', 500); }
};

// Bulk status lookup — given a list of userIds, return a map of
// userId -> 'accepted' | 'pending' (I sent) | 'incoming' (they sent) | undefined.
// Used by the search/listing grids so already-connected users don't show "Connect".
export const getConnectionStatusesBulk = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!._id.toString();
    const userIds: string[] = Array.isArray(req.body?.userIds) ? req.body.userIds.filter(Boolean) : [];
    if (userIds.length === 0) { sendSuccess(res, {}); return; }

    const connections = await Connection.find({
      $or: [
        { requesterId: currentUserId, recipientId: { $in: userIds } },
        { requesterId: { $in: userIds }, recipientId: currentUserId },
      ],
    });

    const statusMap: Record<string, string> = {};
    for (const conn of connections) {
      const otherId = conn.requesterId.toString() === currentUserId
        ? conn.recipientId.toString()
        : conn.requesterId.toString();
      if (conn.status === 'accepted') {
        statusMap[otherId] = 'accepted';
      } else if (conn.status === 'pending') {
        statusMap[otherId] = conn.requesterId.toString() === currentUserId ? 'pending' : 'incoming';
      }
    }

    sendSuccess(res, statusMap);
  } catch { sendError(res, 'Failed to get statuses', 500); }
};

export const getConnectionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!._id.toString();

    const connection = await Connection.findOne({
      $or: [
        { requesterId: currentUserId, recipientId: userId },
        { requesterId: userId, recipientId: currentUserId },
      ],
    });

    const follow = await Follow.findOne({ followerId: currentUserId, followingId: userId });
    const blocked = await Block.findOne({ blockerId: currentUserId, blockedId: userId });

    sendSuccess(res, {
      connection: connection || null,
      isFollowing: !!follow,
      isBlocked: !!blocked,
    });
  } catch { sendError(res, 'Failed to get status', 500); }
};
