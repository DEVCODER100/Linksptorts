'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { connectionAPI } from '@/lib/api';
import { getInitials, getPhotoUrl } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Users, MessageCircle, Search, Loader2 } from 'lucide-react';

export default function MyConnectionsPage() {
  const { user } = useAuthStore();
  const [connections, setConnections] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchConnections = async () => {
      setIsLoading(true);
      try {
        const res = await connectionAPI.getConnections();
        setConnections(res.data.data || []);
      } catch {}
      setIsLoading(false);
    };
    fetchConnections();
  }, []);

  const filtered = connections.filter((conn) => {
    const reqObj = (conn.requesterId || {}) as Record<string, unknown>;
    const isCurrentUserRequester =
      (reqObj._id && String(reqObj._id) === String(user?.id)) ||
      (reqObj.id && String(reqObj.id) === String(user?.id));
    const profile = (isCurrentUserRequester ? conn.recipientProfile : conn.requesterProfile) as Record<string, unknown> || {};
    const userInfo = (isCurrentUserRequester ? conn.recipientId : conn.requesterId) as Record<string, unknown> || {};
    const name = (profile.fullName || profile.name || userInfo.name || '') as string;
    const username = (profile.username || profile.profileUrl || '') as string;
    const q = search.toLowerCase();
    return !q || name.toLowerCase().includes(q) || username.toLowerCase().includes(q);
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Connections</h1>
            <p className="text-sm text-gray-500 mt-1">
              {connections.length} {connections.length === 1 ? 'connection' : 'connections'}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            />
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                {search ? 'No results found' : 'No connections yet'}
              </h3>
              <p className="text-gray-500 text-sm mb-5">
                {search ? 'Try a different name or username' : 'Start building your sports network'}
              </p>
              {!search && (
                <Link href="/search" className="btn-primary px-6 py-2 text-sm">
                  Find People
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((conn) => {
                const reqObj = (conn.requesterId || {}) as Record<string, unknown>;
                const isCurrentUserRequester =
                  (reqObj._id && String(reqObj._id) === String(user?.id)) ||
                  (reqObj.id && String(reqObj.id) === String(user?.id));
                const profile = (isCurrentUserRequester ? conn.recipientProfile : conn.requesterProfile) as Record<string, unknown> || {};
                const userInfo = (isCurrentUserRequester ? conn.recipientId : conn.requesterId) as Record<string, unknown> || {};

                const name = (profile.fullName || profile.name || userInfo.name || 'Unknown') as string;
                const username = (profile.username || profile.profileUrl || '') as string;
                const sport = (profile.primarySport || (profile.sportsSpecialization as string[])?.[0] || '') as string;
                const photo = (profile.photo || userInfo.photo || '') as string;
                const role = (userInfo.role || '') as string;
                const userId = (userInfo._id || userInfo.id || '') as string;

                const profileUrl =
                  role === 'athlete' ? `/athlete/${profile.profileUrl || userId}` :
                  role === 'coach'   ? `/coach/${profile.profileUrl || userId}` :
                  `/org/${userId}`;

                const photoUrl = getPhotoUrl(photo);

                return (
                  <div
                    key={conn._id as string}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3"
                  >
                    {/* Avatar */}
                    <Link href={profileUrl} className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                        {photoUrl
                          ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                          : getInitials(name)}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={profileUrl}>
                        <p className="font-semibold text-gray-900 hover:text-brand transition-colors truncate leading-tight">
                          {name}
                        </p>
                      </Link>
                      {username && (
                        <p className="text-xs text-brand truncate">@{username}</p>
                      )}
                      <p className="text-xs text-gray-400 capitalize mt-0.5">
                        {role}{sport ? ` · ${sport}` : ''}
                      </p>
                    </div>

                    {/* Message button */}
                    <Link
                      href={`/messages?userId=${userId}`}
                      className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-brand hover:bg-brand hover:text-white transition-colors"
                      title="Send message"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Link>
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
