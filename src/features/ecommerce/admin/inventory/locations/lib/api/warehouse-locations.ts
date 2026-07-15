import { mockWarehouseLocationsStore } from '@/features/ecommerce/shared/lib/adapters/mock-inventory-store';
import type {
  CreateWarehouseLocationInput,
  UpdateWarehouseLocationInput,
  WarehouseLocationListQuery,
} from '@/features/ecommerce/domain/types/warehouse';
import type { AdminWarehouseLocationsPort } from '@/features/ecommerce/domain/ports/inventory.ports';

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const warehouseLocationsApi: AdminWarehouseLocationsPort = {
  getAll(query: WarehouseLocationListQuery) {
    return mockWarehouseLocationsStore.list(query, (item, q) => {
      if (item.warehouseId !== q.warehouseId) return false;
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
    return mockWarehouseLocationsStore.getById(companyId, id);
  },
  create(input: CreateWarehouseLocationInput) {
    const now = new Date().toISOString();
    return mockWarehouseLocationsStore.create({
      ...input,
      id: newId('loc'),
      createdAt: now,
      updatedAt: now,
    });
  },
  update(companyId, id, patch: UpdateWarehouseLocationInput) {
    return mockWarehouseLocationsStore.update(companyId, id, { ...patch, updatedAt: new Date().toISOString() });
  },
  remove(companyId, id) {
    return mockWarehouseLocationsStore.remove(companyId, id);
  },
};
