'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authAPI.forgotPassword(email);
      toast.success('OTP sent to your email');
      setStep('reset');
    } catch { toast.error('Failed to send OTP'); }
    finally { setIsLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(newPassword)) { toast.error('Password must contain at least one uppercase letter'); return; }
    if (!/[0-9]/.test(newPassword)) { toast.error('Password must contain at least one number'); return; }
    if (!/[^a-zA-Z0-9]/.test(newPassword)) { toast.error('Password must contain at least one special character'); return; }
    setIsLoading(true);
    try {
      await authAPI.resetPassword({ email, otp, newPassword });
      toast.success('Password reset successfully!');
      router.push('/auth/login');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Reset failed';
      toast.error(msg);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex hover:opacity-90 transition-opacity">
            <Logo />
          </Link>
          <p className="mt-2 text-gray-500 text-sm">India's Sports Networking Platform</p>
        </div>
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {step === 'email' ? 'Forgot password?' : 'Reset password'}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {step === 'email' ? "Enter your email and we'll send a reset OTP." : `Enter the OTP sent to ${email}`}
          </p>

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" required />
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit OTP" className="input-field text-center text-xl tracking-widest" maxLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special" className="input-field pr-10" required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Reset Password
              </button>
            </form>
          )}

          <Link href="/auth/login" className="text-sm text-gray-400 hover:text-gray-600 block text-center mt-4">← Back to login</Link>
        </div>
      </div>
    </div>
  );
}
