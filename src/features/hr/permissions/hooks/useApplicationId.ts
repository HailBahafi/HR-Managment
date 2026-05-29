'use client';

import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '@/features/hr/permissions/lib/api/applications';

/**
 * Returns the id of the HR application from the backend.
 * Looks for the application whose code is 'hr' (case-insensitive).
 * Falls back to the first active application if none matches.
 */
export function useApplicationId(): string {
  const { data } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getAll({ limit: 50 }),
    staleTime: 60 * 60 * 1000, // applications rarely change
  });

  const items = data?.items ?? [];
  const hr = items.find((a) => a.code.toLowerCase() === 'hr' && a.isActive)
    ?? items.find((a) => a.isActive)
    ?? items[0];
  return hr?.id ?? '';
}
