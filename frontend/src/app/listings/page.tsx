'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { listingAPI, jobAPI } from '@/lib/api';
import { formatDate, getListingTypeBadge, formatCurrency, SPORTS_LIST, INDIAN_STATES } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  Search, MapPin, Calendar, Users, X, ChevronRight,
  Trophy, SlidersHorizontal, Briefcase, Clock, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const JOB_CATEGORIES = ['coach', 'pe_teacher', 'fitness_trainer', 'sports_physio', 'nutritionist', 'manager', 'admin', 'other'];
const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship'];

function OpportunitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  // ── Active tab ──
  const [tab, setTab] = useState<'trials' | 'jobs'>(
    searchParams.get('tab') === 'jobs' ? 'jobs' : 'trials'
  );

  // ── Listings state ──
  const [listings, setListings] = useState<Record<string, unknown>[]>([]);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsFetchError, setListingsFetchError] = useState(false);
  const [showListingFilters, setShowListingFilters] = useState(false);
  const [listingFilters, setListingFilters] = useState({
    q: searchParams.get('q') || '',
    type: searchParams.get('type') || '',
    sport: searchParams.get('sport') || '',
    state: searchParams.get('state') || '',
    free: searchParams.get('free') || '',
  });

  // ── Jobs state ──
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsFetchError, setJobsFetchError] = useState(false);
  const [showJobFilters, setShowJobFilters] = useState(false);
  const [jobFilters, setJobFilters] = useState({ q: '', category: '', jobType: '', location: '' });
  const [myJobApplications, setMyJobApplications] = useState<string[]>([]);

  // ── Fetch listings ──
  useEffect(() => { fetchListings(); }, [listingFilters, listingsPage]);

  const fetchListings = async () => {
    setListingsLoading(true);
    setListingsFetchError(false);
    try {
      const params = { ...listingFilters, page: listingsPage, limit: 12, status: 'published' };
      Object.keys(params).forEach((k) => { if (!(params as Record<string, unknown>)[k]) delete (params as Record<string, unknown>)[k]; });
      const res = await listingAPI.getListings(params);
      setListings(res.data.data || []);
      setListingsTotal(res.data.pagination?.total || 0);
    } catch {
      setListingsFetchError(true);
      toast.error('Failed to load listings. Please try again.');
    }
    setListingsLoading(false);
  };

  // ── Fetch jobs ──
  useEffect(() => { fetchJobs(); }, [jobFilters, jobsPage]);
  useEffect(() => { if (isAuthenticated) fetchMyJobApplications(); }, [isAuthenticated]);

  const fetchJobs = async () => {
    setJobsLoading(true);
    setJobsFetchError(false);
    try {
      const params = { ...jobFilters, page: jobsPage, limit: 12 };
      Object.keys(params).forEach((k) => { if (!(params as Record<string, unknown>)[k]) delete (params as Record<string, unknown>)[k]; });
      const res = await jobAPI.getJobs(params);
      setJobs(res.data.data || []);
      setJobsTotal(res.data.pagination?.total || 0);
    } catch {
      setJobsFetchError(true);
      toast.error('Failed to load jobs. Please try again.');
    }
    setJobsLoading(false);
  };

  const fetchMyJobApplications = async () => {
    try {
      const res = await jobAPI.getMyJobApplications();
      const apps = res.data.data || [];
      setMyJobApplications(apps.map((a: Record<string, unknown>) =>
        (a.jobId as Record<string, unknown>)?._id as string || a.jobId as string
      ));
    } catch {}
  };

  // ── Helpers ──
  const updateListingFilter = (key: string, value: string) => {
    setListingFilters((prev) => ({ ...prev, [key]: value }));
    setListingsPage(1);
  };
  const clearListingFilters = () => {
    setListingFilters({ q: '', type: '', sport: '', state: '', free: '' });
    setListingsPage(1);
  };
  const hasListingFilters = Object.values(listingFilters).some(Boolean);

  const updateJobFilter = (key: string, value: string) => {
    setJobFilters((f) => ({ ...f, [key]: value }));
    setJobsPage(1);
  };
  const clearJobFilters = () => { setJobFilters({ q: '', category: '', jobType: '', location: '' }); setJobsPage(1); };
  const hasJobFilters = Object.values(jobFilters).some(Boolean);

  const handleApplyJob = async (jobId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    try {
      await jobAPI.applyToJob(jobId);
      toast.success('Application submitted!');
      setMyJobApplications((prev) => [...prev, jobId]);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to apply';
      toast.error(msg);
    }
  };

  const switchTab = (t: 'trials' | 'jobs') => {
    setTab(t);
    router.replace(t === 'jobs' ? '/listings?tab=jobs' : '/listings', { scroll: false });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-500">Trials, events, tournaments and sports jobs across India</p>
        </div>

        {/* ── TABS ── */}
        <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
          <button
            onClick={() => switchTab('trials')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === 'trials'
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <Trophy className="w-4 h-4" />
            Trials &amp; Events
            {listingsTotal > 0 && (
              <span className={cn(
                'text-[11px] font-bold px-1.5 py-0.5 rounded-full',
                tab === 'trials' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-600'
              )}>
                {listingsTotal}
              </span>
            )}
          </button>
          <button
            onClick={() => switchTab('jobs')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === 'jobs'
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <Briefcase className="w-4 h-4" />
            Jobs
            {jobsTotal > 0 && (
              <span className={cn(
                'text-[11px] font-bold px-1.5 py-0.5 rounded-full',
                tab === 'jobs' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-600'
              )}>
                {jobsTotal}
              </span>
            )}
          </button>
        </div>

        {/* ═══════════════ TRIALS & EVENTS TAB ═══════════════ */}
        {tab === 'trials' && (
          <>
            {/* Search + Filter bar */}
            <div className="card p-4 mb-6">
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search listings..."
                    value={listingFilters.q}
                    onChange={(e) => updateListingFilter('q', e.target.value)}
                    className="input-field pl-9"
                  />
                </div>
                <select value={listingFilters.type} onChange={(e) => updateListingFilter('type', e.target.value)} className="input-field w-auto min-w-32">
                  <option value="">All Types</option>
                  <option value="trial">Trial</option>
                  <option value="event">Event</option>
                  <option value="tournament">Tournament</option>
                  <option value="admission">Admission</option>
                </select>
                <button
                  onClick={() => setShowListingFilters(!showListingFilters)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                    showListingFilters ? 'border-brand bg-blue-50 text-brand' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {hasListingFilters && <span className="w-2 h-2 rounded-full bg-brand" />}
                </button>
                {hasListingFilters && (
                  <button onClick={clearListingFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
                    <X className="w-4 h-4" /> Clear
                  </button>
                )}
              </div>
              {showListingFilters && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <select value={listingFilters.sport} onChange={(e) => updateListingFilter('sport', e.target.value)} className="input-field">
                    <option value="">All Sports</option>
                    {SPORTS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={listingFilters.state} onChange={(e) => updateListingFilter('state', e.target.value)} className="input-field">
                    <option value="">All States</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={listingFilters.free} onChange={(e) => updateListingFilter('free', e.target.value)} className="input-field">
                    <option value="">All (Free + Paid)</option>
                    <option value="true">Free Only</option>
                  </select>
                </div>
              )}
            </div>

            {/* Listings grid */}
            {listingsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : listingsFetchError ? (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-red-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Could not load listings</h3>
                <p className="text-gray-500 mb-6">There was a problem connecting to the server.</p>
                <button onClick={fetchListings} className="btn-primary px-6 py-2.5">Retry</button>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No listings found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map((listing) => {
                  const type = getListingTypeBadge(listing.type as string);
                  const org = listing.organizationId as Record<string, unknown>;
                  const loc = listing.location as Record<string, string>;
                  const deadlinePassed = listing.registrationDeadline && new Date(listing.registrationDeadline as string) < new Date();
                  return (
                    <Link key={listing._id as string} href={`/listings/${listing._id}`} className="card hover:shadow-md transition-all group flex flex-col">
                      {!!(listing.banner) && (
                        <div className="h-36 bg-gray-100 overflow-hidden flex-shrink-0"
                          ref={(el) => { if (el) el.dataset.hasImg = 'true'; }}
                        >
                          <img
                            src={listing.banner as string}
                            alt={listing.title as string}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              const parent = (e.currentTarget as HTMLImageElement).parentElement;
                              if (parent) parent.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`badge ${type.color}`}>{type.label}</span>
                          {deadlinePassed ? (
                            <span className="badge bg-gray-100 text-gray-500">Closed</span>
                          ) : listing.participantFee ? (
                            <span className="badge bg-gray-100 text-gray-600">{formatCurrency(listing.participantFee as number)}</span>
                          ) : (
                            <span className="badge bg-green-100 text-green-700">Free</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-brand transition-colors line-clamp-2 min-h-[2.5rem]">{listing.title as string}</h3>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-1">{(org?.name as string) || 'Unknown Organisation'}</p>
                        <div className="space-y-1.5 flex-1">
                          {loc?.city && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              {loc.city}{loc.state ? `, ${loc.state}` : ''}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            {formatDate(listing.startDate as string)}
                          </div>
                          {!!(listing.participantLimit) && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Users className="w-3.5 h-3.5 flex-shrink-0" />
                              {listing.participantCount as number}/{listing.participantLimit as number} spots
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-400">
                            {(listing.sports as string[])?.slice(0, 2).join(', ')}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand transition-colors" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {listingsTotal > 12 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setListingsPage((p) => Math.max(1, p - 1))} disabled={listingsPage === 1} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">Previous</button>
                <span className="text-sm text-gray-500">Page {listingsPage} of {Math.ceil(listingsTotal / 12)}</span>
                <button onClick={() => setListingsPage((p) => p + 1)} disabled={listingsPage >= Math.ceil(listingsTotal / 12)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">Next</button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════ JOBS TAB ═══════════════ */}
        {tab === 'jobs' && (
          <>
            {/* Search + Filter bar */}
            <div className="card p-4 mb-6">
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search jobs..." value={jobFilters.q} onChange={(e) => updateJobFilter('q', e.target.value)} className="input-field pl-9" />
                </div>
                <select value={jobFilters.category} onChange={(e) => updateJobFilter('category', e.target.value)} className="input-field w-auto min-w-36">
                  <option value="">All Categories</option>
                  {JOB_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowJobFilters(!showJobFilters)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                    showJobFilters ? 'border-brand bg-blue-50 text-brand' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {hasJobFilters && <span className="w-2 h-2 rounded-full bg-brand" />}
                </button>
                {hasJobFilters && (
                  <button onClick={clearJobFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
                    <X className="w-4 h-4" /> Clear
                  </button>
                )}
              </div>
              {showJobFilters && (
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <select value={jobFilters.jobType} onChange={(e) => updateJobFilter('jobType', e.target.value)} className="input-field">
                    <option value="">All Job Types</option>
                    {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', '-').replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
                  </select>
                  <input type="text" placeholder="Location (city/state)" value={jobFilters.location} onChange={(e) => updateJobFilter('location', e.target.value)} className="input-field" />
                </div>
              )}
            </div>

            {/* Jobs list */}
            {jobsLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse flex gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobsFetchError ? (
              <div className="text-center py-16">
                <Briefcase className="w-12 h-12 text-red-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Could not load jobs</h3>
                <p className="text-gray-500 mb-6">There was a problem connecting to the server.</p>
                <button onClick={fetchJobs} className="btn-primary px-6 py-2.5">Retry</button>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No jobs found</h3>
                <p className="text-gray-500">Try different search terms or filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const org = job.organizationId as Record<string, unknown>;
                  const applied = myJobApplications.includes(job._id as string);
                  return (
                    <Link key={job._id as string} href={`/jobs/${job._id}`} className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow group">
                      <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors">{job.title as string}</h3>
                            <p className="text-sm text-gray-500">{org?.name as string}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {applied ? (
                              <span className="badge bg-green-100 text-green-700">Applied</span>
                            ) : user?.role !== 'organization' && (
                              <button onClick={(e) => handleApplyJob(job._id as string, e)} className="btn-primary text-sm px-4 py-1.5">
                                Apply
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3.5 h-3.5" />{job.location as string}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500"><Briefcase className="w-3.5 h-3.5" />{(job.jobType as string)?.replace('_', '-')}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3.5 h-3.5" />{job.category as string}</span>
                          {!!(job.salaryMin) && <span className="text-xs text-gray-500">{formatCurrency(job.salaryMin as number)} – {formatCurrency(job.salaryMax as number)}/mo</span>}
                          {!!(job.applicationDeadline) && <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3.5 h-3.5" />Due {formatDate(job.applicationDeadline as string)}</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand transition-colors flex-shrink-0 mt-2" />
                    </Link>
                  );
                })}
              </div>
            )}

            {jobsTotal > 12 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setJobsPage((p) => Math.max(1, p - 1))} disabled={jobsPage === 1} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">Previous</button>
                <span className="text-sm text-gray-500">Page {jobsPage} of {Math.ceil(jobsTotal / 12)}</span>
                <button onClick={() => setJobsPage((p) => p + 1)} disabled={jobsPage >= Math.ceil(jobsTotal / 12)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>}>
      <OpportunitiesContent />
    </Suspense>
  );
}

