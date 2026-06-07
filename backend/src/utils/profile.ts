import { AthleteProfile } from '../models/AthleteProfile';
import { CoachProfile } from '../models/CoachProfile';
import { Organization } from '../models/Organization';

export const getProfileName = async (userId: string, role: string): Promise<string> => {
  if (role === 'athlete') {
    const p = await AthleteProfile.findOne({ userId }).select('fullName');
    return p?.fullName || 'User';
  } else if (role === 'coach' || role === 'professional') {
    const p = await CoachProfile.findOne({ userId }).select('fullName');
    return p?.fullName || 'User';
  } else if (role === 'organization') {
    const p = await Organization.findOne({ userId }).select('name');
    return p?.name || 'Organization';
  }
  return 'User';
};

export const getProfileLink = async (userId: string, role: string): Promise<string> => {
  let slug = '';
  if (role === 'athlete') {
    const p = await AthleteProfile.findOne({ userId }).select('profileUrl');
    slug = p?.profileUrl || userId.toString();
  } else if (role === 'coach' || role === 'professional') {
    const p = await CoachProfile.findOne({ userId }).select('profileUrl');
    slug = p?.profileUrl || userId.toString();
  } else if (role === 'organization') {
    const p = await Organization.findOne({ userId }).select('profileUrl');
    slug = p?.profileUrl || userId.toString();
  }
  return `/profile/${slug}`;
};

export const getProfileData = async (userId: string, role: string): Promise<any> => {
  if (role === 'athlete') {
    return await AthleteProfile.findOne({ userId }).select('fullName name photo profileUrl primarySport');
  } else if (role === 'coach' || role === 'professional') {
    return await CoachProfile.findOne({ userId }).select('fullName name photo profileUrl sportsSpecialization');
  } else if (role === 'organization') {
    return await Organization.findOne({ userId }).select('name photo profileUrl');
  }
  return null;
};
