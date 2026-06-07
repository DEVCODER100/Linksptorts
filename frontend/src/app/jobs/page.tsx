'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { jobAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatCurrency, getStatusBadge, SPORTS_LIST, INDIAN_STATES } from '@/lib/utils';
import { Search, MapPin, Briefcase, Clock, SlidersHorizontal, X, ChevronRight, Users, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const JOB_CATEGORIES = ['coach', 'pe_teacher', 'fitness_trainer', 'sports_physio', 'nutritionist', 'manager', 'admin', 'other'];
const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship'];

export default function JobsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ q: '', category: '', jobType: '', location: '' });
  const [myApplications, setMyApplications] = useState<string[]>([]);

  useEffect(() => { fetchJobs(); }, [filters, page]);
  useEffect(() => {
    if (isAuthenticated) fetchMyApplications();
  }, [isAuthenticated]);

  const fetchJobs = async () => {
    setIsLoading(true);
    setFetchError(false);
    try {
      const params = { ...filters, page, limit: 12 };
      Object.keys(params).forEach((k) => { if (!(params as Record<string, unknown>)[k]) delete (params as Record<string, unknown>)[k]; });
      const res = await jobAPI.getJobs(params);
      setJobs(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      setFetchError(true);
      toast.error('Failed to load jobs. Please try again.');
    }
    setIsLoading(false);
  };

  const fetchMyApplications = async () => {
    try {
      const res = await jobAPI.getMyJobApplications();
      const apps = res.data.data || [];
      setMyApplications(apps.map((a: Record<string, unknown>) => (a.jobId as Record<string, unknown>)?._id as string || a.jobId as string));
    } catch {}
  };

  const handleApply = async (jobId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { window.location.href = '/auth/login'; return; }
    try {
      await jobAPI.applyToJob(jobId);
      toast.success('Application submitted!');
      setMyApplications([...myApplications, jobId]);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to apply';
      toast.error(msg);
    }
  };

  const updateFilter = (key: string, value: string) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };
  const clearFilters = () => { setFilters({ q: '', category: '', jobType: '', location: '' }); setPage(1); };
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sports Job Board</h1>
          <p className="text-gray-500">{total} positions available</p>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search jobs..." value={filters.q} onChange={(e) => updateFilter('q', e.target.value)} className="input-field pl-9" />
            </div>
            <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className="input-field w-auto min-w-36">
              <option value="">All Categories</option>
              {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
            </select>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${showFilters ? 'border-brand bg-blue-50 text-brand' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>
              <SlidersHorizontal className="w-4 h-4" /> Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-brand" />}
            </button>
            {hasFilters && <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"><X className="w-4 h-4" />Clear</button>}
          </div>
          {showFilters && (
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
              <select value={filters.jobType} onChange={(e) => updateFilter('jobType', e.target.value)} className="input-field">
                <option value="">All Job Types</option>
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', '-').replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
              </select>
              <input type="text" placeholder="Location (city/state)" value={filters.location} onChange={(e) => updateFilter('location', e.target.value)} className="input-field" />
            </div>
          )}
        </div>

        {/* Job list */}
        {isLoading ? (
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
        ) : fetchError ? (
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Could not load jobs</h3>
            <p className="text-gray-500 mb-6">There was a problem connecting to the server.</p>
            <button onClick={fetchJobs} className="btn-primary px-6 py-2.5">Retry</button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {hasFilters ? 'No jobs found' : 'No jobs posted yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {hasFilters
                ? 'Try different search terms or filters.'
                : 'Be the first to post a sports job and find the right talent.'}
            </p>
            {!hasFilters && (
              <Link href="/auth/register?role=organization" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
                <Building2 className="w-4 h-4" /> Post a Job as an Organization
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const org = job.organizationId as Record<string, unknown>;
              const applied = myApplications.includes(job._id as string);
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
                          <button
                            onClick={(e) => handleApply(job._id as string, e)}
                            className="btn-primary text-sm px-4 py-1.5"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3.5 h-3.5" />{job.location as string}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Briefcase className="w-3.5 h-3.5" />{(job.jobType as string)?.replace('_', '-')}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3.5 h-3.5" />{job.category as string}</span>
                      {job.salaryMin && <span className="flex items-center gap-1 text-xs text-gray-500">{formatCurrency(job.salaryMin as number)} - {formatCurrency(job.salaryMax as number)}/mo</span>}
                      {job.applicationDeadline && <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3.5 h-3.5" />Due {formatDate(job.applicationDeadline as string)}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand transition-colors flex-shrink-0 mt-2" />
                </Link>
              );
            })}
          </div>
        )}

        {total > 12 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 12)}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 12)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
