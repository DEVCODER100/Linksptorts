'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { connectionAPI } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Users, UserCheck, UserX, Clock, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'connections', label: 'Connections', icon: Users },
  { id: 'pending', label: 'Incoming', icon: Clock },
  { id: 'sent', label: 'Sent', icon: UserCheck },
];

export default function ConnectionsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('connections');
  const [connections, setConnections] = useState<Record<string, unknown>[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Record<string, unknown>[]>([]);
  const [sentRequests, setSentRequests] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [connRes, pendRes, sentRes] = await Promise.all([
        connectionAPI.getConnections(),
        connectionAPI.getPendingRequests(),
        connectionAPI.getSentRequests().catch(() => ({ data: { data: [] } })),
      ]);
      setConnections(connRes.data.data || []);
      setPendingRequests(pendRes.data.data || []);
      setSentRequests(sentRes.data.data || []);
    } catch {}
    setIsLoading(false);
  };

  const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      await connectionAPI.respondToRequest(requestId, action);
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      if (action === 'accept') {
        toast.success('Connection accepted!');
        fetchData(); // Refresh connections list
      } else {
        toast.success('Request declined');
      }
    } catch { toast.error('Failed to update request'); }
  };

  const handleWithdraw = async (connectionId: string) => {
    try {
      await connectionAPI.withdrawConnection(connectionId);
      setConnections((prev) => prev.filter((c) => c._id !== connectionId));
      toast.success('Connection removed');
    } catch { toast.error('Failed to remove connection'); }
  };

  const handleWithdrawSent = async (requestId: string) => {
    try {
      await connectionAPI.withdrawSentRequest(requestId);
      setSentRequests((prev) => prev.filter((r) => r._id !== requestId));
      toast.success('Request withdrawn');
    } catch { toast.error('Failed to withdraw request'); }
  };

  const getProfile = (conn: Record<string, unknown>, field: string) => {
    return conn[field] as Record<string, unknown>;
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="grid sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse flex gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Network</h1>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
            {TABS.map((tab) => {
              const count = tab.id === 'connections' ? connections.length : tab.id === 'pending' ? pendingRequests.length : sentRequests.length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-brand text-white' : 'bg-gray-300 text-gray-600'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === 'connections' && (
            <>
              {connections.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No connections yet</h3>
                  <p className="text-gray-500 mb-4">Start building your sports network</p>
                  <Link href="/search" className="btn-primary px-6 py-2">Find People</Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {connections.map((conn) => {
                    const reqObj = (conn.requesterId || {}) as Record<string, unknown>;
                    const isCurrentUserRequester = (reqObj._id && String(reqObj._id) === String(user?.id)) || (reqObj.id && String(reqObj.id) === String(user?.id));
                    const profile = (isCurrentUserRequester ? conn.recipientProfile : conn.requesterProfile) as Record<string, unknown> || {};
                    const userInfo = (isCurrentUserRequester ? conn.recipientId : conn.requesterId) as Record<string, unknown> || {};
                    const email = userInfo.email as string || '';
                    const name = (profile.fullName || profile.name || userInfo.name || (email ? email.split('@')[0] : 'Unknown')) as string;
                    const sport = (profile.primarySport || (profile.sportsSpecialization as string[])?.[0] || '') as string;
                    const photo = (profile.photo || userInfo.photo || '') as string;
                    const role = (userInfo.role || '') as string;
                    const userId = (userInfo._id || '') as string;

                    const profileUrl = role === 'athlete' ? `/athlete/${profile.profileUrl || userId}`
                      : role === 'coach' ? `/coach/${profile.profileUrl || userId}`
                      : `/org/${userId}`;

                    return (
                      <div key={conn._id as string} className="card p-4 flex items-start gap-3">
                        <Link href={profileUrl} className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-bold overflow-hidden">
                            {photo ? <img src={photo} alt={name} loading="lazy" className="w-full h-full object-cover" /> : getInitials(name)}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={profileUrl}>
                            <h3 className="font-semibold text-gray-900 hover:text-brand transition-colors">{name}</h3>
                          </Link>
                          <p className="text-sm text-gray-500 capitalize">{role}{sport ? ` · ${sport}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link
                            href={`/messages?userId=${userId}`}
                            className="p-2 text-gray-500 hover:text-brand hover:bg-blue-50 rounded-lg transition-colors"
                            title="Send message"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleWithdraw(conn._id as string)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove connection"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'pending' && (
            <>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No pending requests</h3>
                  <p className="text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => {
                    const profile = (req.requesterProfile || {}) as Record<string, unknown>;
                    const userInfo = (req.requesterId || {}) as Record<string, unknown>;
                    const email = userInfo.email as string || '';
                    const name = (profile.fullName || profile.name || userInfo.name || (email ? email.split('@')[0] : 'Unknown')) as string;
                    const sport = (profile.primarySport || '') as string;
                    const photo = (profile.photo || '') as string;
                    const role = (userInfo.role || '') as string;

                    return (
                      <div key={req._id as string} className="card p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-bold flex-shrink-0 overflow-hidden">
                          {photo ? <img src={photo} alt={name} loading="lazy" className="w-full h-full object-cover" /> : getInitials(name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{role}{sport ? ` · ${sport}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRespond(req._id as string, 'accept')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            <UserCheck className="w-4 h-4" /> Accept
                          </button>
                          <button
                            onClick={() => handleRespond(req._id as string, 'reject')}
                            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            <UserX className="w-4 h-4" /> Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'sent' && (
            <>
              {sentRequests.length === 0 ? (
                <div className="text-center py-16">
                  <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No sent requests</h3>
                  <p className="text-gray-500">Connect with athletes, coaches and organizations</p>
                  <Link href="/search" className="btn-primary px-6 py-2 mt-4 inline-block">Find People</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((req) => {
                    const profile = (req.recipientProfile || {}) as Record<string, unknown>;
                    const userInfo = (req.recipientId || {}) as Record<string, unknown>;
                    const email = userInfo.email as string || '';
                    const name = (profile.fullName || profile.name || userInfo.name || (email ? email.split('@')[0] : 'Unknown')) as string;
                    const sport = (profile.primarySport || '') as string;
                    const photo = (profile.photo || '') as string;
                    const role = (userInfo.role || '') as string;

                    return (
                      <div key={req._id as string} className="card p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-bold flex-shrink-0 overflow-hidden">
                          {photo ? <img src={photo} alt={name} loading="lazy" className="w-full h-full object-cover" /> : getInitials(name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{role}{sport ? ` · ${sport}` : ''}</p>
                          <p className="text-xs text-amber-600 mt-0.5">Request pending</p>
                        </div>
                        <button
                          onClick={() => handleWithdrawSent(req._id as string)}
                          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                        >
                          <UserX className="w-4 h-4" /> Withdraw
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
