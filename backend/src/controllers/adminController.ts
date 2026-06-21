import { Response } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { AthleteProfile } from '../models/AthleteProfile';
import { CoachProfile } from '../models/CoachProfile';
import { Organization } from '../models/Organization';
import { Listing } from '../models/Listing';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { Payment, Coupon } from '../models/Payment';
import { Notification } from '../models/Notification';
import { PredictorSubmission } from '../models/PredictorSubmission';
import { sendSuccess, sendError } from '../utils/response';

// ── Predictor submissions (admin analytics) ───────────────────────────────────
const TEAMISH = (v: unknown): v is string => typeof v === 'string' && !!v && !/(Winner|Loser|TBD|Grp)/.test(v);

// GET /admin/predictions — every user's bracket, with filters:
//   ?team=Brazil            users who predicted that team anywhere in the bracket
//   ?champion=Brazil        users who picked that team as champion
//   ?actualChampion=Brazil  marks each row correct/incorrect (champion match)
//   ?result=correct|incorrect  (requires actualChampion) who won / who lost
export const getPredictions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { team, champion, actualChampion, result, page = '1', limit = '50' } = req.query as Record<string, string>;

    const subs = await PredictorSubmission.find({}).sort({ updatedAt: -1 }).lean();
    const userIds = subs.map((s) => s.userId);
    const [users, athletes, coaches, orgs] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('email role').lean(),
      AthleteProfile.find({ userId: { $in: userIds } }).select('userId fullName').lean(),
      CoachProfile.find({ userId: { $in: userIds } }).select('userId fullName').lean(),
      Organization.find({ userId: { $in: userIds } }).select('userId name').lean(),
    ]);
    const erMap = new Map(users.map((u: any) => [String(u._id), { email: u.email as string, role: u.role as string }]));
    const nameMap = new Map<string, string>();
    for (const a of athletes as any[]) if (a.fullName) nameMap.set(String(a.userId), a.fullName);
    for (const c of coaches as any[]) if (c.fullName) nameMap.set(String(c.userId), c.fullName);
    for (const o of orgs as any[]) if (o.name) nameMap.set(String(o.userId), o.name);

    let items = subs.map((s) => {
      const data = (s.data || {}) as { treeWinners?: Record<string, unknown> };
      const tw = data.treeWinners || {};
      const pickedTeams = Array.from(new Set(Object.values(tw).filter(TEAMISH)));
      const champ = (s.champion && TEAMISH(s.champion)) ? s.champion : (TEAMISH(tw.GOLD) ? (tw.GOLD as string) : null);
      if (champ && !pickedTeams.includes(champ)) pickedTeams.push(champ);
      const er = erMap.get(String(s.userId)) || { email: '', role: '' };
      return {
        userId: s.userId,
        name: nameMap.get(String(s.userId)) || (er.email ? er.email.split('@')[0] : 'Member'),
        email: er.email,
        role: er.role,
        champion: champ,
        finalists: [tw.SF_L, tw.SF_R].filter(TEAMISH),
        pickedTeams,
        correct: actualChampion ? champ === actualChampion : null,
        updatedAt: s.updatedAt,
      };
    });

    // Champion distribution across ALL submissions (unfiltered overview).
    const counts: Record<string, number> = {};
    for (const it of items) if (it.champion) counts[it.champion] = (counts[it.champion] || 0) + 1;
    const championCounts = Object.entries(counts).map(([t, c]) => ({ team: t, count: c })).sort((a, b) => b.count - a.count);

    if (champion) items = items.filter((i) => i.champion === champion);
    if (team) items = items.filter((i) => i.pickedTeams.some((t) => t.toLowerCase() === team.toLowerCase()));
    if (actualChampion && result === 'correct') items = items.filter((i) => i.correct === true);
    if (actualChampion && result === 'incorrect') items = items.filter((i) => i.correct === false);

    const total = items.length;
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const paged = items.slice((p - 1) * l, (p - 1) * l + l);

    sendSuccess(res, { items: paged, total, page: p, totalSubmissions: subs.length, championCounts }, 'Predictions fetched');
  } catch {
    sendError(res, 'Failed to fetch predictions', 500);
  }
};

export const getDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers, athletes, coaches, orgs, listings, jobs, totalRevenue, pendingListings, pendingOrgs,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'athlete' }),
      User.countDocuments({ role: 'coach' }),
      User.countDocuments({ role: 'organization' }),
      Listing.countDocuments({ status: 'published' }),
      Job.countDocuments({ status: 'published' }),
      Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Listing.countDocuments({ status: 'pending' }),
      Organization.countDocuments({ verificationStatus: 'pending' }),
    ]);

    sendSuccess(res, {
      users: { total: totalUsers, athletes, coaches, organizations: orgs },
      listings: { active: listings },
      jobs: { active: jobs },
      revenue: { total: totalRevenue[0]?.total || 0 },
      pendingApprovals: { listings: pendingListings, organizations: pendingOrgs },
    });
  } catch { sendError(res, 'Failed to get dashboard', 500); }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, q, page = 1, limit = 20, suspended } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query: Record<string, unknown> = {};

    if (role) query.role = role;
    if (suspended !== undefined) query.isSuspended = suspended === 'true';
    if (q) query.email = new RegExp(q as string, 'i');

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    sendSuccess(res, users, 'Users fetched', 200, {
      total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit),
    });
  } catch { sendError(res, 'Failed to get users', 500); }
};

