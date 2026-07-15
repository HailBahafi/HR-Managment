import { mockWarehousesStore } from '@/features/ecommerce/shared/lib/adapters/mock-inventory-store';
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  WarehouseListQuery,
} from '@/features/ecommerce/domain/types/warehouse';
import type { AdminWarehousesPort } from '@/features/ecommerce/domain/ports/inventory.ports';

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const warehousesApi: AdminWarehousesPort = {
  getAll(query: WarehouseListQuery) {
    return mockWarehousesStore.list(query, (item, q) => {
      if (!q.search) return true;
      const search = q.search.toLowerCase();
      return (
        item.nameAr.toLowerCase().includes(search) ||
        item.code.toLowerCase().includes(search) ||
        (item.nameEn?.toLowerCase().includes(search) ?? false)
      );
    });
  },
  getById(companyId, id) {
    return mockWarehousesStore.getById(companyId, id);
  },
  create(input: CreateWarehouseInput) {
    const now = new Date().toISOString();
    return mockWarehousesStore.create({
      ...input,
      id: newId('wh'),
      createdAt: now,
      updatedAt: now,
    });
  },
  update(companyId, id, patch: UpdateWarehouseInput) {
    return mockWarehousesStore.update(companyId, id, { ...patch, updatedAt: new Date().toISOString() });
  },
  remove(companyId, id) {
    return mockWarehousesStore.remove(companyId, id);
  },
};
