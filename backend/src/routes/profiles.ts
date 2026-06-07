import { Router } from 'express';
import {
  getAthleteProfile, updateAthleteProfile, getMyAthleteProfile,
  getCoachProfile, updateCoachProfile, getMyCoachProfile,
  getOrganizationProfile, updateOrganizationProfile, uploadVerificationDocuments, getMyOrganizationProfile,
  searchProfiles, downloadAthleteCV, downloadCoachCV,
} from '../controllers/profileController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/search', optionalAuth, searchProfiles);

// Athlete
router.get('/athlete/me', protect, getMyAthleteProfile);
router.get('/athlete/:id/cv', protect, downloadAthleteCV);
router.get('/athlete/:id', optionalAuth, getAthleteProfile);
router.patch('/athlete', protect, updateAthleteProfile);

// Coach
router.get('/coach/me', protect, getMyCoachProfile);
router.get('/coach/:id/cv', protect, downloadCoachCV);
router.get('/coach/:id', optionalAuth, getCoachProfile);
router.patch('/coach', protect, updateCoachProfile);

// Organization
router.get('/organization/me', protect, getMyOrganizationProfile);
router.get('/organization/:id', optionalAuth, getOrganizationProfile);
router.patch('/organization', protect, updateOrganizationProfile);
router.post('/organization/documents', protect, uploadVerificationDocuments);

export default router;