// GET /admin/profiles?type=athlete|coach|organization&q=&page=&limit=
// Full profile docs for the admin dashboard, with the owner's email/role attached.
export const getProfiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, q, page = '1', limit = '50' } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const skip = (p - 1) * l;

    const Model: any = type === 'coach' ? CoachProfile : type === 'organization' ? Organization : AthleteProfile;
    const nameField = type === 'organization' ? 'name' : 'fullName';

    const filter: Record<string, unknown> = {};
    if (q && q.trim()) filter[nameField] = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [docs, total] = await Promise.all([
      Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
      Model.countDocuments(filter),
    ]);

    const userIds = (docs as any[]).map((d) => d.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select('email role isSuspended createdAt').lean();
    const userMap = new Map(
      (users as any[]).map((u) => [String(u._id), { email: u.email, role: u.role, isSuspended: u.isSuspended, joinedAt: u.createdAt }])
    );
    const items = (docs as any[]).map((d) => ({ ...d, owner: userMap.get(String(d.userId)) || null }));

    sendSuccess(res, items, 'Profiles fetched', 200, { total, page: p, pages: Math.ceil(total / l), limit: l });
  } catch { sendError(res, 'Failed to get profiles', 500); }
};

export const suspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { sendError(res, 'User not found', 404); return; }
    user.isSuspended = !user.isSuspended;
    await user.save();
    sendSuccess(res, user, `User ${user.isSuspended ? 'suspended' : 'unsuspended'}`);
  } catch { sendError(res, 'Failed to update user', 500); }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, role, phone } = req.body;
    if (!email || !password || !role) { sendError(res, 'email, password and role are required', 400); return; }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) { sendError(res, 'Email already in use', 409); return; }
    const user = await User.create({ email: email.toLowerCase(), passwordHash: password, role, phone, isVerified: true, authProvider: 'email' });
    sendSuccess(res, user, 'User created', 201);
  } catch { sendError(res, 'Failed to create user', 500); }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, phone, isVerified, isSuspended, password } = req.body;
    const user = await User.findById(req.params.id).select('+passwordHash');
    if (!user) { sendError(res, 'User not found', 404); return; }
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (isSuspended !== undefined) user.isSuspended = isSuspended;
    if (password) user.passwordHash = password;
    await user.save();
    sendSuccess(res, user, 'User updated');
  } catch { sendError(res, 'Failed to update user', 500); }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { sendError(res, 'User not found', 404); return; }
    if (String(user._id) === String(req.user!._id)) { sendError(res, 'Cannot delete your own account', 400); return; }
    await Promise.all([
      AthleteProfile.deleteOne({ userId: user._id }),
      CoachProfile.deleteOne({ userId: user._id }),
      Organization.deleteOne({ userId: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);
    sendSuccess(res, null, 'User deleted');
  } catch { sendError(res, 'Failed to delete user', 500); }
};

export const getPendingListings = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listings = await Listing.find({ status: 'pending' })
      .populate('organizationId', 'name logo isVerified')
      .sort({ createdAt: 1 });
    sendSuccess(res, listings);
  } catch { sendError(res, 'Failed to get pending listings', 500); }
};

export const reviewListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing || listing.status !== 'pending') { sendError(res, 'Listing not found', 404); return; }

    const { action, reason } = req.body;

    if (action === 'approve') {
      listing.status = 'published';
    } else if (action === 'reject') {
      listing.status = 'draft';
      listing.rejectionReason = reason;
    } else if (action === 'request_changes') {
      listing.status = 'draft';
      listing.rejectionReason = reason;
    }

    await listing.save();

    // Notify the org about the review outcome
    await Notification.create({
      recipientId: listing.createdBy,
      type: action === 'approve' ? 'listing_approved' : 'listing_rejected',
      title: `Listing ${action === 'approve' ? 'Approved' : 'Needs Changes'}`,
      message: action === 'approve'
        ? `Your listing "${listing.title}" has been approved and is now live!`
        : `Your listing "${listing.title}" was ${action === 'reject' ? 'rejected' : 'returned for changes'}. ${reason || ''}`,
      referenceId: listing._id,
      referenceType: 'Listing',
    });

    // Notify all athletes when a listing goes live
    if (action === 'approve') {
      const org = await Organization.findById(listing.organizationId).select('name').lean();
      const athletes = await User.find({ role: 'athlete' }, '_id').lean();
      if (athletes.length > 0) {
        const typeLabel = listing.type.replace(/_/g, ' ');
        const athleteNotifs = athletes.map((a) => ({
          recipientId: a._id,
          type: 'new_event_posted',
          title: `New ${typeLabel} posted`,
          message: `${org?.name || 'An organisation'} just posted a new ${typeLabel}: "${listing.title}"`,
          referenceId: listing._id,
          referenceType: 'Listing',
          link: `/listings/${listing._id}`,
          isRead: false,
        }));
        Notification.insertMany(athleteNotifs, { ordered: false }).catch((e) =>
          console.error('[Notify] Failed to notify athletes:', e)
        );
      }
    }

    sendSuccess(res, listing, `Listing ${action}d`);
  } catch { sendError(res, 'Failed to review listing', 500); }
};

