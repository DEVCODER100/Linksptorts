'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { jobAPI } from '@/lib/api';
import { formatDate, getStatusBadge, formatCurrency } from '@/lib/utils';
import { Briefcase, Plus, Users, Loader2, ChevronLeft, AlertCircle, ExternalLink, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgJobsPage() {
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const res = await jobAPI.getMyOrgJobs();
      setJobs(res.data.data || []);
    } catch {
      toast.error('Failed to load your job postings');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSubmitForReview = async (id: string) => {
    try {
      await jobAPI.submitForReview(id);
      toast.success('Job posting submitted for admin review');
      fetchJobs();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to submit';
      toast.error(msg);
    }
  };

  return (
    <AuthGuard allowedRoles={['organization']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Job Postings</h1>
                <p className="text-sm text-gray-500">Post coaching, training, and sports professional roles</p>
              </div>
            </div>
            <Link href="/org/jobs/create" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Post New Job
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-brand" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No job postings yet</h2>
              <p className="text-gray-500 max-w-sm mx-auto mb-8">
                Reach thousands of qualified coaches and sports professionals globally.
              </p>
              <Link href="/org/jobs/create" className="btn-primary">
                Post Your First Job
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((j) => {
                const statusBadge = getStatusBadge(j.status as string);
                const appCount = (j.applicationCount as number) || 0;
                
                return (
                  <div key={j._id as string} className="card p-5 hover:shadow-md transition-shadow group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="badge bg-purple-100 text-purple-700">{j.category as string}</span>
                          <span className={`badge ${statusBadge.color}`}>{statusBadge.label}</span>
                          <span className="badge bg-gray-100 text-gray-600 capitalize">
                            {(j.jobType as string)?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-brand transition-colors">
                          {j.title as string}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> 
                            {j.location && (j.location as Record<string, unknown>).isRemote ? 'Remote' : (j.location as Record<string, string>)?.city}
                          </span>
                          {j.salaryRange && (
                            <span>💰 {formatCurrency((j.salaryRange as Record<string, number>).min)} - {formatCurrency((j.salaryRange as Record<string, number>).max)} / month</span>
                          )}
                          <span>📅 Posted: {formatDate(j.createdAt as string)}</span>
                          <span className="font-medium text-brand">👥 {appCount} Applicants</span>
                        </div>
                        
                        {j.status === 'draft' && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2 max-w-xl">
                            <AlertCircle className="w-4 h-4 text-brand mt-0.5" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                              This job posting is currently a draft and not visible. 
                              Click "Submit for Review" once you're ready to publish.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                         {j.status === 'draft' && (
                          <button 
                            onClick={() => handleSubmitForReview(j._id as string)}
                            className="btn-primary text-xs px-4 py-2"
                          >
                            Submit for Review
                          </button>
                        )}
                        <Link 
                          href={`/jobs/${j._id}`} 
                          className="btn-secondary text-xs px-4 py-2 flex items-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Preview
                        </Link>
                        <Link 
                          href={`/org/jobs/${j._id}/applications`} 
                          className="btn-secondary text-xs px-4 py-2 flex items-center gap-2"
                        >
                          <Users className="w-3.5 h-3.5" /> Manage Applications
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
