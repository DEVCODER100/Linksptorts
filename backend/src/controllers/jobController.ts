import { Response } from 'express';
import { AuthRequest } from '../types';
import { Job } from '../models/Job';
import { JobApplication } from '../models/JobApplication';
import { Organization } from '../models/Organization';
import { Notification } from '../models/Notification';
import { sendSuccess, sendError } from '../utils/response';
import { getProfileName } from '../utils/profile';

export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const org = await Organization.findOne({ userId: req.user!._id });
    if (!org) { sendError(res, 'Organization profile required', 403); return; }

    const job = await Job.create({
      ...req.body,
      organizationId: org._id,
      createdBy: req.user!._id,
      status: 'draft',
    });

    sendSuccess(res, job, 'Job created', 201);
  } catch { sendError(res, 'Failed to create job', 500); }
};

export const submitJobForReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await Job.findOne({ _id: req.params.id, createdBy: req.user!._id });
    if (!job) { sendError(res, 'Job not found', 404); return; }
    if (job.status !== 'draft') { sendError(res, 'Only draft jobs can be submitted', 400); return; }

    job.status = 'pending';
    await job.save();
    sendSuccess(res, job, 'Job submitted for review');
  } catch { sendError(res, 'Failed to submit job', 500); }
};

export const getJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, location, jobType, experience, q, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query: Record<string, unknown> = { status: 'published' };

    if (category) query.category = category;
    if (jobType) query.jobType = jobType;
    if (experience) query.experienceLevel = experience;
    if (q) query.$text = { $search: q as string };
    if (location) query.location = new RegExp(location as string, 'i');

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('organizationId', 'name logo isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Job.countDocuments(query),
    ]);

    sendSuccess(res, jobs, 'Jobs fetched', 200, {
      total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit),
    });
  } catch { sendError(res, 'Failed to fetch jobs', 500); }
};

export const getJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id).populate('organizationId', 'name logo isVerified type contact');
    if (!job) { sendError(res, 'Job not found', 404); return; }

    let userApplication = null;
    if (req.user) {
      userApplication = await JobApplication.findOne({ jobId: job._id, applicantId: req.user._id });
    }

    sendSuccess(res, { job, userApplication });
  } catch { sendError(res, 'Failed to get job', 500); }
};

export const applyToJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || job.status !== 'published') { sendError(res, 'Job not available', 400); return; }

    if (job.applicationDeadline && job.applicationDeadline < new Date()) {
      sendError(res, 'Application deadline passed', 400); return;
    }

    const existing = await JobApplication.findOne({ jobId: job._id, applicantId: req.user!._id });
    if (existing) { sendError(res, 'Already applied', 409); return; }

    const application = await JobApplication.create({
      jobId: job._id,
      applicantId: req.user!._id,
      coverLetter: req.body.coverLetter,
    });

    await Job.findByIdAndUpdate(job._id, { $inc: { applicantCount: 1 } });

    // Send notification to job creator
    const applicantName = await getProfileName(req.user!._id.toString(), req.user!.role);
    await Notification.create({
      recipientId: job.createdBy,
      type: 'job_application',
      title: 'New Job Application',
      message: `${applicantName} applied for your job: ${job.title}`,
      referenceId: application._id,
      referenceType: 'JobApplication',
      link: `/jobs/${job._id}/applications`,
    });

    sendSuccess(res, application, 'Application submitted', 201);
  } catch { sendError(res, 'Failed to apply', 500); }
};

export const getJobApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await Job.findOne({ _id: req.params.id, createdBy: req.user!._id });
    if (!job) { sendError(res, 'Job not found', 404); return; }

    const { status, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query: Record<string, unknown> = { jobId: job._id };
    if (status) query.status = status;

    const [applications, total] = await Promise.all([
      JobApplication.find(query)
        .populate('applicantId', 'email role')
        .skip(skip)
        .limit(Number(limit))
        .sort({ appliedAt: -1 }),
      JobApplication.countDocuments(query),
    ]);

    sendSuccess(res, applications, 'Applications fetched', 200, {
      total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit),
    });
  } catch { sendError(res, 'Failed to get applications', 500); }
};

export const updateJobApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await JobApplication.findById(req.params.appId);
    if (!app) { sendError(res, 'Application not found', 404); return; }

    const job = await Job.findOne({ _id: app.jobId, createdBy: req.user!._id });
    if (!job) { sendError(res, 'Not authorized', 403); return; }

    app.status = req.body.status;
    if (req.body.reason) app.rejectionReason = req.body.reason;
    app.statusUpdatedAt = new Date();
    await app.save();

    await Notification.create({
      recipientId: app.applicantId,
      type: 'application_status',
      title: `Job Application ${req.body.status}`,
      message: `Your application for "${job.title}" has been ${req.body.status}`,
      referenceId: app._id,
      referenceType: 'JobApplication',
    });

    sendSuccess(res, app, 'Status updated');
  } catch { sendError(res, 'Failed to update status', 500); }
};

export const getMyJobApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const applications = await JobApplication.find({ applicantId: req.user!._id })
      .populate({ path: 'jobId', populate: { path: 'organizationId', select: 'name logo' } })
      .sort({ appliedAt: -1 });
    sendSuccess(res, applications);
  } catch { sendError(res, 'Failed to get job applications', 500); }
};

export const saveJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.body;
    const existing = await JobApplication.findOne({ jobId, applicantId: req.user!._id });
    if (!existing) {
      await JobApplication.create({ jobId, applicantId: req.user!._id, status: 'applied', savedBy: [req.user!._id] });
    }
    sendSuccess(res, null, 'Job saved');
  } catch { sendError(res, 'Failed to save job', 500); }
};

export const getMyOrgJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const org = await Organization.findOne({ userId: req.user!._id });
    if (!org) { sendError(res, 'Organization not found', 404); return; }
    const jobs = await Job.find({ organizationId: org._id }).sort({ createdAt: -1 });
    sendSuccess(res, jobs);
  } catch { sendError(res, 'Failed to get jobs', 500); }
};
