'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';
import { Trophy, Eye, EyeOff, Loader2, Phone, Mail } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, setAccessToken, fetchMe } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Phone OTP login state
  const [mode, setMode] = useState<'password' | 'phone'>('password');
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setPhoneLoading(true);
    setApiError('');
    try {
      await authAPI.sendPhoneOtp(digits);
      setOtpSent(true);
      toast.success('OTP sent! Check your phone (or server console in dev).');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to send OTP';
      setApiError(msg);
      toast.error(msg);
    } finally {
      setPhoneLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!phoneOtp.trim()) {
      toast.error('Enter the OTP');
      return;
    }
    setPhoneLoading(true);
    setApiError('');
    try {
      const digits = phone.replace(/\D/g, '').slice(-10);
      const res = await authAPI.loginWithPhone({ phone: digits, otp: phoneOtp.trim() });
      const { accessToken } = res.data.data;
      setAccessToken(accessToken);
      await fetchMe();
      toast.success('Welcome back!');
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Phone login failed';
      setApiError(msg);
      toast.error(msg);
    } finally {
      setPhoneLoading(false);
    }
  };

  // Handle Google OAuth redirect — token arrives as ?token=xxx
  useEffect(() => {
    const token = searchParams.get('token');
    const newUser = searchParams.get('newUser');
    if (token) {
      setAccessToken(token);
      if (newUser === 'true') {
        // Fetch user so isAuthenticated is set before role selection page loads
        fetchMe().finally(() => router.replace('/auth/google-select-role'));
      } else {
        fetchMe().then(() => router.replace('/dashboard'));
      }
    }
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setApiError('');
    try {
      await login(data.identifier, data.password);
      toast.success('Welcome back!');
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Login failed';
      if (msg.includes('verify')) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(data.identifier)}`);
      }
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex hover:opacity-90 transition-opacity">
            <Logo />
          </Link>
          <p className="mt-2 text-gray-500 text-sm">India's Sports Networking Platform</p>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-6">Sign in to your account to continue</p>

          {/* Login mode toggle */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => { setMode('password'); setApiError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'password' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Mail className="w-4 h-4" /> Password
            </button>
            <button
              type="button"
              onClick={() => { setMode('phone'); setApiError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'phone' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Phone className="w-4 h-4" /> Phone OTP
            </button>
          </div>

          {mode === 'phone' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    disabled={otpSent}
                    className="input-field rounded-l-none"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    placeholder="6-digit code"
                    className="input-field tracking-widest text-center"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={phoneLoading}
                    className="mt-2 text-xs text-brand hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={otpSent ? handlePhoneLogin : handleSendOtp}
                disabled={phoneLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {phoneLoading ? 'Please wait...' : otpSent ? 'Verify & Sign In' : 'Send OTP'}
              </button>

              {otpSent && (
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setPhoneOtp(''); setApiError(''); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Change phone number
                </button>
              )}

              {apiError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{apiError}</span>
                </div>
              )}
            </div>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
              <input
                {...register('identifier')}
                type="text"
                placeholder="Email or @username"
                className="input-field"
                autoComplete="username"
              />
              {errors.identifier && <p className="mt-1 text-xs text-red-600">{errors.identifier.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-brand hover:underline">Forgot password?</Link>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            {apiError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <span className="mt-0.5 flex-shrink-0">⚠</span>
                <span>{apiError}</span>
              </div>
            )}
          </form>
          )}

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
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-brand font-medium hover:underline">Join free</Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
