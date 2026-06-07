'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Dumbbell, User, Stethoscope, Building2, Loader2 } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type Role = 'athlete' | 'coach' | 'professional' | 'organization';

const roles: { id: Role; label: string; desc: string; detail: string; icon: React.ElementType; accent: string; bg: string; border: string; ring: string }[] = [
  { id: 'athlete', label: 'Athlete', desc: 'I play sports', detail: 'Find trials, showcase your profile, connect with coaches and academies.', icon: Dumbbell, accent: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-400', ring: 'ring-emerald-300' },
  { id: 'coach', label: 'Coach', desc: 'I train & coach athletes', detail: 'Share your expertise, recruit athletes and grow your coaching career.', icon: User, accent: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-400', ring: 'ring-blue-300' },
  { id: 'professional', label: 'Professional', desc: 'I work in sports', detail: 'Physio, nutritionist, sports agent or any sports support professional.', icon: Stethoscope, accent: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-400', ring: 'ring-purple-300' },
  { id: 'organization', label: 'Organization', desc: 'I run a sports body', detail: 'Academy, club, school, federation or any sports organisation.', icon: Building2, accent: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-400', ring: 'ring-orange-300' },
];

export default function GoogleSelectRolePage() {
  const router = useRouter();
  const { setAccessToken, fetchMe } = useAuthStore();
  const [loadingRole, setLoadingRole] = useState<Role | null>(null);

  const handleSelect = async (role: Role) => {
    setLoadingRole(role);
    try {
      const res = await authAPI.updateRole(role);
      const newToken = res.data.data?.accessToken;
      if (newToken) setAccessToken(newToken);
      await fetchMe();
      toast.success(`Account set up as ${role}!`);
      router.replace('/dashboard');
    } catch {
      toast.error('Failed to set account type. Please try again.');
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex hover:opacity-90 transition-opacity">
            <Logo />
          </Link>
        </div>

        <div className="card p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to LinkSports!</h1>
            <p className="mt-1.5 text-gray-500">
              You signed in with Google. What best describes you? We'll personalise your experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roles.map(({ id, label, desc, detail, icon: Icon, accent, bg, border, ring }) => {
              const isLoading = loadingRole === id;
              const isDisabled = loadingRole !== null && loadingRole !== id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={isDisabled || isLoading}
                  onClick={() => handleSelect(id)}
                  className={cn(
                    'relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-150',
                    isLoading ? `${border} ${bg} ring-2 ${ring} ring-offset-1` : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
                    isDisabled && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <div className={cn('p-2.5 rounded-xl flex-shrink-0', isLoading ? bg : 'bg-gray-100')}>
                    <Icon className={cn('w-6 h-6', isLoading ? accent : 'text-gray-500')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-semibold text-sm', isLoading ? accent : 'text-gray-800')}>{label}</p>
                    <p className={cn('text-xs font-medium mt-0.5', isLoading ? accent : 'text-gray-500')}>{desc}</p>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{detail}</p>
                  </div>
                  {isLoading && (
                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-white/60">
                      <Loader2 className={cn('w-6 h-6 animate-spin', accent)} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            You can always update your profile details after signing in.
          </p>
        </div>
      </div>
    </div>
  );
}
