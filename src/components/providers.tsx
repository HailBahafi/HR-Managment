'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHRContractsStore } from '@/lib/contracts/contracts-store';

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    void useHRContractsStore.persist.rehydrate();
  }, []);

  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
