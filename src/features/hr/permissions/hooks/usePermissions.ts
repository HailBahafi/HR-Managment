'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import { permissionsApi, type PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';

function hasAuthToken(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith('access_token='));
}

/** Keeps HR catalog from GET /permissions; ignores a mismatched application hint. */
export function scopeToHrApplication(all: PermissionResponseDto[], applicationIdHint?: string) {
  let items = all.filter((p) => p.code.toLowerCase().startsWith('hr.'));
  if (items.length === 0 && all.length > 0) {
    items = all;
  }

  if (applicationIdHint) {
    const scoped = items.filter((p) => p.applicationId === applicationIdHint);
    if (scoped.length > 0) items = scoped;
  }

  const resolvedApplicationId =
    items.find((p) => p.code.toLowerCase().startsWith('hr.'))?.applicationId ??
    items[0]?.applicationId ??
    applicationIdHint ??
    '';

  return { items, resolvedApplicationId };
}

/** Fetches GET /permissions and scopes results to the HR application. */
export function usePermissions(applicationIdHint?: string) {
  const query = useQuery({
    queryKey: ['permissions', { limit: 500 }],
    queryFn: async () =>
      ensurePaginatedResult(await permissionsApi.getAll({ limit: 500 })),
    staleTime: 30 * 60 * 1000,
    enabled: hasAuthToken(),
  });

  const catalog = React.useMemo(
    () => scopeToHrApplication(query.data?.items ?? [], applicationIdHint || undefined),
    [query.data, applicationIdHint],
  );

  return {
    ...query,
    data: query.data
      ? {
          ...query.data,
          items: catalog.items,
          applicationId: catalog.resolvedApplicationId,
        }
      : undefined,
  };
}
