'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

// Shows "Go to Dashboard" when the visitor is already logged in, otherwise the
// usual Login + Join Free buttons. Checks a stored token too (not just the store)
// so a returning visitor sees the right CTA immediately on a fresh load.
export default function AuthCTA({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { isAuthenticated, user } = useAuthStore();
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    setHasToken(
      typeof window !== 'undefined' &&
      (!!localStorage.getItem('accessToken') || !!localStorage.getItem('refreshToken'))
    );
  }, []);

  const loggedIn = isAuthenticated || hasToken;
  const dashHref = user?.role === 'admin' ? '/admin' : '/dashboard';

  if (loggedIn) {
    return mobile ? (
      <Link href={dashHref} onClick={onNavigate} className="block px-3 py-2 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-dark text-center">
        Go to Dashboard →
      </Link>
    ) : (
      <Link href={dashHref} className="btn-primary text-sm px-4 py-2 whitespace-nowrap">Go to Dashboard →</Link>
    );
  }

  return mobile ? (
    <>
      <Link href="/auth/login" onClick={onNavigate} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Login</Link>
      <Link href="/auth/register" onClick={onNavigate} className="block px-3 py-2 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-dark text-center">Join Free</Link>
    </>
  ) : (
    <>
      <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-2 sm:px-4 py-2">Login</Link>
      <Link href="/auth/register" className="btn-primary text-sm whitespace-nowrap">Join Free →</Link>
    </>
  );
}
