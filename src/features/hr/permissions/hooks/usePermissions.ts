'use client';

import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '@/features/hr/permissions/lib/api/permissions';

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsApi.getAll({ limit: 500 }),
    staleTime: 30 * 60 * 1000,
  });
}
