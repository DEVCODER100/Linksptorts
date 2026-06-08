'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { profileAPI, connectionAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Search, MapPin, UserPlus, CheckCircle, Filter, SlidersHorizontal } from 'lucide-react';
import { getInitials, getPhotoUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'athlete', label: 'Athletes' },
  { id: 'coach', label: 'Coaches' },
  { id: 'organization', label: 'Organizations' },
];

const PLURAL: Record<string, string> = {
  athlete: 'athletes',
  coach: 'coaches',
  organization: 'organizations',
};

function SearchContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'athlete');
  const [profiles, setProfiles] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    sport: '',
    state: '',
    city: '',
    gender: '',
    availability: '',
    isParaAthlete: '',
  });

  useEffect(() => { fetchProfiles(); }, [activeTab, filters, page]);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const params = { ...filters, type: activeTab, page, limit: 16 };
      Object.keys(params).forEach((k) => { if (!(params as Record<string, unknown>)[k]) delete (params as Record<string, unknown>)[k]; });
      const res = await profileAPI.searchProfiles(params);
      const list = res.data.data || [];
      setProfiles(list);
      setTotal(res.data.pagination?.total || 0);

      // Pre-load connection statuses so already-connected users don't show "Connect".
      // Gate on the token (not the store's isAuthenticated, which may not be hydrated yet).
      const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
      if (hasToken && list.length) {
        const userIds = list
          .map((p: Record<string, unknown>) => (p.userId as Record<string, string>)?._id || (p.userId as string))
          .filter(Boolean);
        try {
          const statusRes = await connectionAPI.getConnectionStatuses(userIds);
          setConnectionStatuses(statusRes.data.data || {});
        } catch {}
      }
    } catch {}
    setIsLoading(false);
  };

  const updateFilter = (key: string, value: string) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };

  const handleConnect = async (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { window.location.href = '/auth/login'; return; }
    try {
      await connectionAPI.sendRequest(userId);
      setConnectionStatuses({ ...connectionStatuses, [userId]: 'pending' });
      toast.success('Connection request sent!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to send request';
      // If the backend says they're already connected / request exists, sync the button state
      if (/already connected/i.test(msg)) setConnectionStatuses((s) => ({ ...s, [userId]: 'accepted' }));
      else if (/already sent/i.test(msg)) setConnectionStatuses((s) => ({ ...s, [userId]: 'pending' }));
      toast.error(msg);
    }
  };

  const getProfileUrl = (profile: Record<string, unknown>) => {
    const type = activeTab;
    if (type === 'athlete') return `/athlete/${profile.profileUrl || profile._id}`;
    if (type === 'coach') return `/coach/${profile.profileUrl || profile._id}`;
    return `/org/${profile._id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sports Network</h1>
          <p className="text-gray-500">Find athletes, coaches, and organizations across India</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search by name */}
        <div className="card p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Type a name to search ${PLURAL[activeTab] ?? `${activeTab}s`}…`}
              value={filters.q}
              onChange={(e) => updateFilter('q', e.target.value)}
              className="input-field pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* Results count — hidden while loading to avoid "0 found" flash */}
        {!isLoading && <p className="text-sm text-gray-500 mb-4">{total} {PLURAL[activeTab] ?? `${activeTab}s`} found</p>}

        {/* Results grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No {PLURAL[activeTab] ?? `${activeTab}s`} found</h3>
            <p className="text-gray-500">Try different filters</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {profiles.map((profile) => {
              const userId = (profile.userId as Record<string, string>)?._id || profile.userId as string;
              const status = connectionStatuses[userId];
              const isOwnProfile = user && (profile.userId === user.id || userId === user.id);
              return (
                <Link key={profile._id as string} href={getProfileUrl(profile)} className="card p-5 hover:shadow-md transition-shadow group text-center">
                  <div className="w-16 h-16 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold mx-auto mb-3 overflow-hidden">
                    {getPhotoUrl(profile.photo as string) ? (
                      <img src={getPhotoUrl(profile.photo as string)!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials((profile.fullName || profile.name) as string || 'U')
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors text-sm">{(profile.fullName || profile.name) as string}</h3>
                  {profile.primarySport && <p className="text-xs text-gray-500 mt-0.5">{profile.primarySport as string}</p>}
                  {profile.sportsSpecialization && <p className="text-xs text-gray-500 mt-0.5">{(profile.sportsSpecialization as string[])?.join(', ')}</p>}
                  {profile.sports && <p className="text-xs text-gray-500 mt-0.5">{(profile.sports as string[])?.slice(0, 2).join(', ')}</p>}
                  {(profile.location as Record<string, string>)?.city && (
                    <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />{(profile.location as Record<string, string>).city}
                    </p>
                  )}
                  {profile.availabilityStatus && (
                    <span className="badge bg-green-100 text-green-700 text-xs mt-2 inline-block">
                      {(profile.availabilityStatus as string).replace(/_/g, ' ')}
                    </span>
                  )}
                  {!isOwnProfile && isAuthenticated && (
                    <button
                      onClick={(e) => handleConnect(userId, e)}
                      disabled={!!status}
                      className={`mt-3 flex items-center justify-center gap-1 w-full text-xs py-1.5 rounded-lg transition-colors ${
                        status === 'pending' ? 'bg-gray-100 text-gray-500' :
                        status === 'incoming' ? 'bg-amber-100 text-amber-700' :
                        status === 'accepted' ? 'bg-green-100 text-green-700' :
                        'border border-brand text-brand hover:bg-blue-50'
                      }`}
                    >
                      {status === 'pending' ? 'Pending' : status === 'incoming' ? 'Respond' : status === 'accepted' ? <><CheckCircle className="w-3 h-3" /> Connected</> : <><UserPlus className="w-3 h-3" /> Connect</>}
                    </button>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {total > 16 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 16)}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 16)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>}>
      <SearchContent />
    </Suspense>
  );
}

