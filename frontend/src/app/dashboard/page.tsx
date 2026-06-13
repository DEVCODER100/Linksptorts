'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import PlayerCard from '@/components/shared/PlayerCard';
import { listingAPI, jobAPI, connectionAPI, notificationAPI, profileAPI } from '@/lib/api';
import {
  formatDate, getListingTypeBadge, getPhotoUrl, getInitials, getStatusBadge, formatCurrency,
} from '@/lib/utils';
import {
  Users, Trophy, Briefcase, Bell, ChevronRight,
  MapPin, Calendar, Clock, Building2,
  ArrowRight, CheckCircle2, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type ConnState = 'none' | 'pending' | 'connected';

// ── Reusable person card ───────────────────────────────────────────
function PersonCard({
  id,
  userId,
  photo,
  name,
  subtitle,
  location,
  connections,
  profileHref,
  connState,
  onConnect,
  isOwn,
}: {
  id: string;
  userId: string;
  photo?: string;
  name: string;
  subtitle?: string;
  location?: string;
  connections?: number;
  profileHref: string;
  connState: ConnState;
  onConnect: (userId: string, id: string) => void;
  isOwn: boolean;
}) {
  const photoUrl = getPhotoUrl(photo || null);
  return (
    <div className="flex-shrink-0 w-44 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col items-center text-center">
      <Link href={profileHref}>
        <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xl font-bold overflow-hidden mb-3 ring-2 ring-white shadow">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">{getInitials(name)}</span>
          )}
        </div>
      </Link>
      <Link href={profileHref} className="hover:text-brand transition-colors">
        <p className="font-semibold text-sm text-gray-900 line-clamp-1">{name}</p>
      </Link>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{subtitle}</p>}
      {location && (
        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-0.5 justify-center">
          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </p>
      )}
      {(connections ?? 0) > 0 && (
        <p className="text-[11px] text-gray-400 mt-1">
          <span className="font-semibold text-gray-600">{connections}</span> connections
        </p>
      )}
      {!isOwn && (
        <button
          disabled={connState !== 'none'}
          onClick={() => onConnect(userId, id)}
          className={cn(
            'mt-3 w-full text-xs font-semibold py-1.5 rounded-lg transition-all',
            connState === 'none' && 'bg-brand text-white hover:bg-brand-dark',
            connState === 'pending' && 'bg-orange-100 text-orange-600 cursor-default',
            connState === 'connected' && 'bg-green-100 text-green-700 cursor-default',
          )}
        >
          {connState === 'none' && 'Connect'}
          {connState === 'pending' && 'Pending'}
          {connState === 'connected' && '✓ Connected'}
        </button>
      )}
    </div>
  );
}

// ── Discovery section — cards wrap onto multiple rows (no hidden horizontal scroll) ──
function Section({ title, icon: Icon, href, children }: {
  title: string;
  icon: React.ElementType;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-brand" />
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
        <Link href={href} className="text-xs text-brand hover:underline flex items-center gap-1">
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-5 py-4">
        {children}
      </div>
    </div>
  );
}

