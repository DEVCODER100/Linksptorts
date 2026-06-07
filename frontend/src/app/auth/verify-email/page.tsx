'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { Trophy, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Please enter the 6-digit OTP'); return; }
    setIsLoading(true);
    try {
      await authAPI.verifyEmail({ email, otp });
      toast.success('Email verified! Please log in.');
      router.push('/auth/login');
    } catch (error: unknown) {
      const err = (error as { response?: { data?: { error?: { message?: string; code?: string } } } })?.response?.data?.error;
      if (err?.code === 'ALREADY_VERIFIED') {
        toast.success('Your email is already verified. Please log in.');
        router.push('/auth/login');
        return;
      }
      toast.error(err?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authAPI.resendOtp(email);
      toast.success('OTP resent to your email');
    } catch (error: unknown) {
      const err = (error as { response?: { data?: { error?: { message?: string; code?: string } } } })?.response?.data?.error;
      if (err?.code === 'ALREADY_VERIFIED') {
        toast.success('Your email is already verified. Please log in.');
        router.push('/auth/login');
        return;
      }
      toast.error(err?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-brand">LinkSports</span>
          </Link>
        </div>
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-500 text-sm mb-6">
            We sent a 6-digit OTP to <strong>{email}</strong>. Enter it below to verify your account.
          </p>
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="input-field text-center text-2xl font-bold tracking-[0.5em] py-4"
              maxLength={6}
              autoFocus
            />
            <button type="submit" disabled={isLoading || otp.length !== 6} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-4">
            Didn&apos;t receive it?{' '}
            <button onClick={handleResend} disabled={isResending} className="text-brand hover:underline font-medium disabled:opacity-50">
              {isResending ? 'Sending...' : 'Resend OTP'}
            </button>
          </p>
          <Link href="/auth/login" className="text-sm text-gray-400 hover:text-gray-600 block mt-3">← Back to login</Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
