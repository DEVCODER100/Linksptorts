'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { listingAPI, jobAPI } from '@/lib/api';
import { formatDate, getStatusBadge, getListingTypeBadge } from '@/lib/utils';
import { Trophy, Briefcase, Loader2, ChevronLeft, ExternalLink } from 'lucide-react';

export default function ApplicationsPage() {
  const [tab, setTab] = useState<'trials' | 'jobs'>('trials');
  const [trialApplications, setTrialApplications] = useState<Record<string, unknown>[]>([]);
  const [jobApplications, setJobApplications] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [trialsRes, jobsRes] = await Promise.all([
          listingAPI.getMyApplications().catch(() => ({ data: { data: [] } })),
          jobAPI.getMyJobApplications().catch(() => ({ data: { data: [] } })),
        ]);
        setTrialApplications(trialsRes.data?.data || []);
        setJobApplications(jobsRes.data?.data || []);
      } catch { /* empty */ }
      setIsLoading(false);
    };
    fetchAll();
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
              <p className="text-sm text-gray-500">Track all your trial and job applications</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 mb-6">
            <button
              onClick={() => setTab('trials')}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'trials' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <Trophy className="w-4 h-4" />
              Trials & Events
              {trialApplications.length > 0 && (
                <span className="ml-1 bg-brand text-white text-xs rounded-full px-2 py-0.5">{trialApplications.length}</span>
              )}
            </button>
            <button
              onClick={() => setTab('jobs')}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'jobs' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase className="w-4 h-4" />
              Jobs
              {jobApplications.length > 0 && (
                <span className="ml-1 bg-brand text-white text-xs rounded-full px-2 py-0.5">{jobApplications.length}</span>
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
          ) : tab === 'trials' ? (
            <div className="space-y-3">
              {trialApplications.length === 0 ? (
                <div className="card p-12 text-center">
                  <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium text-gray-500">No trial applications yet</p>
                  <p className="text-sm text-gray-400 mt-1">Browse listings and apply to trials and events</p>
                  <Link href="/listings" className="btn-primary inline-block mt-4 text-sm">Browse Listings</Link>
                </div>
              ) : (
                trialApplications.map((app) => {
                  const listing = app.listingId as Record<string, unknown>;
                  const badge = getStatusBadge(app.status as string);
                  const typeBadge = getListingTypeBadge(listing?.type as string);
                  const loc = listing?.location as Record<string, string>;
                  return (
                    <div key={app._id as string} className="card p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`badge ${typeBadge.color}`}>{typeBadge.label}</span>
                            <span className={`badge ${badge.color}`}>{badge.label}</span>
                          </div>
                          <p className="font-semibold text-gray-900">{listing?.title as string || 'Listing'}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            {loc?.city && <span>📍 {loc.city}{loc.state ? `, ${loc.state}` : ''}</span>}
                            {listing?.startDate && <span>📅 {formatDate(listing.startDate as string)}</span>}
                            {app.createdAt && <span>Applied: {formatDate(app.createdAt as string)}</span>}
                          </div>
                          {(app.answers as unknown[])?.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">{(app.answers as unknown[]).length} question(s) answered</p>
                          )}
                        </div>
                        {listing?._id && (
                          <Link href={`/listings/${listing._id}`} className="flex-shrink-0 p-2 text-gray-400 hover:text-brand transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {jobApplications.length === 0 ? (
                <div className="card p-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium text-gray-500">No job applications yet</p>
                  <p className="text-sm text-gray-400 mt-1">Find coaching and sports professional roles</p>
                  <Link href="/jobs" className="btn-primary inline-block mt-4 text-sm">Browse Jobs</Link>
                </div>
              ) : (
                jobApplications.map((app) => {
                  const job = app.jobId as Record<string, unknown>;
                  const badge = getStatusBadge(app.status as string);
                  const loc = job?.location as Record<string, string>;
                  return (
                    <div key={app._id as string} className="card p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`badge ${badge.color}`}>{badge.label}</span>
                            {job?.jobType && <span className="badge bg-gray-100 text-gray-600">{job.jobType as string}</span>}
                          </div>
                          <p className="font-semibold text-gray-900">{job?.title as string || 'Job'}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            {loc?.city && <span>📍 {loc.city}{loc.state ? `, ${loc.state}` : ''}</span>}
                            {job?.category && <span>🏅 {job.category as string}</span>}
                            {app.createdAt && <span>Applied: {formatDate(app.createdAt as string)}</span>}
                          </div>
                          {app.coverLetter && (
                            <p className="text-xs text-gray-400 mt-2 line-clamp-2 italic">"{app.coverLetter as string}"</p>
                          )}
                        </div>
                        {job?._id && (
                          <Link href={`/jobs/${job._id}`} className="flex-shrink-0 p-2 text-gray-400 hover:text-brand transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
