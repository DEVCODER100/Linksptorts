import { Router } from 'express';
import {
  createListing, submitListingForReview, getListings, getListing,
  updateListing, cancelListing, applyToListing, getListingApplications,
  updateApplicationStatus, getMyListings, getMyApplications,
} from '../controllers/listingController';
import { protect, optionalAuth, authorize } from '../middleware/auth';
import { validateCreateListing } from '../middleware/validate';

const router = Router();

router.get('/', optionalAuth, getListings);
router.get('/my', protect, getMyListings);
router.get('/applications/mine', protect, getMyApplications);
router.get('/:id', optionalAuth, getListing);

router.post('/', protect, authorize('organization'), validateCreateListing, createListing);
router.patch('/:id', protect, authorize('organization'), updateListing);
router.post('/:id/submit', protect, authorize('organization'), submitListingForReview);
router.post('/:id/cancel', protect, authorize('organization'), cancelListing);
router.get('/:id/applications', protect, authorize('organization'), getListingApplications);
router.patch('/applications/:appId/status', protect, authorize('organization'), updateApplicationStatus);

router.post('/:id/apply', protect, authorize('athlete', 'coach', 'professional'), applyToListing);

export default router;
