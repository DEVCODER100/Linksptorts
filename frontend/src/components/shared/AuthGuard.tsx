'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: string[];
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function AuthGuard({ children, roles, allowedRoles, redirectTo = '/auth/login' }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, fetchMe } = useAuthStore();
  const permittedRoles = roles || allowedRoles;

  const checkAuth = useCallback(() => {
    if (!isAuthenticated && !isLoading) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (token) {
        fetchMe();
      } else {
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        router.replace(`${redirectTo}?redirect=${encodeURIComponent(path)}`);
      }
    }
  }, [isAuthenticated, isLoading, fetchMe, router, redirectTo]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && permittedRoles && user && !permittedRoles.includes(user.role)) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, user, permittedRoles, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return <>{children}</>;
}
