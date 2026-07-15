import type {
  WarehouseListQuery,
  WarehouseLocationListQuery,
  WarehouseOperationKind,
  WarehouseOperationListQuery,
} from '@/features/ecommerce/domain/types/warehouse';

export const warehousesQueryKeys = {
  all: (companyId: string) => [companyId, 'ecommerce', 'warehouses'] as const,
  list: (query: WarehouseListQuery) => [...warehousesQueryKeys.all(query.companyId), 'list', query] as const,
  detail: (companyId: string, id: string) => [...warehousesQueryKeys.all(companyId), 'detail', id] as const,
};

export const warehouseLocationsQueryKeys = {
  all: (companyId: string) => [companyId, 'ecommerce', 'warehouse-locations'] as const,
  list: (query: WarehouseLocationListQuery) =>
    [...warehouseLocationsQueryKeys.all(query.companyId), 'list', query] as const,
};

export const warehouseOperationsQueryKeys = {
  all: (companyId: string, warehouseId: string, kind: WarehouseOperationKind) =>
    [companyId, 'ecommerce', 'warehouse-operations', warehouseId, kind] as const,
  list: (query: WarehouseOperationListQuery) =>
    [...warehouseOperationsQueryKeys.all(query.companyId, query.warehouseId, query.kind), 'list', query] as const,
};
