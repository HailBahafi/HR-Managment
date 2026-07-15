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

export const locationStockApi = {
  async list(query: LocationStockListQuery): Promise<LocationStock[]> {
    const result = await repository.list(
      { companyId: query.companyId, page: 1, limit: 500 },
      (item, q) => {
        if (query.productId && item.productId !== query.productId) return false;
        if (query.warehouseId && item.warehouseId !== query.warehouseId) return false;
        if (query.locationId && item.locationId !== query.locationId) return false;
        return item.companyId === q.companyId;
      },
    );
    return result.items;
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

  async deduct(companyId: string, locationId: string, productId: string, quantity: number): Promise<void> {
    const stocks = await this.list({ companyId, productId, locationId });
    const stock = stocks[0];
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
