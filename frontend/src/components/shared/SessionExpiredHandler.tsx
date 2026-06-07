'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SessionExpiredHandler() {
  const router = useRouter();

  useEffect(() => {
    const handle = () => {
      toast.error('Your session has expired. Please sign in again.');
      router.push('/auth/login');
    };
    window.addEventListener('auth:session-expired', handle);
    return () => window.removeEventListener('auth:session-expired', handle);
  }, [router]);

  return null;
}
