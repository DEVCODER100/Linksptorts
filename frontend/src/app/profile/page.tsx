'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/components/shared/AuthGuard';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (!profile) {
      // Profile not loaded yet (not persisted in store) — fetch it
      fetchMe();
      return;
    }
    const p = profile as Record<string, unknown>;
    const profileUrl = p?.profileUrl as string;
    if (user.role === 'athlete' && profileUrl) {
      router.replace(`/athlete/${profileUrl}`);
    } else if (user.role === 'coach' && profileUrl) {
      router.replace(`/coach/${profileUrl}`);
    } else if (user.role === 'organization' && profileUrl) {
      router.replace(`/org/${profileUrl}`);
    } else {
      // No profile yet — go to edit
      router.replace('/profile/edit');
    }
  }, [user, profile, router]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    </AuthGuard>
  );
}
