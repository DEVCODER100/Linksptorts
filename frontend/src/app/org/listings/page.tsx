'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { listingAPI } from '@/lib/api';
import { formatDate, getStatusBadge, getListingTypeBadge } from '@/lib/utils';
import { Trophy, Plus, Users, Loader2, ChevronLeft, AlertCircle, CheckCircle, ExternalLink, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgListingsPage() {
  const [listings, setListings] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const res = await listingAPI.getMyListings();
      setListings(res.data.data || []);
    } catch {
      toast.error('Failed to load your listings');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleSubmitForReview = async (id: string) => {
    try {
      await listingAPI.submitForReview(id);
      toast.success('Listing submitted for admin review');
      fetchListings();
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
                <h1 className="text-2xl font-bold text-gray-900">Manage Listings</h1>
                <p className="text-sm text-gray-500">Trials, tournaments, and events posted by you</p>
              </div>
            </div>
            <Link href="/org/listings/create" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create New Listing
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-brand" />
            </div>
          ) : listings.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No listings yet</h2>
              <p className="text-gray-500 max-w-sm mx-auto mb-8">
                Start by creating your first trial or tournament to reach thousands of athletes.
              </p>
              <Link href="/org/listings/create" className="btn-primary">
                Create Your First Listing
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {listings.map((l) => {
                const statusBadge = getStatusBadge(l.status as string);
                const typeBadge = getListingTypeBadge(l.type as string);
                const appCount = (l.applicationCount as number) || 0;
                
                return (
                  <div key={l._id as string} className="card p-5 hover:shadow-md transition-shadow group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`badge ${typeBadge.color}`}>{typeBadge.label}</span>
                          <span className={`badge ${statusBadge.color}`}>{statusBadge.label}</span>
                          {l.isPaidListing && (
                            <span className="badge bg-yellow-100 text-yellow-700 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Featured
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-brand transition-colors">
                          {l.title as string}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-1 text-sm text-gray-500">
                          <span>📍 {(l.location as Record<string, string>)?.city}, {(l.location as Record<string, string>)?.state}</span>
                          <span>📅 Starts: {formatDate(l.startDate as string)}</span>
                          <span className="font-medium text-brand">👥 {appCount} Applicants</span>
                        </div>
                        
                        {l.status === 'draft' && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2 max-w-xl">
                            <AlertCircle className="w-4 h-4 text-brand mt-0.5" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                              This listing is currently a draft and not visible to anyone. 
                              Click "Submit for Review" once you're ready to publish.
                            </p>
                          </div>
                        )}
                        
                        {l.status === 'rejected' && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 max-w-xl">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-red-700">Listing Rejected</p>
                              <p className="text-xs text-red-600 mt-0.5">{l.rejectionReason as string || 'Please contact support for details.'}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {l.status === 'draft' && (
                          <button
                            onClick={() => handleSubmitForReview(l._id as string)}
                            className="btn-primary text-xs px-4 py-2"
                          >
                            Submit for Review
                          </button>
                        )}
                        <Link
                          href={`/org/listings/${l._id}/edit`}
                          className="btn-secondary text-xs px-4 py-2 flex items-center gap-2"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Link>
                        <Link
                          href={`/listings/${l._id}`}
                          className="btn-secondary text-xs px-4 py-2 flex items-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Preview
                        </Link>
                        <Link
                          href={`/org/listings/${l._id}/applications`}
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
