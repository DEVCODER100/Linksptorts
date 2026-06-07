'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { pendingReg } from '@/lib/pendingRegistration';
import { Dumbbell, User, Stethoscope, Building2, Loader2, ArrowLeft } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type Role = 'athlete' | 'coach' | 'professional' | 'organization';

const roles: {
  id: Role;
  label: string;
  desc: string;
  detail: string;
  icon: React.ElementType;
  accent: string;
  bg: string;
  border: string;
  ring: string;
}[] = [
  {
    id: 'athlete',
    label: 'Athlete',
    desc: 'I play sports',
    detail: 'Find trials, showcase your profile, connect with coaches and academies.',
    icon: Dumbbell,
    accent: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    ring: 'ring-emerald-300',
  },
  {
    id: 'coach',
    label: 'Coach',
    desc: 'I train & coach athletes',
    detail: 'Share your expertise, recruit athletes and grow your coaching career.',
    icon: User,
    accent: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    ring: 'ring-blue-300',
  },
  {
    id: 'professional',
    label: 'Professional',
    desc: 'I work in sports',
    detail: 'Physio, nutritionist, sports agent or any sports support professional.',
    icon: Stethoscope,
    accent: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-400',
    ring: 'ring-purple-300',
  },
  {
    id: 'organization',
    label: 'Organization',
    desc: 'I run a sports body',
    detail: 'Academy, club, school, federation or any sports organisation.',
    icon: Building2,
    accent: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-400',
    ring: 'ring-orange-300',
  },
];

export default function SelectRolePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [loadingRole, setLoadingRole] = useState<Role | null>(null);

  // Guard: if there's no pending registration data, send back
  useEffect(() => {
    const stored = sessionStorage.getItem('ls_reg');
    if (!stored) {
      router.replace('/auth/register');
    }
  }, [router]);

  const handleSelect = async (role: Role) => {
    const raw = sessionStorage.getItem('ls_reg');
    if (!raw) {
      toast.error('Session expired. Please start again.');
      router.replace('/auth/register');
      return;
    }

    const { fullName, email, phone } = JSON.parse(raw) as {
      fullName: string;
      email: string;
      phone: string;
    };
    const password = pendingReg.getPassword();
    if (!password) {
      // Password lost on page refresh — restart registration
      toast.error('Session expired. Please fill in your details again.');
      sessionStorage.removeItem('ls_reg');
      router.replace('/auth/register');
      return;
    }

    setSelected(role);
    setLoadingRole(role);

    try {
      await authAPI.register({
        fullName,
        email,
        phone: phone || undefined,
        password,
        role,
        // For organizations, use fullName as the org name so the backend can create
        // the profile immediately; the user can update org-specific details later.
        ...(role === 'organization' && {
          organizationName: fullName,
          contactPerson: fullName,
        }),
      });

      sessionStorage.removeItem('ls_reg');
      pendingReg.clear();
      toast.success('Account created! Please verify your email.');
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || 'Registration failed. Please try again.';
      toast.error(msg);
      setSelected(null);
      setLoadingRole(null);

      // If email already exists, send back to register form
      if (msg.toLowerCase().includes('email')) {
        sessionStorage.removeItem('ls_reg');
        router.replace('/auth/register');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex hover:opacity-90 transition-opacity">
            <Logo />
          </Link>
        </div>

        <div className="card p-8">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">One last step!</h1>
            <p className="mt-1.5 text-gray-500">
              What best describes you? We'll personalise your experience accordingly.
            </p>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roles.map(({ id, label, desc, detail, icon: Icon, accent, bg, border, ring }) => {
              const isSelected = selected === id;
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
                    isSelected
                      ? `${border} ${bg} ring-2 ${ring} ring-offset-1`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
                    isDisabled && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  {/* Icon bubble */}
                  <div className={cn('p-2.5 rounded-xl flex-shrink-0', isSelected ? bg : 'bg-gray-100')}>
                    <Icon className={cn('w-6 h-6', isSelected ? accent : 'text-gray-500')} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-semibold text-sm', isSelected ? accent : 'text-gray-800')}>
                      {label}
                    </p>
                    <p className={cn('text-xs font-medium mt-0.5', isSelected ? accent : 'text-gray-500')}>
                      {desc}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{detail}</p>
                  </div>

                  {/* Spinner overlay */}
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

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
