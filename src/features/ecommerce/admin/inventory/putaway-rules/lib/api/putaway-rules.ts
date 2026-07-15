import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import {
  mockWarehouseLocationsStore,
  mockWarehousesStore,
} from '@/features/ecommerce/shared/lib/adapters/mock-inventory-store';
import type {
  CreatePutawayRuleInput,
  PutawayRule,
  PutawayRuleListQuery,
  UpdatePutawayRuleInput,
} from '@/features/ecommerce/domain/types/putaway-rule';
import putawaySeed from '@/features/ecommerce/shared/lib/mock/putaway-rules.json';

const repository = createMockRepository<PutawayRule>(putawaySeed as PutawayRule[]);

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const putawayRulesApi = {
  getAll(query: PutawayRuleListQuery) {
    return repository.list(
      query,
      (item, q) => {
        if (q.productId && item.productId !== q.productId) return false;
        if (q.categoryId && item.categoryId !== q.categoryId) return false;
        if (q.warehouseId && item.warehouseId !== q.warehouseId) return false;
        return true;
      },
      (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    );
  },

  getById(companyId: string, id: string) {
    return repository.getById(companyId, id);
  },

  create(input: CreatePutawayRuleInput) {
    const now = new Date().toISOString();
    return repository.create({
      ...input,
      id: newId('putaway'),
      createdAt: now,
      updatedAt: now,
    });
  },

  update(companyId: string, id: string, patch: UpdatePutawayRuleInput) {
    return repository.update(companyId, id, { ...patch, updatedAt: new Date().toISOString() });
  },

  remove(companyId: string, id: string) {
    return repository.remove(companyId, id);
  },

  async listLocationOptions(companyId: string) {
    const [warehouses, locations] = await Promise.all([
      mockWarehousesStore.list({ companyId, page: 1, limit: 200 }),
      mockWarehouseLocationsStore.list({ companyId, page: 1, limit: 500 }),
    ]);
    const warehouseMap = new Map(warehouses.items.map((w) => [w.id, w]));
    return locations.items
      .filter((location) => location.isActive)
      .map((location) => ({
        id: location.id,
        warehouseId: location.warehouseId,
        warehouseNameAr: warehouseMap.get(location.warehouseId)?.nameAr ?? location.warehouseId,
        nameAr: location.nameAr,
        code: location.code,
        storageCategory: location.storageCategory,
      }))
      .sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
  },
};
