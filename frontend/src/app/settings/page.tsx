'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authAPI, profileAPI } from '@/lib/api';
import AuthGuard from '@/components/shared/AuthGuard';
import Navbar from '@/components/layout/Navbar';
import {
  User, Lock, Bell, Shield, Trash2, Eye, EyeOff,
  ChevronRight, CheckCircle, AlertTriangle, Loader2, LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'account' | 'privacy' | 'notifications' | 'security' | 'danger';

const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'account',       label: 'Account',       icon: User,          desc: 'Manage your personal information' },
  { id: 'privacy',       label: 'Privacy',        icon: Eye,           desc: 'Control who sees your profile' },
  { id: 'notifications', label: 'Notifications',  icon: Bell,          desc: 'Choose what alerts you receive' },
  { id: 'security',      label: 'Security',       icon: Lock,          desc: 'Password and login security' },
  { id: 'danger',        label: 'Danger Zone',    icon: AlertTriangle, desc: 'Irreversible account actions' },
];

// ── Account Tab ───────────────────────────────────────────────────────────────
function AccountTab() {
  const { user, profile, fetchMe } = useAuthStore();
  const [phone, setPhone] = useState((profile as any)?.phone || '');
  const [username, setUsername] = useState((profile as any)?.username || '');
  const [saving, setSaving] = useState(false);

  const isAthlete = user?.role === 'athlete';

  const handleSave = async () => {
    if (isAthlete && username && !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      toast.error('Username: 3–30 chars, letters/numbers/underscores only');
      return;
    }
    setSaving(true);
    try {
      const role = user?.role;
      const payload: Record<string, string> = { phone };
      if (isAthlete) payload.username = username;
      if (role === 'athlete') await profileAPI.updateAthleteProfile(payload);
      else if (role === 'coach') await profileAPI.updateCoachProfile({ phone });
      else if (role === 'organization') await profileAPI.updateOrganizationProfile({ phone });
      await fetchMe();
      toast.success('Account information updated');
    } catch {
      toast.error('Failed to update account information');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your basic account details</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {/* Email */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Email Address</p>
            <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Cannot change</span>
        </div>

        {/* Role */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Account Type</p>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{user?.role}</p>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${
            user?.isVerified ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
          }`}>
            {user?.isVerified ? 'Verified' : 'Unverified'}
          </span>
        </div>

        {/* Username — athletes only */}
        {isAthlete && (
          <div className="px-5 py-4">
            <label htmlFor="settings-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <p className="text-xs text-gray-500 mb-2">Shown in the navbar and on your public profile as @username</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
              <input
                id="settings-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="your_username"
                maxLength={30}
                autoComplete="username"
                className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">3–30 characters · letters, numbers, underscores</p>
          </div>
        )}

        {/* Phone */}
        <div className="px-5 py-4">
          <label htmlFor="settings-phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input
            id="settings-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 XXXXX XXXXX"
            autoComplete="tel"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Save Changes
      </button>

      {/* Auth provider */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Linked Accounts</h2>
        <p className="text-sm text-gray-500 mt-0.5 mb-4">How you sign in to LinkSports</p>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            {(user as any)?.authProvider === 'google' ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            ) : (
              <User className="w-4 h-4 text-gray-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 capitalize">
              {(user as any)?.authProvider === 'google' ? 'Google' : 'Email & Password'}
            </p>
            <p className="text-xs text-gray-500">Primary sign-in method</p>
          </div>
          <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
        </div>
      </div>
    </div>
  );
}

// ── Privacy Tab ───────────────────────────────────────────────────────────────
function PrivacyTab() {
  const { user, profile, fetchMe } = useAuthStore();
  const currentVisibility = (profile as any)?.visibility || 'public';
  const [visibility, setVisibility] = useState<'public' | 'connections' | 'private'>(currentVisibility);
  const [saving, setSaving] = useState(false);

  const options: { value: 'public' | 'connections' | 'private'; label: string; desc: string }[] = [
    { value: 'public',      label: 'Public',           desc: 'Anyone can view your profile' },
    { value: 'connections', label: 'Connections only',  desc: 'Only your connections can see your profile' },
    { value: 'private',     label: 'Private',           desc: 'Your profile is hidden from everyone' },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const role = user?.role;
      if (role === 'athlete') await profileAPI.updateAthleteProfile({ visibility });
      else if (role === 'coach') await profileAPI.updateCoachProfile({ visibility });
      else if (role === 'organization') await profileAPI.updateOrganizationProfile({ visibility });
      await fetchMe();
      toast.success('Privacy settings saved');
    } catch {
      toast.error('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Privacy Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Control who can see your profile and activity</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Profile Visibility</p>
          <div className="space-y-2">
            {options.map((opt) => (
              <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                visibility === opt.value ? 'border-brand bg-blue-50' : 'border-gray-100 hover:border-gray-200'
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={visibility === opt.value}
                  onChange={() => setVisibility(opt.value)}
                  className="mt-0.5 accent-brand"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Show in Search Results</p>
            <p className="text-xs text-gray-500">Controlled by your visibility setting above</p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            visibility === 'public' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {visibility === 'public' ? 'Yes' : 'No'}
          </span>
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Allow Connection Requests</p>
            <p className="text-xs text-gray-500">Others can send you connection requests</p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            visibility !== 'private' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {visibility !== 'private' ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Save Privacy Settings
      </button>
    </div>
  );
}

const NOTIF_PREFS_KEY = 'ls_notif_prefs';
const NOTIF_DEFAULTS = {
  connectionRequests: true,
  messages: true,
  trialAlerts: true,
  jobAlerts: true,
  profileViews: false,
  weeklyDigest: true,
  announcements: true,
};

// ── Notifications Tab ─────────────────────────────────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(NOTIF_PREFS_KEY) : null;
      return stored ? { ...NOTIF_DEFAULTS, ...JSON.parse(stored) } : NOTIF_DEFAULTS;
    } catch {
      return NOTIF_DEFAULTS;
    }
  });
  const [saving, setSaving] = useState(false);

  const toggle = (key: keyof typeof prefs) => {
    if (saving) return;
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: 'connectionRequests', label: 'Connection Requests',  desc: 'When someone sends you a connection request' },
    { key: 'messages',           label: 'New Messages',         desc: 'When you receive a new message' },
    { key: 'trialAlerts',        label: 'Trial & Event Alerts', desc: 'New trials and events matching your sport' },
    { key: 'jobAlerts',          label: 'Job Alerts',           desc: 'New job postings relevant to you' },
    { key: 'profileViews',       label: 'Profile Views',        desc: 'When someone views your profile' },
    { key: 'weeklyDigest',       label: 'Weekly Digest',        desc: 'A weekly summary of activity on LinkSports' },
    { key: 'announcements',      label: 'Announcements',        desc: 'Important platform news and updates' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        <p className="text-sm text-gray-500 mt-0.5">Choose what you want to be notified about</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {items.map(({ key, label, desc }) => (
          <div key={key as string} className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => toggle(key)}
              disabled={saving}
              aria-label={`${prefs[key] ? 'Disable' : 'Enable'} ${label}`}
              aria-pressed={prefs[key]}
              className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${prefs[key] ? 'bg-brand' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[key] ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Save Preferences
      </button>
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const isGoogleUser = (user as any)?.authProvider === 'google';

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!/(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(form.newPassword)) {
      toast.error('Password needs 1 uppercase, 1 number, 1 special character');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    await logout();
    toast.success('Logged out of all devices');
    router.push('/auth/login');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your password and active sessions</p>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Change Password</h3>
        {isGoogleUser ? (
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Shield className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              You signed in with Google. Password management is handled by your Google account — no password is set for this account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => {
              const labels = { currentPassword: 'Current Password', newPassword: 'New Password', confirmPassword: 'Confirm New Password' };
              const showKey = field === 'currentPassword' ? 'current' : field === 'newPassword' ? 'new' : 'confirm';
              const autoCompleteVal = field === 'currentPassword' ? 'current-password' : 'new-password';
              const inputId = `security-${field}`;
              return (
                <div key={field}>
                  <label htmlFor={inputId} className="block text-xs font-medium text-gray-600 mb-1">{labels[field]}</label>
                  <div className="relative">
                    <input
                      id={inputId}
                      type={show[showKey as keyof typeof show] ? 'text' : 'password'}
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      autoComplete={autoCompleteVal}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-brand"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => ({ ...s, [showKey]: !s[showKey as keyof typeof show] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {show[showKey as keyof typeof show] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update Password
            </button>
          </form>
        )}
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Active Sessions</h3>
        <p className="text-xs text-gray-500 mb-4">Sign out of all devices where you're currently logged in</p>
        <button
          onClick={handleLogoutAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <LogOut className="w-4 h-4" /> Sign Out of All Devices
        </button>
      </div>
    </div>
  );
}

// ── Danger Zone Tab ───────────────────────────────────────────────────────────
function DangerZoneTab() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirm !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    setDeleting(true);
    try {
      await authAPI.deleteAccount();
      await logout();
      toast.success('Account deleted');
      router.push('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to delete account. Contact support.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
        <p className="text-sm text-gray-500 mt-0.5">These actions are permanent and cannot be undone</p>
      </div>

      <div className="bg-white rounded-xl border-2 border-red-200 px-5 py-5">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-red-700">Delete Account</h3>
            <p className="text-xs text-gray-500 mt-1">
              Permanently delete your account, profile, connections, and all associated data. This cannot be undone.
            </p>
          </div>
        </div>

        <form onSubmit={handleDelete} className="space-y-3">
          <div>
            <label htmlFor="danger-confirm" className="block text-xs font-medium text-gray-600 mb-1">
              Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
            </label>
            <input
              id="danger-confirm"
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="w-full max-w-xs px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <button
            type="submit"
            disabled={deleting || confirm !== 'DELETE'}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete My Account
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('account');

  const content: Record<Tab, React.ReactNode> = {
    account:       <AccountTab />,
    privacy:       <PrivacyTab />,
    notifications: <NotificationsTab />,
    security:      <SecurityTab />,
    danger:        <DangerZoneTab />,
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account, privacy, and preferences</p>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <aside className="md:w-56 flex-shrink-0">
              <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {tabs.map(({ id, label, icon: Icon, desc }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                      activeTab === id
                        ? id === 'danger'
                          ? 'border-red-500 bg-red-50'
                          : 'border-brand bg-blue-50'
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${
                      activeTab === id
                        ? id === 'danger' ? 'text-red-500' : 'text-brand'
                        : 'text-gray-400'
                    }`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        activeTab === id
                          ? id === 'danger' ? 'text-red-700' : 'text-brand'
                          : 'text-gray-700'
                      }`}>{label}</p>
                      <p className="text-[10px] text-gray-400 truncate hidden md:block">{desc}</p>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 ml-auto flex-shrink-0 ${activeTab === id ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 min-w-0">
              {content[activeTab]}
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
