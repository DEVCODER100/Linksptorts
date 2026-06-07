import { Response } from 'express';
import { AuthRequest } from '../types';
import { Listing } from '../models/Listing';
import { Application } from '../models/Application';
import { Organization } from '../models/Organization';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import { getProfileName } from '../utils/profile';

const notifyAllAthletes = async (listingId: unknown, orgName: string, listingTitle: string, listingType: string) => {
  try {
    const athletes = await User.find({ role: 'athlete' }, '_id').lean();
    if (athletes.length === 0) return;
    const typeLabel = listingType.replace(/_/g, ' ');
    const notifications = athletes.map((a) => ({
      recipientId: a._id,
      type: 'new_event_posted',
      title: `New ${typeLabel} posted`,
      message: `${orgName} just posted a new ${typeLabel}: "${listingTitle}"`,
      referenceId: listingId,
      referenceType: 'Listing',
      link: `/listings/${listingId}`,
      isRead: false,
    }));
    await Notification.insertMany(notifications, { ordered: false });
  } catch (err) {
    console.error('[Notify] Failed to notify athletes of new listing:', err);
  }
};

export const createListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const org = await Organization.findOne({ userId: req.user!._id });
    if (!org) { sendError(res, 'Organization profile required', 403); return; }

    const listing = await Listing.create({
      ...req.body,
      organizationId: org._id,
      createdBy: req.user!._id,
      status: 'published',
    });

    // Fire-and-forget — don't block the response
    notifyAllAthletes(listing._id, org.name, listing.title, listing.type);

    sendSuccess(res, listing, 'Listing published successfully', 201);
  } catch { sendError(res, 'Failed to create listing', 500); }
};

export const submitListingForReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, createdBy: req.user!._id });
    if (!listing) { sendError(res, 'Listing not found', 404); return; }
    if (listing.status !== 'draft') { sendError(res, 'Only draft listings can be submitted', 400); return; }

    listing.status = 'pending';
    await listing.save();

    sendSuccess(res, listing, 'Listing submitted for review');
  } catch { sendError(res, 'Failed to submit listing', 500); }
};

export const getListings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      type, sport, state, city, page = 1, limit = 20,
      dateFrom, dateTo, free, q, status = 'published',
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const query: Record<string, unknown> = { status };

    if (type) query.type = type;
    if (sport) query.sports = sport;
    if (state) query['location.state'] = state;
    if (city) query['location.city'] = city;
    if (free === 'true') query.participantFee = 0;
    if (q) {
      const regex = new RegExp(q as string, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { sports: regex },
      ];
    }
    if (dateFrom || dateTo) {
      query.startDate = {};
      if (dateFrom) (query.startDate as Record<string, Date>).$gte = new Date(dateFrom as string);
      if (dateTo) (query.startDate as Record<string, Date>).$lte = new Date(dateTo as string);
    }

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate('organizationId', 'name logo isVerified type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-customQuestions -cancellationReason'),
      Listing.countDocuments(query),
    ]);

    sendSuccess(res, listings, 'Listings fetched', 200, {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    });
  } catch { sendError(res, 'Failed to fetch listings', 500); }
};

export const getListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('organizationId', 'name logo isVerified type contact');

    if (!listing) { sendError(res, 'Listing not found', 404); return; }

    let userApplication = null;
    if (req.user) {
      userApplication = await Application.findOne({ listingId: listing._id, applicantId: req.user._id });
    }

    sendSuccess(res, { listing, userApplication });
  } catch { sendError(res, 'Failed to get listing', 500); }
};

export const updateListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, createdBy: req.user!._id });
    if (!listing) { sendError(res, 'Listing not found', 404); return; }
    if (!['draft', 'published'].includes(listing.status)) {
      sendError(res, 'Cannot edit listing in current status', 400); return;
    }

    const allowedFields = [
      'title', 'description', 'sports', 'startDate', 'endDate', 'location',
      'eligibility', 'physicalRequirements', 'participantLimit', 'registrationDeadline',
      'participantFee', 'customQuestions', 'documentRequired', 'documentDescription',
      'banner', 'contactInfo', 'allowWithdrawal',
    ];

    allowedFields.forEach((f) => { if (req.body[f] !== undefined) (listing as any)[f] = req.body[f]; });

    // Keep published listings published after edit (no re-review needed)
    await listing.save();
    sendSuccess(res, listing, 'Listing updated');
  } catch { sendError(res, 'Failed to update listing', 500); }
};

export const cancelListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, createdBy: req.user!._id });
    if (!listing) { sendError(res, 'Listing not found', 404); return; }
    if (['completed', 'cancelled'].includes(listing.status)) {
      sendError(res, 'Cannot cancel listing', 400); return;
    }

    const { reason } = req.body;
    listing.status = 'cancelled';
    listing.cancellationReason = reason;
    await listing.save();

    const applications = await Application.find({ listingId: listing._id, status: { $ne: 'withdrawn' } });
    const notifications = applications.map((app) => ({
      recipientId: app.applicantId,
      type: 'listing_cancelled',
      title: 'Listing Cancelled',
      message: `"${listing.title}" has been cancelled. ${reason || ''}`,
      referenceId: listing._id,
      referenceType: 'Listing',
    }));

    if (notifications.length > 0) await Notification.insertMany(notifications);
    sendSuccess(res, listing, 'Listing cancelled');
  } catch { sendError(res, 'Failed to cancel listing', 500); }
};

