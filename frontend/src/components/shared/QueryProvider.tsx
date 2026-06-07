'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider as ReactQueryProvider } from 'react-query';

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
    },
  }));

  return <ReactQueryProvider client={queryClient}>{children}</ReactQueryProvider>;
}
