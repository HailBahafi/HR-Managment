import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/features/ecommerce/admin/orders/lib/api/orders';
import type { OrderListQuery } from '@/features/ecommerce/domain/types/order';

export const ordersQueryKeys = {
  all: ['ecommerce', 'orders'] as const,
  list: (query: OrderListQuery) => [...ordersQueryKeys.all, 'list', query] as const,
};

export function useOrders(query: OrderListQuery) {
  return useQuery({
    queryKey: ordersQueryKeys.list(query),
    queryFn: () => ordersApi.getAll(query),
    enabled: Boolean(query.companyId),
  });
}
