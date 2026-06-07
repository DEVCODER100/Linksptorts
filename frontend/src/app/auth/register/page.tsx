'use client';

import { useState, Suspense } from 'react';
import { pendingReg } from '@/lib/pendingRegistration';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be under 50 characters')
    .regex(/^[A-Za-z][A-Za-z\s.'-]*$/, 'Name can only contain letters, spaces, . - and \''),
  email: z.string().trim().email('Enter a valid email address').max(254, 'Email is too long'),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{10}$/.test(v.replace(/\D/g, '')), 'Enter a valid 10-digit mobile number'),
  password: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must have 1 uppercase letter')
    .regex(/[0-9]/, 'Must have 1 number')
    .regex(/[^a-zA-Z0-9]/, 'Must have 1 special character'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-yellow-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
}

const ROLE_COPY: Record<string, { heading: string; sub: string; accent: string }> = {
  athlete: {
    heading: 'Create your Athlete profile',
    sub: 'Build your free Sports CV and get discovered by academies, scouts, and clubs.',
    accent: 'text-brand',
  },
  coach: {
    heading: 'Create your Coaching profile',
    sub: 'Build your professional coaching profile and find jobs at schools, academies, and clubs.',
    accent: 'text-purple-600',
  },
  organization: {
    heading: 'Register your Organisation',
    sub: 'Post trials, search athletes, and hire coaches — from one verified dashboard.',
    accent: 'text-orange-600',
  },
  professional: {
    heading: 'Create your Professional profile',
    sub: 'Connect with the sports ecosystem as a physio, nutritionist, or sports professional.',
    accent: 'text-teal-600',
  },
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role') || '';
  const roleCopy = ROLE_COPY[roleParam] || null;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    if (!termsAccepted) {
      toast.error('Please accept the Terms and Privacy Policy to continue.');
      return;
    }
    setIsLoading(true);
    try {
      // Store non-sensitive fields in sessionStorage; keep password in memory only
      sessionStorage.setItem('ls_reg', JSON.stringify({
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || '',
      }));
      // Password is held in module memory — cleared after registration or on refresh
      pendingReg.setPassword(data.password);
      router.push('/auth/select-role');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex hover:opacity-90 transition-opacity">
            <Logo />
          </Link>
          <p className="mt-2 text-gray-500 text-sm">India's Sports Networking Platform</p>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {roleCopy ? roleCopy.heading : 'Create your account'}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {roleCopy ? roleCopy.sub : 'Join thousands of athletes, coaches and organisations'}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                {...register('fullName')}
                type="text"
                placeholder="Your full name"
                className="input-field"
                autoComplete="name"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="input-field"
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            {/* Phone — fixed +91 prefix, user types only the 10-digit number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+91</span>
                <input
                  {...register('phone')}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  className="input-field rounded-l-none"
                  autoComplete="tel"
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                  className="input-field pr-10"
                  autoComplete="new-password"
                  onChange={(e) => { setPasswordValue(e.target.value); }}
                  onBlur={(e) => { setPasswordValue(e.target.value); register('password').onBlur(e); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordValue.length > 0 && (() => {
                const { score, label, color } = getPasswordStrength(passwordValue);
                return (
                  <div className="mt-1.5">
                    <div className="flex gap-1 mb-0.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${score >= i ? color : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-500">Strength: <span className="font-medium">{label}</span></p>
                  </div>
                );
              })()}
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  className="input-field pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 accent-brand"
              />
              <span className="text-xs text-gray-500">
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Privacy Policy</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Please wait...' : 'Continue'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-sm"><span className="bg-white px-3 text-gray-400">or continue with</span></div>
          </div>

          <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/google`} className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"><div className="w-8 h-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
