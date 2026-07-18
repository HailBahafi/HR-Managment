import { mockWarehouseOperationsStore } from '@/features/ecommerce/shared/lib/adapters/mock-inventory-store';
import type {
  CreateWarehouseOperationInput,
  UpdateWarehouseOperationInput,
  WarehouseOperation,
  WarehouseOperationListQuery,
} from '@/features/ecommerce/domain/types/warehouse';
import type { AdminWarehouseOperationsPort } from '@/features/ecommerce/domain/ports/inventory.ports';

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeOperation(item: WarehouseOperation): WarehouseOperation {
  const status = (item.status as string) === 'posted' ? 'done' : item.status;
  return {
    ...item,
    status,
    lines: item.lines.map((line) => ({
      ...line,
      demandQuantity: line.demandQuantity ?? line.quantity,
      quantity: line.quantity,
    })),
  };
}

export const warehouseOperationsApi: AdminWarehouseOperationsPort = {
  getAll(query: WarehouseOperationListQuery) {
    return mockWarehouseOperationsStore
      .list(
        query,
        (item, q) => {
          if (q.warehouseId && item.warehouseId !== q.warehouseId) return false;
          if (q.kind && item.kind !== q.kind) return false;
          if (q.productId && !item.lines.some((line) => line.productId === q.productId)) return false;
          if (!q.search) return true;
          const search = q.search.toLowerCase();
          return (
            item.reference.toLowerCase().includes(search) ||
            (item.notes?.toLowerCase().includes(search) ?? false) ||
            item.lines.some(
              (line) =>
                line.productName.toLowerCase().includes(search) ||
                (line.sku?.toLowerCase().includes(search) ?? false),
            )
          );
        },
        (a, b) => b.occurredAt.localeCompare(a.occurredAt),
      )
      .then((page) => ({
        ...page,
        items: page.items.map(normalizeOperation),
      }));
  },
  getById(companyId, id) {
    return mockWarehouseOperationsStore.getById(companyId, id).then((item) =>
      item ? normalizeOperation(item) : null,
    );
  },
  create(input: CreateWarehouseOperationInput) {
    const now = new Date().toISOString();
    return mockWarehouseOperationsStore
      .create({
        ...input,
        lines: input.lines.map((line) => ({
          ...line,
          demandQuantity: line.demandQuantity ?? line.quantity,
        })),
        id: newId('op'),
        createdAt: now,
        updatedAt: now,
      })
      .then(normalizeOperation);
  },
  update(companyId, id, patch: UpdateWarehouseOperationInput) {
    return mockWarehouseOperationsStore
      .update(companyId, id, { ...patch, updatedAt: new Date().toISOString() })
      .then((item) => (item ? normalizeOperation(item) : null));
  },
  remove(companyId, id) {
    return mockWarehouseOperationsStore.remove(companyId, id);
  },
};
