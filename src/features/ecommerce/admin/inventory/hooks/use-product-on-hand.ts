'use client';

import { useQuery } from '@tanstack/react-query';
import { locationStockApi } from '@/features/ecommerce/admin/orders/lib/api/location-stock';

export const locationStockQueryKeys = {
  root: (companyId: string) => [companyId, 'ecommerce', 'location-stock'] as const,
  onHand: (companyId: string, productId: string) =>
    [...locationStockQueryKeys.root(companyId), 'on-hand', productId] as const,
};

export function useProductOnHand(companyId: string | undefined, productId: string | undefined) {
  return useQuery({
    queryKey: locationStockQueryKeys.onHand(companyId ?? '', productId ?? ''),
    queryFn: () => locationStockApi.getOnHandByVariant(companyId!, productId!),
    enabled: Boolean(companyId && productId),
  });
}