export const applyToListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) { sendError(res, 'Listing not found', 404); return; }
    if (listing.status !== 'published') { sendError(res, 'This listing is not accepting applications', 400); return; }

    if (listing.registrationDeadline && listing.registrationDeadline < new Date()) {
      sendError(res, 'Registration deadline has passed', 400); return;
    }

    if (listing.participantLimit && listing.participantCount >= listing.participantLimit) {
      sendError(res, 'Participant limit reached', 400); return;
    }

    const existing = await Application.findOne({ listingId: listing._id, applicantId: req.user!._id });
    if (existing) { sendError(res, 'Already applied', 409); return; }

    const { answers, documents } = req.body;

    const application = await Application.create({
      listingId: listing._id,
      applicantId: req.user!._id,
      applicantProfileType: req.user!.role as 'athlete' | 'coach' | 'professional',
      answers: answers || [],
      documents: documents || [],
      status: 'applied',
    });

    await Listing.findByIdAndUpdate(listing._id, { $inc: { participantCount: 1 } });
    
    // Notify organization
    const registrantName = await getProfileName(req.user!._id.toString(), req.user!.role);
    const notifType = listing.type === 'training_camp' ? 'training_registration' : 'event_registration';
    await Notification.create({
      recipientId: listing.createdBy,
      type: notifType,
      title: listing.type === 'training_camp' ? 'New Training Registration' : 'New Event Registration',
      message: `${registrantName} registered for your ${listing.type.replace('_', ' ')}: ${listing.title}`,
      referenceId: application._id,
      referenceType: 'Application',
    });

    if (listing.participantLimit && listing.participantCount + 1 >= listing.participantLimit) {
      await Listing.findByIdAndUpdate(listing._id, { status: 'closed' });
    }

    sendSuccess(res, application, 'Application submitted', 201);
  } catch { sendError(res, 'Failed to apply', 500); }
};

export const getListingApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) { sendError(res, 'Listing not found', 404); return; }

    const { status, page = 1, limit = 50, q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query: Record<string, unknown> = { listingId: listing._id };
    if (status) query.status = status;

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('applicantId', 'email role')
        .skip(skip)
        .limit(Number(limit))
        .sort({ appliedAt: -1 }),
      Application.countDocuments(query),
    ]);

    const populatedApps = await Promise.all(
      applications.map(async (app) => {
        const userId = (app.applicantId as any)._id || app.applicantId;
        const role = (app.applicantId as { role?: string }).role || app.applicantProfileType;
        let profile = null;
        if (role === 'athlete') {
          profile = await (await import('../models/AthleteProfile')).AthleteProfile.findOne({ userId }).select('fullName photo primarySport location');
        } else if (role === 'coach') {
          profile = await (await import('../models/CoachProfile')).CoachProfile.findOne({ userId }).select('fullName photo sportsSpecialization');
        }
        return { ...app.toObject(), profile };
      })
    );

    sendSuccess(res, populatedApps, 'Applications fetched', 200, {
      total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit),
    });
  } catch { sendError(res, 'Failed to get applications', 500); }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appId } = req.params;
    const { status, reason } = req.body;

    const application = await Application.findById(appId);
    if (!application) { sendError(res, 'Application not found', 404); return; }

    const listing = await Listing.findOne({ _id: application.listingId, createdBy: req.user!._id });
    if (!listing) { sendError(res, 'Not authorized', 403); return; }

    application.status = status;
    if (reason) application.rejectionReason = reason;
    application.statusUpdatedAt = new Date();
    await application.save();

    await Notification.create({
      recipientId: application.applicantId,
      type: 'application_status',
      title: `Application ${status}`,
      message: `Your application for "${listing.title}" has been ${status}`,
      referenceId: application._id,
      referenceType: 'Application',
    });

    sendSuccess(res, application, 'Application status updated');
  } catch { sendError(res, 'Failed to update application', 500); }
};

export const getMyListings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const org = await Organization.findOne({ userId: req.user!._id });
    if (!org) { sendError(res, 'Organization not found', 404); return; }

    const listings = await Listing.find({ organizationId: org._id }).sort({ createdAt: -1 });
    sendSuccess(res, listings);
  } catch { sendError(res, 'Failed to get listings', 500); }
};

export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const applications = await Application.find({ applicantId: req.user!._id })
      .populate('listingId', 'title type status startDate location organizationId')
      .sort({ appliedAt: -1 });

    const populated = await Promise.all(
      applications.map(async (app) => {
        const listing = app.listingId as any;
        let org = null;
        if (listing?.organizationId) {
          org = await Organization.findById(listing.organizationId).select('name logo');
        }
        return { ...app.toObject(), organization: org };
      })
    );

    sendSuccess(res, populated);
  } catch { sendError(res, 'Failed to get applications', 500); }
};
