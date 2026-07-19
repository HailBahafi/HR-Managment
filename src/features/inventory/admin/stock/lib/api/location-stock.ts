import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import {
  mockWarehouseLocationsStore,
  mockWarehousesStore,
} from '@/features/ecommerce/shared/lib/adapters/mock-inventory-store';
import type {
  LocationStock,
  LocationStockListQuery,
  StockAvailabilityRow,
} from '@/features/ecommerce/domain/types/location-stock';
import locationStockSeed from '@/features/ecommerce/shared/lib/mock/location-stock.json';

const repository = createMockRepository<LocationStock>(locationStockSeed as LocationStock[]);

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 120));
}

function newId() {
  return `ls-${Math.random().toString(36).slice(2, 10)}`;
}

export type LocationStockAdjustInput = {
  companyId: string;
  productId: string;
  variantId?: string;
  warehouseId: string;
  locationId: string;
  /** Positive = increase, negative = decrease */
  delta: number;
};

export const locationStockApi = {
  async list(query: LocationStockListQuery): Promise<LocationStock[]> {
    const result = await repository.list(
      { companyId: query.companyId, page: 1, limit: 500 },
      (item, q) => {
        if (query.productId && item.productId !== query.productId) return false;
        if (query.variantId !== undefined) {
          if (query.variantId === '') {
            if (item.variantId) return false;
          } else if (item.variantId !== query.variantId) {
            return false;
          }
        }
        if (query.warehouseId && item.warehouseId !== query.warehouseId) return false;
        if (query.locationId && item.locationId !== query.locationId) return false;
        return item.companyId === q.companyId;
      },
    );
    return result.items;
  },

  /** On-hand qty at internal warehouse locations only. */
  async getOnHandTotal(
    companyId: string,
    productId: string,
    options?: { variantId?: string },
  ): Promise<number> {
    const [stocks, locations] = await Promise.all([
      this.list({
        companyId,
        productId,
        ...(options?.variantId !== undefined ? { variantId: options.variantId } : {}),
      }),
      mockWarehouseLocationsStore.list({ companyId, page: 1, limit: 500 }),
    ]);
    const internalIds = new Set(
      locations.items.filter((location) => location.locationType === 'internal').map((l) => l.id),
    );
    return stocks
      .filter((row) => internalIds.has(row.locationId))
      .reduce((sum, row) => sum + row.quantity, 0);
  },

  /** Totals keyed by variantId (empty string = product-level / no variant). */
  async getOnHandByVariant(
    companyId: string,
    productId: string,
  ): Promise<{ total: number; byVariant: Record<string, number> }> {
    const [stocks, locations] = await Promise.all([
      this.list({ companyId, productId }),
      mockWarehouseLocationsStore.list({ companyId, page: 1, limit: 500 }),
    ]);
    const internalIds = new Set(
      locations.items.filter((location) => location.locationType === 'internal').map((l) => l.id),
    );
    const byVariant: Record<string, number> = {};
    let total = 0;
    for (const row of stocks) {
      if (!internalIds.has(row.locationId)) continue;
      const key = row.variantId ?? '';
      byVariant[key] = (byVariant[key] ?? 0) + row.quantity;
      total += row.quantity;
    }
    return { total, byVariant };
  },

  async getAvailability(companyId: string, productId: string): Promise<StockAvailabilityRow[]> {
    const [stocks, warehouses, locations] = await Promise.all([
      this.list({ companyId, productId }),
      mockWarehousesStore.list({ companyId, page: 1, limit: 200 }),
      mockWarehouseLocationsStore.list({ companyId, page: 1, limit: 500 }),
    ]);

    const warehouseMap = new Map(warehouses.items.map((w) => [w.id, w]));
    const locationMap = new Map(locations.items.map((l) => [l.id, l]));

    return stocks
      .filter((row) => row.quantity > 0)
      .map((row) => {
        const warehouse = warehouseMap.get(row.warehouseId);
        const location = locationMap.get(row.locationId);
        return {
          warehouseId: row.warehouseId,
          warehouseNameAr: warehouse?.nameAr ?? row.warehouseId,
          locationId: row.locationId,
          locationNameAr: location?.nameAr ?? row.locationId,
          quantity: row.quantity,
        };
      })
      .sort((a, b) => b.quantity - a.quantity);
  },

  async adjust(input: LocationStockAdjustInput): Promise<LocationStock> {
    const stocks = await this.list({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      variantId: input.variantId ?? '',
    });
    const existing = stocks.find((row) =>
      input.variantId ? row.variantId === input.variantId : !row.variantId,
    );
    const nextQty = (existing?.quantity ?? 0) + input.delta;
    if (nextQty < 0) {
      throw new Error('الكمية في الموقع غير كافية لإتمام الحركة.');
    }
    const now = new Date().toISOString();
    if (existing) {
      const updated = await repository.update(input.companyId, existing.id, {
        quantity: nextQty,
        updatedAt: now,
      });
      if (!updated) throw new Error('تعذر تحديث مخزون الموقع.');
      return updated;
    }
    return repository.create({
      id: newId(),
      companyId: input.companyId,
      productId: input.productId,
      variantId: input.variantId,
      warehouseId: input.warehouseId,
      locationId: input.locationId,
      quantity: nextQty,
      updatedAt: now,
    });
  },

  async deduct(companyId: string, locationId: string, productId: string, quantity: number): Promise<void> {
    const stocks = await this.list({ companyId, productId, locationId, variantId: '' });
    const stock = stocks.find((row) => !row.variantId) ?? stocks[0];
    if (!stock) {
      throw new Error('لا توجد كمية في الموقع المحدد.');
    }
    if (stock.quantity < quantity) {
      throw new Error('الكمية في الموقع غير كافية.');
    }
    await repository.update(companyId, stock.id, {
      quantity: stock.quantity - quantity,
      updatedAt: new Date().toISOString(),
    });
    await delay(undefined);
  },
};
