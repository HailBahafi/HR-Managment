import { useQuery } from '@tanstack/react-query';
import { warehouseLocationsApi } from '@/features/ecommerce/admin/inventory/locations/lib/api/warehouse-locations';
import { warehouseLocationsQueryKeys } from '@/features/ecommerce/admin/inventory/hooks/query-keys';
import type { WarehouseLocationListQuery } from '@/features/ecommerce/domain/types/warehouse';

export function useWarehouseLocations(query: WarehouseLocationListQuery) {
  return useQuery({
    queryKey: warehouseLocationsQueryKeys.list(query),
    queryFn: () => warehouseLocationsApi.getAll(query),
    enabled: Boolean(query.companyId),
  });
}
