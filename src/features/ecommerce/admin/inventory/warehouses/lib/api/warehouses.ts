import {
  mockWarehouseLocationsStore,
  mockWarehousesStore,
} from '@/features/ecommerce/shared/lib/adapters/mock-inventory-store';
import { buildDefaultWarehouseLocations } from '@/features/ecommerce/admin/inventory/warehouses/lib/default-warehouse-locations';
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
  async create(input: CreateWarehouseInput) {
    const now = new Date().toISOString();
    const warehouse = await mockWarehousesStore.create({
      ...input,
      id: newId('wh'),
      createdAt: now,
      updatedAt: now,
    });

    const defaults = buildDefaultWarehouseLocations(warehouse);
    await Promise.all(
      defaults.map((location) =>
        mockWarehouseLocationsStore.create({
          ...location,
          id: newId('loc'),
          createdAt: now,
          updatedAt: now,
        }),
      ),
    );

    return warehouse;
  },
  update(companyId, id, patch: UpdateWarehouseInput) {
    return mockWarehousesStore.update(companyId, id, { ...patch, updatedAt: new Date().toISOString() });
  },
  remove(companyId, id) {
    return mockWarehousesStore.remove(companyId, id);
  },
};
