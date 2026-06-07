import { Router } from 'express';
import {
  getDashboard, getUsers, suspendUser, createUser, updateUser, deleteUser,
  getPendingListings, reviewListing,
  getPendingJobs, reviewJob,
  getPendingOrganizations, verifyOrganization,
  getCoupons, createCoupon, toggleCoupon,
  getRevenueReport, createSystemAnnouncement,
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.patch('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUser);

router.get('/listings/pending', getPendingListings);
router.patch('/listings/:id/review', reviewListing);

router.get('/jobs/pending', getPendingJobs);
router.patch('/jobs/:id/review', reviewJob);

router.get('/organizations/pending', getPendingOrganizations);
router.patch('/organizations/:id/verify', verifyOrganization);

router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.patch('/coupons/:id/toggle', toggleCoupon);

router.get('/revenue', getRevenueReport);
router.post('/announcements', createSystemAnnouncement);

export default router;
