'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { profileAPI, connectionAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials, formatDate, getListingTypeBadge, getPhotoUrl, formatCurrency } from '@/lib/utils';
import {
  MapPin, CheckCircle, Globe, ChevronLeft, Loader2, Building2, Edit,
  Briefcase, Calendar, UserPlus, MessageCircle, Trophy, Users, Phone,
  Mail, Share2, Dumbbell, GraduationCap, MapPinned, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile: authProfile } = useAuthStore();
  const [org, setOrg] = useState<Record<string, unknown> | null>(null);
  const [listings, setListings] = useState<Record<string, unknown>[]>([]);
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isOwnProfileServer, setIsOwnProfileServer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => { fetchProfile(); }, [id]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await profileAPI.getOrganizationProfile(id);
      const data = res.data.data;
      const orgData = data?.profile || data;
      setOrg(orgData);
      setListings(data?.listings || []);
      setJobs(data?.jobs || []);
      setIsOwnProfileServer(data?.isOwnProfile === true);
      if (data?.connectionStatus) {
        setConnectionStatus(data.connectionStatus);
        setConnectionId(data.connectionId);
      }
    } catch { toast.error('Organization not found'); router.push('/search?type=organization'); }
    setIsLoading(false);
  };

  const handleConnect = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setIsConnecting(true);
    try {
      const targetUserId = (org?.userId as any)?._id || org?.userId;
      await connectionAPI.sendRequest(targetUserId as string);
      setConnectionStatus('pending');
      toast.success('Connection request sent!');
    } catch { toast.error('Failed to send request'); }
    setIsConnecting(false);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand" />
    </div>
  );
  if (!org) return null;

  const orgUserId = ((org.userId as Record<string, unknown>)?._id as string || org.userId as string)?.toString();
  // Combine backend flag + client-side fallback (covers demo/dev sessions where JWT isn't real)
  const isOwnProfile = isOwnProfileServer
    || (!!authProfile && (
      (authProfile as any)._id?.toString() === (org._id as string)?.toString()
      || (authProfile as any).profileUrl === org.profileUrl
      || user?.id === orgUserId
    ));
  const contact = (org.contact as Record<string, string>) || {};
  const showPhone = org.showPhone !== false;
  const showAddress = org.showAddress === true;
  const displayPhone = (org.alternatePhone as string) || contact.phone;
  const achievements = (org.achievements as { title: string; year?: number; description?: string }[]) || [];
  const coachingStaff = (org.coachingStaff as Record<string, unknown>[]) || [];
  const sports = (org.sports as string[]) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Banner */}
      <div className="relative w-full h-48 sm:h-64 bg-gradient-to-r from-brand to-blue-800 overflow-hidden">
        {org.banner && (
          <img src={getPhotoUrl(org.banner as string) || ''} alt="" className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Back button */}
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-4 mb-0">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {/* Verification pending banner for org owner */}
        {isOwnProfile && !org.isVerified && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Verification Pending</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Your organization profile is under admin review. It will be visible publicly only after verification.
                This usually takes 1-2 business days.
              </p>
            </div>
          </div>
        )}

        {/* Profile header card — overlaps banner */}
        <div className="card p-6 -mt-16 relative z-10 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl bg-brand text-white flex items-center justify-center text-3xl font-bold flex-shrink-0 overflow-hidden border-4 border-white shadow-md">
              {getPhotoUrl(org.logo as string)
                ? <img src={getPhotoUrl(org.logo as string)!} alt="" className="w-full h-full object-cover" />
                : getInitials(org.name as string || 'O')}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{org.name as string}</h1>
                {org.isVerified && (
                  <span className="flex items-center gap-1 badge bg-blue-100 text-blue-700">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-gray-500 capitalize mb-3">{(org.type as string)?.replace(/_/g, ' ')}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {org.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-brand" /> {org.city as string}
                  </span>
                )}
                {contact.website && (
                  <a href={contact.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-brand hover:underline">
                    <Globe className="w-4 h-4" /> Website
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-brand">
                    <Mail className="w-4 h-4 text-brand" /> {contact.email}
                  </a>
                )}
                {showPhone && displayPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4 text-brand" /> {displayPhone}
                  </span>
                )}
              </div>

              {/* Stats row */}
              <div className="flex gap-6 mt-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-lg">{(org.connectionCount as number) || 0}</p>
                  <p className="text-gray-500 text-xs">Connections</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-lg">{(org.followerCount as number) || 0}</p>
                  <p className="text-gray-500 text-xs">Followers</p>
                </div>
                {achievements.length > 0 && (
                  <div className="text-center">
                    <p className="font-bold text-gray-900 text-lg">{achievements.length}</p>
                    <p className="text-gray-500 text-xs">Achievements</p>
                  </div>
                )}
                {listings.length > 0 && (
                  <div className="text-center">
                    <p className="font-bold text-gray-900 text-lg">{listings.length}</p>
                    <p className="text-gray-500 text-xs">Active Listings</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 min-w-[160px] w-full sm:w-auto">
              {isOwnProfile ? (
                <Link href="/profile/edit" className="btn-primary flex items-center justify-center gap-2 py-2 px-4">
                  <Edit className="w-4 h-4" /> Edit Page
                </Link>
              ) : (
                <>
                  {connectionStatus === 'received_pending' ? (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await connectionAPI.respondToRequest(connectionId!, 'accept');
                            setConnectionStatus('accepted');
                            toast.success(`Connected with ${org.name}!`);
                          } catch { toast.error('Failed to accept'); }
                        }}
                        className="btn-primary py-2 text-sm"
                      >Accept</button>
                      <button
                        onClick={async () => {
                          try {
                            await connectionAPI.respondToRequest(connectionId!, 'reject');
                            setConnectionStatus(null);
                          } catch { toast.error('Failed to reject'); }
                        }}
                        className="btn-secondary py-2 text-sm"
                      >Reject</button>
                    </div>
                  ) : connectionStatus === 'accepted' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!window.confirm('Are you sure you want to disconnect?')) return;
                          setIsConnecting(true);
                          try {
                            await connectionAPI.withdrawConnection(connectionId!);
                            setConnectionStatus(null);
                            toast.success(`Disconnected from ${org.name}`);
                          } catch { toast.error('Failed to disconnect'); }
                          setIsConnecting(false);
                        }}
                        disabled={isConnecting}
                        className="btn-secondary flex-1 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        {isConnecting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Disconnect'}
                      </button>
                      <Link href={`/messages?userId=${orgUserId}`} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white flex items-center">
                        <MessageCircle className="w-5 h-5 text-gray-600" />
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting || !!connectionStatus}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                        connectionStatus === 'pending' ? 'bg-gray-100 text-gray-500 italic' : 'btn-primary'
                      }`}
                    >
                      {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> :
                        connectionStatus === 'pending' ? 'Request Sent' :
                        <><UserPlus className="w-4 h-4" /> Connect</>}
                    </button>
                  )}
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Profile link copied!'); }}
                    className="btn-secondary flex items-center justify-center gap-2 py-2 text-sm"
                  >
                    <Share2 className="w-4 h-4" /> Share Page
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left sidebar */}
          <div className="space-y-4">

            {/* About */}
            {org.description && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand" /> About
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{org.description as string}</p>
              </div>
            )}

            {/* Sports */}
            {sports.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-brand" /> Sports Offered
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sports.map((s) => (
                    <span key={s} className="badge bg-blue-50 text-blue-700">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Facilities */}
            {org.facilities && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPinned className="w-4 h-4 text-brand" /> Facilities
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{org.facilities as string}</p>
              </div>
            )}

            {/* Contact */}
            {(contact.email || (showPhone && displayPhone) || (showAddress && org.address) || org.contactPerson) && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand" /> Contact
                </h3>
                <div className="space-y-2 text-sm">
                  {org.contactPerson && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{org.contactPerson as string}</span>
                    </div>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-brand hover:underline">
                      <Mail className="w-4 h-4 flex-shrink-0" /> {contact.email}
                    </a>
                  )}
                  {showPhone && displayPhone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" /> {displayPhone}
                    </div>
                  )}
                  {showAddress && org.address && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span>{org.address as string}{org.city ? `, ${org.city as string}` : ''}{org.state ? `, ${org.state as string}` : ''}{org.pincode ? ` - ${org.pincode as string}` : ''}</span>
                    </div>
                  )}
                  {!showAddress && (org.city || org.state) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{[org.city, org.state].filter(Boolean).join(', ') as string}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Achievements */}
            {achievements.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-brand" /> Achievements
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {achievements.map((a, i) => (
                    <div key={i} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{a.title}</p>
                        {a.year && (
                          <span className="flex-shrink-0 text-xs font-bold text-brand bg-white border border-blue-200 rounded-full px-2 py-0.5">
                            {a.year}
                          </span>
                        )}
                      </div>
                      {a.description && (
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{a.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coaching Staff */}
            {coachingStaff.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                  <GraduationCap className="w-5 h-5 text-brand" /> Coaching Staff
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {coachingStaff.map((coach) => (
                    <Link
                      key={coach._id as string}
                      href={`/coach/${coach._id}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-100 border border-transparent transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                        {coach.photo
                          ? <img src={getPhotoUrl(coach.photo as string) || ''} alt="" className="w-full h-full object-cover" />
                          : getInitials(coach.fullName as string || 'C')}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{coach.fullName as string}</p>
                        {(coach.sportsSpecialization as string[])?.length > 0 && (
                          <p className="text-xs text-gray-500 truncate">
                            {(coach.sportsSpecialization as string[]).join(', ')}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Active Listings */}
            {listings.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-brand" /> Active Listings
                  </h2>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{listings.length} open</span>
                </div>
                <div className="space-y-3">
                  {listings.map((l) => {
                    const type = getListingTypeBadge(l.type as string);
                    const loc = l.location as Record<string, unknown>;
                    return (
                      <Link
                        key={l._id as string}
                        href={`/listings/${l._id}`}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`badge ${type.color} text-xs`}>{type.label}</span>
                            {l.sport && <span className="badge bg-gray-100 text-gray-600 text-xs">{l.sport as string}</span>}
                          </div>
                          <p className="font-semibold text-sm text-gray-900">{l.title as string}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                            {l.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {formatDate(l.startDate as string)}
                              </span>
                            )}
                            {loc?.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {loc.city as string}
                              </span>
                            )}
                            {l.applicationDeadline && (
                              <span className="text-orange-500 font-medium">
                                Deadline: {formatDate(l.applicationDeadline as string)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180 flex-shrink-0 mt-1" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Open Jobs */}
            {jobs.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-lg">
                    <Briefcase className="w-5 h-5 text-brand" /> Open Positions
                  </h2>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{jobs.length} open</span>
                </div>
                <div className="space-y-3">
                  {jobs.map((j) => {
                    const salary = j.salaryRange as Record<string, number> | undefined;
                    const loc = j.location as Record<string, unknown> | undefined;
                    return (
                      <Link
                        key={j._id as string}
                        href={`/jobs/${j._id}`}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{j.title as string}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                            {j.category && <span className="badge bg-purple-100 text-purple-700">{j.category as string}</span>}
                            {j.jobType && (
                              <span className="capitalize">{(j.jobType as string).replace(/_/g, ' ')}</span>
                            )}
                            {loc?.isRemote ? (
                              <span>Remote</span>
                            ) : loc?.city ? (
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{loc.city as string}</span>
                            ) : null}
                            {salary && (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(salary.min)} – {formatCurrency(salary.max)}/mo
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180 flex-shrink-0 mt-1" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {listings.length === 0 && jobs.length === 0 && achievements.length === 0 && coachingStaff.length === 0 && (
              <div className="card p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No activity yet</p>
                <p className="text-sm text-gray-400 mt-1">This organization hasn't posted any listings or jobs yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
