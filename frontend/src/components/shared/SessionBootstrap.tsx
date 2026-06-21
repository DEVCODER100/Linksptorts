'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

// Restores the session on every page load / new tab. If a token exists in
// localStorage (shared across tabs), fetchMe() validates it — and the API
// interceptor silently refreshes an expired access token via the 30-day refresh
// token — so the user stays logged in without re-entering credentials.
export default function SessionBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasToken = !!localStorage.getItem('accessToken') || !!localStorage.getItem('refreshToken');
    if (hasToken) useAuthStore.getState().fetchMe();
  }, []);
  return null;
}
