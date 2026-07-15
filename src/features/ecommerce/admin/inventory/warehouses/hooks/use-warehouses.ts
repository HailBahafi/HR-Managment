import { useQuery } from '@tanstack/react-query';
import { warehousesApi } from '@/features/ecommerce/admin/inventory/warehouses/lib/api/warehouses';
import { warehousesQueryKeys } from '@/features/ecommerce/admin/inventory/hooks/query-keys';
import type { WarehouseListQuery } from '@/features/ecommerce/domain/types/warehouse';

export function useWarehouses(query: WarehouseListQuery) {
  return useQuery({
    queryKey: warehousesQueryKeys.list(query),
    queryFn: () => warehousesApi.getAll(query),
    enabled: Boolean(query.companyId),
  });
}

export function useWarehouse(companyId: string, warehouseId: string) {
  return useQuery({
    queryKey: warehousesQueryKeys.detail(companyId, warehouseId),
    queryFn: () => warehousesApi.getById(companyId, warehouseId),
    enabled: Boolean(companyId && warehouseId),
  });
}
