'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { warehouseLocationsApi } from '@/features/ecommerce/admin/inventory/locations/lib/api/warehouse-locations';
import { warehouseLocationsQueryKeys } from '@/features/ecommerce/admin/inventory/hooks/query-keys';
import type {
  CreateWarehouseLocationInput,
  UpdateWarehouseLocationInput,
} from '@/features/ecommerce/domain/types/warehouse';

export function useWarehouseLocationMutations(warehouseId: string) {
  const queryClient = useQueryClient();

  function invalidate(companyId: string) {
    void queryClient.invalidateQueries({
      queryKey: warehouseLocationsQueryKeys.all(companyId, warehouseId),
    });
  }

  const create = useMutation({
    mutationFn: (input: CreateWarehouseLocationInput) => warehouseLocationsApi.create(input),
    onSuccess: (_data, input) => {
      invalidate(input.companyId);
      toast.success('تم إضافة الموقع بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.warehouseLocations.create');
      toast.error(displayMessage);
    },
  });

  const update = useMutation({
    mutationFn: ({
      companyId,
      id,
      patch,
    }: {
      companyId: string;
      id: string;
      patch: UpdateWarehouseLocationInput;
    }) => warehouseLocationsApi.update(companyId, id, patch),
    onSuccess: (_data, variables) => {
      invalidate(variables.companyId);
      toast.success('تم تحديث الموقع بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.warehouseLocations.update');
      toast.error(displayMessage);
    },
  });

  const remove = useMutation({
    mutationFn: ({ companyId, id }: { companyId: string; id: string }) =>
      warehouseLocationsApi.remove(companyId, id),
    onSuccess: (_data, variables) => {
      invalidate(variables.companyId);
      toast.success('تم حذف الموقع بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.warehouseLocations.delete');
      toast.error(displayMessage);
    },
  });

  return { create, update, remove };
}
