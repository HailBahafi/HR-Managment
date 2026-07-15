/**
 * In-memory inventory stores for Admin warehouses module.
 * HTTP cutover: replace adapters with Admin API clients.
 */
import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import type {
  Warehouse,
  WarehouseLocation,
  WarehouseOperation,
} from '@/features/ecommerce/domain/types/warehouse';
import warehousesSeed from '@/features/ecommerce/shared/lib/mock/warehouses.json';
import locationsSeed from '@/features/ecommerce/shared/lib/mock/warehouse-locations.json';
import operationsSeed from '@/features/ecommerce/shared/lib/mock/warehouse-operations.json';

export const mockWarehousesStore = createMockRepository<Warehouse>(warehousesSeed as Warehouse[]);
export const mockWarehouseLocationsStore = createMockRepository<WarehouseLocation>(
  locationsSeed as WarehouseLocation[],
);
export const mockWarehouseOperationsStore = createMockRepository<WarehouseOperation>(
  operationsSeed as WarehouseOperation[],
);
