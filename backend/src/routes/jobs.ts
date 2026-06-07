import { Router } from 'express';
import {
  createJob, submitJobForReview, getJobs, getJob, applyToJob,
  getJobApplications, updateJobApplicationStatus, getMyJobApplications,
  saveJob, getMyOrgJobs,
} from '../controllers/jobController';
import { protect, optionalAuth, authorize } from '../middleware/auth';
import { validateCreateJob } from '../middleware/validate';

const router = Router();

router.get('/', optionalAuth, getJobs);
router.get('/mine/applications', protect, getMyJobApplications);
router.get('/mine/listings', protect, authorize('organization'), getMyOrgJobs);
router.get('/:id', optionalAuth, getJob);

router.post('/', protect, authorize('organization'), validateCreateJob, createJob);
router.post('/:id/submit', protect, authorize('organization'), submitJobForReview);
router.get('/:id/applications', protect, authorize('organization'), getJobApplications);
router.patch('/:id/applications/:appId/status', protect, authorize('organization'), updateJobApplicationStatus);

router.post('/:id/apply', protect, applyToJob);
router.post('/save', protect, saveJob);

export default router;
