'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { listingAPI, jobAPI, connectionAPI, notificationAPI, profileAPI } from '@/lib/api';
import {
  formatDate, getListingTypeBadge, getPhotoUrl, getInitials, getStatusBadge, formatCurrency,
} from '@/lib/utils';
import {
  Users, Trophy, Briefcase, Bell, TrendingUp, ChevronRight,
  MapPin, Calendar, Clock, ChevronLeft, Dumbbell, Building2,
  ArrowRight, CheckCircle2, Star, X,
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

// ── Horizontal scroll section ──────────────────────────────────────
function HScrollSection({ title, icon: Icon, href, onDismiss, children }: {
  title: string;
  icon: React.ElementType;
  href: string;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'l' | 'r') => {
    if (ref.current) ref.current.scrollBy({ left: dir === 'r' ? 220 : -220, behavior: 'smooth' });
  };
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-brand" />
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll('l')} className="p-1 rounded-full hover:bg-gray-100 text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => scroll('r')} className="p-1 rounded-full hover:bg-gray-100 text-gray-400"><ChevronRight className="w-4 h-4" /></button>
          <Link href={href} className="text-xs text-brand hover:underline mx-1">See all</Link>
          <button
            onClick={onDismiss}
            title="Hide this section"
            className="p-1 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto px-5 py-4 scrollbar-hide scroll-smooth">
        {children}
      </div>
    </div>
  );
}

// ── Skeleton cards ─────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="flex-shrink-0 w-44 bg-gray-50 rounded-2xl border border-gray-100 p-4 flex flex-col items-center animate-pulse">
      <div className="w-16 h-16 rounded-full bg-gray-200 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-24 mb-1.5" />
      <div className="h-2.5 bg-gray-200 rounded w-16 mb-1" />
      <div className="h-2.5 bg-gray-200 rounded w-20 mt-3" />
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
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [coreLoading, setCoreLoading] = useState(true);

  const profileData = profile as Record<string, unknown> | null;
  const completion = (profileData?.profileCompletion as number) || 0;
  const myUserId = user?.id || '';

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
      setTopAthletes((athleteRes?.data?.data || []).filter((p: any) => p.userId?.toString() !== myUserId));
      setTopCoaches((coachRes?.data?.data || []).filter((p: any) => p.userId?.toString() !== myUserId));
      setTopOrgs(orgRes?.data?.data || []);
    } catch {}
    setSectionsLoading(false);
  };

  const handleConnect = async (targetUserId: string, profileId: string) => {
    setConnStates((prev) => ({ ...prev, [profileId]: 'pending' }));
    try {
      await connectionAPI.sendRequest(targetUserId);
      toast.success('Connection request sent!');
    } catch {
      setConnStates((prev) => ({ ...prev, [profileId]: 'none' }));
      toast.error('Failed to send request');
    }
  };

  const getConnState = (profileId: string): ConnState => connStates[profileId] ?? 'none';
  const dismissSection = (key: string) => setHiddenSections((prev) => { const next = new Set(prev); next.add(key); return next; });
  const isHidden = (key: string) => hiddenSections.has(key);

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
                  <span className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                    <TrendingUp className="w-3.5 h-3.5" /> {(profileData?.followerCount as number) || 0} followers
                  </span>
                </div>
              </div>

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

              {/* ── Profile completion ── */}
              {user?.role !== 'organization' && completion < 100 && (
                <div className="card p-4 flex items-center gap-4 border-l-4 border-l-brand">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-semibold text-sm text-gray-900">Complete your profile</p>
                      <span className="text-xs font-bold text-brand">{completion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-brand h-1.5 rounded-full transition-all" style={{ width: `${completion}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Complete profile gets 3× more views from scouts.</p>
                  </div>
                  <Link href="/profile/edit" className="btn-primary text-sm px-4 py-2 flex-shrink-0">
                    Complete
                  </Link>
                </div>
              )}

              {/* ── Athletes to Connect ── */}
              {user?.role !== 'athlete' && !isHidden('athletes') && (
                <HScrollSection title="Athletes to Connect" icon={Dumbbell} href="/search?type=athlete" onDismiss={() => dismissSection('athletes')}>
                  {sectionsLoading
                    ? Array(5).fill(0).map((_, i) => <CardSkeleton key={i} />)
                    : topAthletes.length === 0
                      ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                          <Dumbbell className="w-8 h-8 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500 mb-3">No athletes found yet.</p>
                          <Link href="/search?type=athlete" className="text-xs text-brand hover:underline font-medium">Browse Athletes →</Link>
                        </div>
                      )
                      : topAthletes.map((p) => {
                          const loc = p.location as Record<string, string>;
                          return (
                            <PersonCard
                              key={p._id as string}
                              id={p._id as string}
                              userId={(p.userId as string) || (p._id as string)}
                              photo={p.photo as string}
                              name={p.fullName as string}
                              subtitle={[p.primarySport, p.position].filter(Boolean).join(' · ')}
                              location={[loc?.city, loc?.state].filter(Boolean).join(', ')}
                              connections={(p.connectionCount as number) || 0}
                              profileHref={`/athlete/${(p.profileUrl as string) || (p._id as string)}`}
                              connState={getConnState(p._id as string)}
                              onConnect={handleConnect}
                              isOwn={(p.userId as string)?.toString() === myUserId}
                            />
                          );
                        })}
                </HScrollSection>
              )}

              {/* ── Top Coaches ── */}
              {!isHidden('coaches') && <HScrollSection title="Featured Coaches" icon={Star} href="/search?type=coach" onDismiss={() => dismissSection('coaches')}>
                {sectionsLoading
                  ? Array(5).fill(0).map((_, i) => <CardSkeleton key={i} />)
                  : topCoaches.length === 0
                    ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <Star className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500 mb-3">No coaches found yet.</p>
                        <Link href="/search?type=coach" className="text-xs text-brand hover:underline font-medium">Browse Coaches →</Link>
                      </div>
                    )
                    : topCoaches.map((p) => {
                        const loc = p.location as Record<string, string>;
                        const specs = (p.sportsSpecialization as string[]) || [];
                        return (
                          <PersonCard
                            key={p._id as string}
                            id={p._id as string}
                            userId={(p.userId as string) || (p._id as string)}
                            photo={p.photo as string}
                            name={p.fullName as string}
                            subtitle={specs.slice(0, 2).join(' · ') || 'Coach'}
                            location={[loc?.city, loc?.state].filter(Boolean).join(', ')}
                            connections={(p.connectionCount as number) || 0}
                            profileHref={`/coach/${(p.profileUrl as string) || (p._id as string)}`}
                            connState={getConnState(p._id as string)}
                            onConnect={handleConnect}
                            isOwn={(p.userId as string)?.toString() === myUserId}
                          />
                        );
                      })}
              </HScrollSection>}

              {/* ── Top Organizations ── */}
              {!isHidden('orgs') && <HScrollSection title="Top Organizations" icon={Building2} href="/search?type=organization" onDismiss={() => dismissSection('orgs')}>
                {sectionsLoading
                  ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
                  : topOrgs.length === 0
                    ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <Building2 className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500 mb-3">No organisations found yet.</p>
                        <Link href="/search?type=organization" className="text-xs text-brand hover:underline font-medium">Browse Organisations →</Link>
                      </div>
                    )
                    : topOrgs.map((org) => {
                        const photoUrl = getPhotoUrl((org.logo as string) || null);
                        const loc = (org.contact as Record<string, string>) || {};
                        return (
                          <div key={org._id as string} className="flex-shrink-0 w-44 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col items-center text-center">
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
              </HScrollSection>}

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