// ── Skeleton cards ─────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 p-2.5 animate-pulse">
      <div className="w-full aspect-[4/3] rounded-xl bg-gray-200" />
      <div className="h-3 bg-gray-200 rounded w-24 mt-3 mb-1.5" />
      <div className="h-2.5 bg-gray-200 rounded w-16" />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, profile } = useAuthStore();
  const router = useRouter();

  // Redirect admin users straight to the admin panel
  useEffect(() => {
    if (user?.role === 'admin') router.replace('/admin');
  }, [user?.role]);
  if (user?.role === 'admin') return null;

  const [topAthletes, setTopAthletes] = useState<Record<string, unknown>[]>([]);
  const [topCoaches, setTopCoaches] = useState<Record<string, unknown>[]>([]);
  const [topOrgs, setTopOrgs] = useState<Record<string, unknown>[]>([]);
  const [upcomingListings, setUpcomingListings] = useState<Record<string, unknown>[]>([]);
  const [latestJobs, setLatestJobs] = useState<Record<string, unknown>[]>([]);
  const [myApplications, setMyApplications] = useState<unknown[]>([]);
  const [myJobApplications, setMyJobApplications] = useState<unknown[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Record<string, unknown>[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [connStates, setConnStates] = useState<Record<string, ConnState>>({});
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [coreLoading, setCoreLoading] = useState(true);
  const [checklistDismissed, setChecklistDismissed] = useState(true);

  const profileData = profile as Record<string, unknown> | null;
  const completion = (profileData?.profileCompletion as number) || 0;
  const myUserId = user?.id || '';

  // "Getting started" checklist — only for non-org users who haven't finished setup or dismissed it.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem('ls_checklist_done') === '1';
    setChecklistDismissed(dismissed);
  }, []);
  const hasPhoto = !!(profileData?.photo);
  const connectionCount = (profileData?.connectionCount as number) || 0;
  const checklistSteps = [
    { label: 'Complete your profile', done: completion >= 80, href: '/profile/edit' },
    { label: 'Add a profile photo', done: hasPhoto, href: '/profile/edit' },
    { label: 'Make your first connection', done: connectionCount > 0, href: '/search' },
  ];
  const allChecklistDone = checklistSteps.every((s) => s.done);
  const showChecklist = user?.role !== 'organization' && !checklistDismissed && !allChecklistDone;
  const dismissChecklist = () => { localStorage.setItem('ls_checklist_done', '1'); setChecklistDismissed(true); };

  useEffect(() => { fetchCoreData(); fetchDiscovery(); }, []);

  // ── Core data (fast) ──
  const fetchCoreData = async () => {
    try {
      const promises: Promise<unknown>[] = [
        connectionAPI.getPendingRequests().catch(() => ({ data: { data: [] } })),
        notificationAPI.getNotifications({ limit: 1 }).catch(() => ({ data: { data: { unreadCount: 0 } } })),
        listingAPI.getListings({ limit: 4 }).catch(() => ({ data: { data: [] } })),
        jobAPI.getJobs({ limit: 4 }).catch(() => ({ data: { data: [] } })),
      ];
      if (user?.role !== 'organization') {
        promises.push(listingAPI.getMyApplications().catch(() => ({ data: { data: [] } })));
        promises.push(jobAPI.getMyJobApplications().catch(() => ({ data: { data: [] } })));
      }
      const [pendingRes, notifRes, listingsRes, jobsRes, ...appResults] = await Promise.all(promises) as any[];
      setPendingRequests(pendingRes?.data?.data || []);
      setUnreadNotifications(notifRes?.data?.data?.unreadCount || 0);
      setUpcomingListings(listingsRes?.data?.data || []);
      setLatestJobs(jobsRes?.data?.data || []);
      if (appResults[0]) setMyApplications(appResults[0]?.data?.data || []);
      if (appResults[1]) setMyJobApplications(appResults[1]?.data?.data || []);
    } catch {}
    setCoreLoading(false);
  };

  // ── Discovery data (slower — sorted by popularity) ──
  const fetchDiscovery = async () => {
    try {
      const [athleteRes, coachRes, orgRes] = await Promise.all([
        profileAPI.searchProfiles({ type: 'athlete', sort: 'popular', limit: 10 }).catch(() => ({ data: { data: [] } })),
        profileAPI.searchProfiles({ type: 'coach', sort: 'popular', limit: 10 }).catch(() => ({ data: { data: [] } })),
        profileAPI.searchProfiles({ type: 'organization', sort: 'popular', limit: 8 }).catch(() => ({ data: { data: [] } })),
      ]);
      const athletes = (athleteRes?.data?.data || []).filter((p: any) => p.userId?.toString() !== myUserId);
      const coaches = (coachRes?.data?.data || []).filter((p: any) => p.userId?.toString() !== myUserId);
      const orgs = orgRes?.data?.data || [];
      setTopAthletes(athletes);
      setTopCoaches(coaches);
      setTopOrgs(orgs);

      // Pre-load connection statuses so already-connected people don't show "Connect"
      const all = [...athletes, ...coaches, ...orgs];
      const userIds = all.map((p: any) => (p.userId?._id || p.userId)).filter(Boolean);
      if (userIds.length) {
        try {
          const statusRes = await connectionAPI.getConnectionStatuses(userIds);
          const map = statusRes.data.data || {};
          const states: Record<string, ConnState> = {};
          for (const p of all) {
            const uid = (p as any).userId?._id || (p as any).userId;
            const s = map[uid];
            if (s === 'accepted') states[(p as any)._id] = 'connected';
            else if (s === 'pending' || s === 'incoming') states[(p as any)._id] = 'pending';
          }
          setConnStates((prev) => ({ ...prev, ...states }));
        } catch {}
      }
    } catch {}
    setSectionsLoading(false);
  };

  const handleConnect = async (targetUserId: string, profileId: string) => {
    setConnStates((prev) => ({ ...prev, [profileId]: 'pending' }));
    try {
      await connectionAPI.sendRequest(targetUserId);
      toast.success('Connection request sent!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to send request';
      // If already connected/pending, reflect the real state instead of resetting to "Connect"
      if (/already connected/i.test(msg)) setConnStates((prev) => ({ ...prev, [profileId]: 'connected' }));
      else if (/already sent/i.test(msg)) setConnStates((prev) => ({ ...prev, [profileId]: 'pending' }));
      else setConnStates((prev) => ({ ...prev, [profileId]: 'none' }));
      toast.error(msg);
    }
  };

  const getConnState = (profileId: string): ConnState => connStates[profileId] ?? 'none';

  const displayName = (profileData?.fullName as string) || (profileData?.name as string) || user?.email?.split('@')[0] || 'there';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-5">

              {/* ── Welcome banner ── */}
              <div className="bg-gradient-to-r from-brand to-blue-500 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 w-48 h-full opacity-10">
                  <Trophy className="w-full h-full" />
                </div>
                <p className="text-blue-100 text-sm font-medium mb-1">{greeting},</p>
                <h1 className="text-2xl font-bold mb-3">{displayName}! 👋</h1>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                    <Bell className="w-3.5 h-3.5" /> {unreadNotifications} notifications
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                    <Trophy className="w-3.5 h-3.5" /> {myApplications.length + myJobApplications.length} applications
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                    <Users className="w-3.5 h-3.5" /> {pendingRequests.length} pending requests
                  </span>
                </div>
              </div>

              {/* ── Getting started checklist (new users) ── */}
              {showChecklist && (
                <div className="card p-5 border-l-4 border-l-brand">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">Getting started</h3>
                      <p className="text-xs text-gray-500 mt-0.5">A few quick steps to get discovered.</p>
                    </div>
                    <button onClick={dismissChecklist} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
                  </div>
                  <div className="space-y-2">
                    {checklistSteps.map((step) => (
                      <Link
                        key={step.label}
                        href={step.href}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                          step.done ? 'border-green-100 bg-green-50/50' : 'border-gray-200 hover:border-brand/40 hover:bg-blue-50/30',
                        )}
                      >
                        <span className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                          step.done ? 'bg-green-500 text-white' : 'border-2 border-gray-300',
                        )}>
                          {step.done && <CheckCircle2 className="w-4 h-4" />}
                        </span>
                        <span className={cn('text-sm font-medium flex-1', step.done ? 'text-gray-400 line-through' : 'text-gray-800')}>
                          {step.label}
                        </span>
                        {!step.done && <ArrowRight className="w-4 h-4 text-gray-300" />}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Pending connection requests (inline) ── */}
              {pendingRequests.length > 0 && (
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand" />
                      Connection Requests
                      <span className="w-5 h-5 bg-brand text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                        {pendingRequests.length}
                      </span>
                    </h3>
                    <Link href="/connections?tab=requests" className="text-xs text-brand hover:underline">
                      Manage all →
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {pendingRequests.slice(0, 6).map((req) => {
                      const rp = (req as any).requesterProfile;
                      const name = rp?.fullName || rp?.name || (req.requesterId as any)?.email || 'Someone';
                      return (
                        <div key={req._id as string} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2">
                          <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                            {getPhotoUrl(rp?.photo) ? (
                              <img src={getPhotoUrl(rp.photo)!} alt={name} className="w-full h-full object-cover" />
                            ) : getInitials(name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{name}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{rp?.primarySport || rp?.sportsSpecialization?.[0] || 'Sports'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Profile quick actions (always visible) ── */}
              <div className="card p-4 flex items-center gap-4 border-l-4 border-l-brand">
                <div className="flex-1">
                  {user?.role !== 'organization' && completion < 100 ? (
                    <>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-semibold text-sm text-gray-900">Complete your profile</p>
                        <span className="text-xs font-bold text-brand">{completion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-brand h-1.5 rounded-full transition-all" style={{ width: `${completion}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Complete profile gets 3× more views from scouts.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-sm text-gray-900">Your Profile</p>
                      <p className="text-xs text-gray-500 mt-0.5">View how others see you, or update your details anytime.</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={user?.role === 'organization' ? `/org/${(profileData?.profileUrl as string) || ''}` : '/profile'}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    View Profile
                  </Link>
                  <Link href="/profile/edit" className="btn-primary text-sm px-4 py-2">
                    {user?.role !== 'organization' && completion < 100 ? 'Complete' : 'Edit Profile'}
                  </Link>
                </div>
              </div>

              {/* ── Featured Athletes (premium showcase) ── */}
              <Section title="Featured Athletes" icon={Star} href="/search?type=athlete">
                  {sectionsLoading
                    ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
                    : topAthletes.length === 0
                      ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-8 px-4 text-center">
                          <Star className="w-8 h-8 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500 mb-3">No athletes to feature yet.</p>
                          <Link href="/search?type=athlete" className="text-xs text-brand hover:underline font-medium">Browse Athletes →</Link>
                        </div>
                      )
                      : topAthletes.slice(0, 4).map((p) => {
                          const uid = ((p.userId as Record<string, string>)?._id || (p.userId as string) || (p._id as string))?.toString();
                          return (
                            <PlayerCard
                              key={p._id as string}
                              profile={p}
                              href={`/athlete/${(p.profileUrl as string) || (p._id as string)}`}
                              userId={uid}
                              isOwn={uid === myUserId}
                              connState={getConnState(p._id as string)}
                              onConnect={(u) => handleConnect(u, p._id as string)}
                            />
                          );
                        })}
              </Section>

              {/* ── Top Coaches ── */}
              <Section title="Featured Coaches" icon={Star} href="/search?type=coach">
                {sectionsLoading
                  ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
                  : topCoaches.length === 0
                    ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-8 px-4 text-center">
                        <Star className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500 mb-3">No coaches found yet.</p>
                        <Link href="/search?type=coach" className="text-xs text-brand hover:underline font-medium">Browse Coaches →</Link>
                      </div>
                    )
                    : topCoaches.slice(0, 4).map((p) => {
                        const uid = ((p.userId as Record<string, string>)?._id || (p.userId as string) || (p._id as string))?.toString();
                        return (
                          <PlayerCard
                            key={p._id as string}
                            profile={p}
                            href={`/coach/${(p.profileUrl as string) || (p._id as string)}`}
                            kind="coach"
                            userId={uid}
                            isOwn={uid === myUserId}
                            connState={getConnState(p._id as string)}
                            onConnect={(u) => handleConnect(u, p._id as string)}
                          />
                        );
                      })}
              </Section>

              {/* ── Top Organizations ── */}
              <Section title="Top Organizations" icon={Building2} href="/search?type=organization">
                {sectionsLoading
                  ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
                  : topOrgs.length === 0
                    ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-8 px-4 text-center">
                        <Building2 className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500 mb-3">No organisations found yet.</p>
                        <Link href="/search?type=organization" className="text-xs text-brand hover:underline font-medium">Browse Organisations →</Link>
                      </div>
                    )
                    : topOrgs.slice(0, 8).map((org) => {
                        const photoUrl = getPhotoUrl((org.logo as string) || null);
                        const loc = (org.contact as Record<string, string>) || {};
                        return (
                          <div key={org._id as string} className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col items-center text-center">
                            <Link href={`/org/${(org.profileUrl as string) || (org._id as string)}`}>
                              <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center overflow-hidden mb-3 ring-2 ring-white shadow">
                                {photoUrl
                                  ? <img src={photoUrl} alt={org.name as string} className="w-full h-full object-cover" />
                                  : <Building2 className="w-7 h-7 text-orange-500" />}
                              </div>
                            </Link>
                            <Link href={`/org/${(org.profileUrl as string) || (org._id as string)}`} className="hover:text-brand">
                              <p className="font-semibold text-sm text-gray-900 line-clamp-2">{org.name as string}</p>
                            </Link>
                            <p className="text-xs text-gray-500 mt-0.5 capitalize">{(org.type as string)?.replace('_', ' ')}</p>
                            {loc?.city && (
                              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-0.5 justify-center">
                                <MapPin className="w-2.5 h-2.5" />{loc.city}
                              </p>
                            )}
                            {!!(org.isVerified) && (
                              <span className="mt-2 flex items-center gap-1 text-[11px] text-green-600 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                              </span>
                            )}
                          </div>
                        );
                      })}
              </Section>

              {/* ── Upcoming Trials & Events ── */}
              <div className="card">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-brand" />
                    <h2 className="font-semibold text-gray-900">Upcoming Trials & Events</h2>
                  </div>
                  <Link href="/listings" className="text-xs text-brand hover:underline flex items-center gap-1">
                    See all <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {coreLoading ? (
                  <div className="p-5 grid sm:grid-cols-2 gap-3">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-20" />
                    ))}
                  </div>
                ) : upcomingListings.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">No upcoming listings.</div>
                ) : (
                  <div className="p-4 grid sm:grid-cols-2 gap-3">
                    {(upcomingListings as Record<string, unknown>[]).slice(0, 4).map((listing) => {
                      const type = getListingTypeBadge(listing.type as string);
                      const org = listing.organizationId as Record<string, unknown>;
                      const loc = listing.location as Record<string, string>;
                      return (
                        <Link
                          key={listing._id as string}
                          href={`/listings/${listing._id}`}
                          className="group flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand/30 hover:bg-blue-50/30 transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`badge text-[10px] py-0.5 ${type.color}`}>{type.label}</span>
                            </div>
                            <p className="font-medium text-sm text-gray-900 line-clamp-1 group-hover:text-brand">{listing.title as string}</p>
                            <p className="text-xs text-gray-500 truncate">{org?.name as string}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              {loc?.city && <span className="text-[11px] text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{loc.city}</span>}
                              <span className="text-[11px] text-gray-400 flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{formatDate(listing.startDate as string)}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand flex-shrink-0 mt-2 transition-colors" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Latest Jobs ── */}
              <div className="card">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-brand" />
                    <h2 className="font-semibold text-gray-900">Latest Jobs</h2>
                  </div>
                  <Link href="/listings?tab=jobs" className="text-xs text-brand hover:underline flex items-center gap-1">
                    See all <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {coreLoading ? (
                  <div className="divide-y divide-gray-50">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="p-4 flex gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
                        <div className="flex-1"><div className="h-3.5 bg-gray-100 rounded w-3/4 mb-2" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
                      </div>
                    ))}
                  </div>
                ) : latestJobs.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">No jobs posted yet.</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {(latestJobs as Record<string, unknown>[]).slice(0, 4).map((job) => {
                      const org = job.organizationId as Record<string, unknown>;
                      return (
                        <Link
                          key={job._id as string}
                          href={`/jobs/${job._id}`}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-brand" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 group-hover:text-brand truncate">{job.title as string}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-500 truncate">{org?.name as string}</span>
                              <span className="text-xs text-gray-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{job.location as string}</span>
                              {!!(job.applicationDeadline) && (
                                <span className="text-xs text-gray-400 flex items-center gap-0.5 hidden sm:flex"><Clock className="w-3 h-3" />Due {formatDate(job.applicationDeadline as string)}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0 capitalize hidden sm:block">
                            {(job.jobType as string)?.replace('_', '-')}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── My Recent Applications ── */}
              {user?.role !== 'organization' && myApplications.length > 0 && (
                <div className="card">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-green-600" />
                      <h2 className="font-semibold text-gray-900">Recent Applications</h2>
                    </div>
                    <Link href="/profile/applications" className="text-xs text-brand hover:underline flex items-center gap-1">
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {(myApplications as Record<string, unknown>[]).slice(0, 4).map((app) => {
                      const listing = app.listingId as Record<string, unknown>;
                      const badge = getStatusBadge(app.status as string);
                      return (
                        <div key={app._id as string} className="flex items-center justify-between px-5 py-3">
                          <div>
                            <p className="font-medium text-sm text-gray-900">{listing?.title as string}</p>
                            <p className="text-xs text-gray-500 mt-0.5 capitalize">{listing?.type as string}</p>
                          </div>
                          <span className={`badge ${badge.color}`}>{badge.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
