'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { notificationAPI, connectionAPI } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const NOTIFICATION_ICONS: Record<string, string> = {
  connection_request: '🤝',
  connection_accepted: '✅',
  new_friend_request: '👤',
  new_message: '💬',
  message_mention: '@',
  application_status: '📋',
  job_application: '💼',
  job_shortlisted: '⭐',
  job_rejected: '❌',
  listing_approved: '🎉',
  listing_rejected: '❌',
  listing_cancelled: '🚫',
  new_job_posted: '🏢',
  job_recommendation: '🎯',
  new_event_posted: '📅',
  event_registration: '📝',
  event_reminder: '⏰',
  event_update: '🔄',
  event_summary: '📊',
  new_training_posted: '🏋️',
  training_registration: '🏃',
  new_follower: '👥',
  event_engagement: '❤️',
  weekly_summary: '📈',
  profile_trending: '🚀',
  profile_views_stat: '👁️',
  top_orgs_viewing: '🕵️',
  org_verification: '🏢',
  profile_incomplete: '⚠️',
  security_alert: '🛡️',
  system_announcement: '📢',
  inquiry_received: '📥',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchNotifications(); }, [page]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationAPI.getNotifications({ page, limit: 20 });
      setNotifications(res.data.data?.notifications || []);
      setUnreadCount(res.data.data?.unreadCount || 0);
      setTotal(res.data.pagination?.total || 0);
    } catch {}
    setIsLoading(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch {}
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} unread</p>}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-2 text-sm text-brand hover:underline">
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No notifications yet</h3>
              <p className="text-gray-500">We'll notify you when something important happens.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif._id as string}
                  className={`card p-4 flex gap-3 cursor-pointer transition-colors ${!notif.isRead ? 'border-l-4 border-l-brand bg-blue-50/30' : 'hover:bg-gray-50'}`}
                  onClick={() => {
                    if (!notif.isRead) markAsRead(notif._id as string);
                    if (notif.link) router.push(notif.link as string);
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl flex-shrink-0">
                    {NOTIFICATION_ICONS[notif.type as string] || '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-gray-900">{notif.title as string}</p>
                      {!notif.isRead && <div className="w-2 h-2 bg-brand rounded-full mt-1 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{notif.message as string}</p>
                    
                    {notif.type === 'connection_request' && !notif.isRead && (
                      <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={async () => {
                            try {
                              await connectionAPI.respondToRequest(notif.referenceId as string, 'accept');
                              markAsRead(notif._id as string);
                              toast.success('Connection accepted');
                            } catch { toast.error('Failed to accept'); }
                          }}
                          className="px-3 py-1 bg-brand text-white text-xs font-semibold rounded hover:bg-brand-dark transition-colors"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await connectionAPI.respondToRequest(notif.referenceId as string, 'reject');
                              markAsRead(notif._id as string);
                              toast.success('Connection rejected');
                            } catch { toast.error('Failed to reject'); }
                          }}
                          className="px-3 py-1 bg-white text-gray-700 border border-gray-300 text-xs font-semibold rounded hover:bg-gray-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">{formatRelativeTime(notif.createdAt as string)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {total > 20 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">Previous</button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
