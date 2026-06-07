'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { profileAPI } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileSlugPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    if (!id) return;
    resolveProfile();
  }, [id]);

  const resolveProfile = async () => {
    setIsResolving(true);
    try {
      // 1. Try resolving as athlete profile
      try {
        const res = await profileAPI.getAthleteProfile(id);
        if (res.data.data) {
          router.replace(`/athlete/${id}`);
          return;
        }
      } catch (e) {
        // Not an athlete or not found, continue
      }

      // 2. Try resolving as coach profile
      try {
        const res = await profileAPI.getCoachProfile(id);
        if (res.data.data) {
          router.replace(`/coach/${id}`);
          return;
        }
      } catch (e) {
        // Not a coach or not found, continue
      }

      // 3. Try resolving as organization profile
      try {
        const res = await profileAPI.getOrganizationProfile(id);
        if (res.data.data) {
          router.replace(`/org/${id}`);
          return;
        }
      } catch (e) {
        // Not an org or not found, continue
      }

      toast.error('Profile not found');
      router.replace('/search');
    } catch (e) {
      console.error('Error resolving profile:', e);
      toast.error('Failed to resolve profile');
      router.replace('/search');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-brand" />
      <p className="text-gray-500 font-medium">Resolving profile...</p>
    </div>
  );
}
