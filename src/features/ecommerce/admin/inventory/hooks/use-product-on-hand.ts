'use client';

import { useQuery } from '@tanstack/react-query';
import { locationStockApi } from '@/features/ecommerce/admin/orders/lib/api/location-stock';
import type { LocationStockListQuery } from '@/features/ecommerce/domain/types/location-stock';

export const locationStockQueryKeys = {
  root: (companyId: string) => [companyId, 'ecommerce', 'location-stock'] as const,
  onHand: (companyId: string, productId: string) =>
    [...locationStockQueryKeys.root(companyId), 'on-hand', productId] as const,
  list: (query: LocationStockListQuery) =>
    [...locationStockQueryKeys.root(query.companyId), 'list', query] as const,
};

export function useProductOnHand(companyId: string | undefined, productId: string | undefined) {
  return useQuery({
    queryKey: locationStockQueryKeys.onHand(companyId ?? '', productId ?? ''),
    queryFn: () => locationStockApi.getOnHandByVariant(companyId!, productId!),
    enabled: Boolean(companyId && productId),
  });
}

export function useLocationStockList(query: LocationStockListQuery) {
  return useQuery({
    queryKey: locationStockQueryKeys.list(query),
    queryFn: () => locationStockApi.list(query),
    enabled: Boolean(query.companyId),
  });
}