export const getPendingJobs = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find({ status: 'pending' })
      .populate('organizationId', 'name logo')
      .sort({ createdAt: 1 });
    sendSuccess(res, jobs);
  } catch { sendError(res, 'Failed to get pending jobs', 500); }
};

export const reviewJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || job.status !== 'pending') { sendError(res, 'Job not found', 404); return; }

    const { action, reason } = req.body;

    if (action === 'approve') job.status = 'published';
    else { job.status = 'draft'; job.rejectionReason = reason; }

    await job.save();

    await Notification.create({
      recipientId: job.createdBy,
      type: action === 'approve' ? 'new_job_posted' : 'job_rejected',
      title: `Job ${action === 'approve' ? 'Approved' : 'Needs Changes'}`,
      message: action === 'approve'
        ? `Your job "${job.title}" is now live!`
        : `Your job "${job.title}" needs changes. ${reason || ''}`,
      referenceId: job._id,
      referenceType: 'Job',
    });

    sendSuccess(res, job, `Job ${action}d`);
  } catch { sendError(res, 'Failed to review job', 500); }
};

export const getPendingOrganizations = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgs = await Organization.find({ verificationStatus: 'pending' })
      .populate('userId', 'email phone')
      .sort({ createdAt: 1 });
    sendSuccess(res, orgs);
  } catch { sendError(res, 'Failed to get pending orgs', 500); }
};

export const verifyOrganization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) { sendError(res, 'Organization not found', 404); return; }

    const { action, reason } = req.body;

    org.verificationStatus = action === 'approve' ? 'verified' : 'rejected';
    org.isVerified = action === 'approve';
    if (reason) org.rejectionReason = reason;

    if (action === 'approve') {
      await User.findByIdAndUpdate(org.userId, { isApproved: true });
    }

    await org.save();

    await Notification.create({
      recipientId: org.userId,
      type: 'org_verification',
      title: `Organization ${action === 'approve' ? 'Verified' : 'Verification Failed'}`,
      message: action === 'approve'
        ? 'Your organization has been verified! You can now post listings.'
        : `Verification failed. ${reason || ''}`,
      referenceId: org._id,
      referenceType: 'Organization',
    });

    sendSuccess(res, org, `Organization ${action}d`);
  } catch { sendError(res, 'Failed to verify organization', 500); }
};

export const getCoupons = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    sendSuccess(res, coupons);
  } catch { sendError(res, 'Failed to get coupons', 500); }
};

export const createCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, discountType, discountValue, maxUses, expiresAt, description } = req.body;
    if (!code || !discountType || discountValue === undefined) {
      sendError(res, 'code, discountType and discountValue are required', 400); return;
    }
    if (!['percentage', 'flat'].includes(discountType)) {
      sendError(res, 'discountType must be percentage or flat', 400); return;
    }
    if (typeof discountValue !== 'number' || discountValue <= 0) {
      sendError(res, 'discountValue must be a positive number', 400); return;
    }
    const coupon = await Coupon.create({
      code: String(code).toUpperCase().trim(),
      discountType,
      discountValue,
      maxUses: maxUses ? Number(maxUses) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      description: description ? String(description).slice(0, 500) : undefined,
      createdBy: req.user!._id,
    });
    sendSuccess(res, coupon, 'Coupon created', 201);
  } catch { sendError(res, 'Failed to create coupon', 500); }
};

export const toggleCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) { sendError(res, 'Coupon not found', 404); return; }
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    sendSuccess(res, coupon, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`);
  } catch { sendError(res, 'Failed to update coupon', 500); }
};

export const getRevenueReport = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, byType, recent] = await Promise.all([
      Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.find({ status: 'success' }).sort({ createdAt: -1 }).limit(20).populate('userId', 'email'),
    ]);

    sendSuccess(res, { total: total[0]?.total || 0, byType, recent });
  } catch { sendError(res, 'Failed to get revenue report', 500); }
};

export const createSystemAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message, targetRole } = req.body;
    const query = targetRole ? { role: targetRole } : {};
    const users = await User.find(query).select('_id');

    const notifications = users.map((u) => ({
      recipientId: u._id,
      type: 'system_announcement',
      title,
      message,
    }));

    await Notification.insertMany(notifications);
    sendSuccess(res, { sent: notifications.length }, 'Announcement sent');
  } catch { sendError(res, 'Failed to send announcement', 500); }
};
