import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import type { Order, OrderListQuery, UpdateOrderStatusInput } from '@/features/ecommerce/domain/types/order';
import ordersSeed from '@/features/ecommerce/shared/lib/mock/orders.json';

const repository = createMockRepository<Order>(ordersSeed as Order[]);

export const ordersApi = {
  getAll(query: OrderListQuery): Promise<PaginatedResult<Order>> {
    return repository.list(query, (item, q) => {
      if (q.status && item.status !== q.status) return false;
      if (q.customerId && item.customerId !== q.customerId) return false;
      if (q.search) return item.orderNumber.toLowerCase().includes(q.search.toLowerCase());
      return true;
    });
  },
  getById(companyId: string, id: string) {
    return repository.getById(companyId, id);
  },
  updateStatus(companyId: string, id: string, input: UpdateOrderStatusInput) {
    return repository.update(companyId, id, { ...input, updatedAt: new Date().toISOString() });
  },
};
