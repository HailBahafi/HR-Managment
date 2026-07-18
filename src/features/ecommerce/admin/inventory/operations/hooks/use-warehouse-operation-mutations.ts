'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { warehouseOperationsApi } from '@/features/ecommerce/admin/inventory/operations/lib/api/warehouse-operations';
import { warehouseOperationsQueryKeys } from '@/features/ecommerce/admin/inventory/hooks/query-keys';
import type {
  CreateWarehouseOperationInput,
  UpdateWarehouseOperationInput,
  WarehouseOperationKind,
} from '@/features/ecommerce/domain/types/warehouse';

const SUCCESS_BY_KIND: Record<WarehouseOperationKind, string> = {
  issue: 'تم حفظ مستند الصرف',
  receipt: 'تم حفظ مستند الاستلام',
  internal: 'تم حفظ الحركة الداخلية',
};

export function useWarehouseOperationMutations(warehouseId: string, kind: WarehouseOperationKind) {
  const queryClient = useQueryClient();

  function invalidate(companyId: string) {
    void queryClient.invalidateQueries({
      queryKey: warehouseOperationsQueryKeys.root(companyId),
    });
  }

  const create = useMutation({
    mutationFn: (input: CreateWarehouseOperationInput) => warehouseOperationsApi.create(input),
    onSuccess: (_data, input) => {
      invalidate(input.companyId);
      toast.success(SUCCESS_BY_KIND[kind]);
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.warehouseOperations.create');
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
      patch: UpdateWarehouseOperationInput;
    }) => warehouseOperationsApi.update(companyId, id, patch),
    onSuccess: (_data, variables) => {
      invalidate(variables.companyId);
      void queryClient.invalidateQueries({
        queryKey: [variables.companyId, 'ecommerce', 'location-stock'],
      });
      void queryClient.invalidateQueries({
        queryKey: [variables.companyId, 'ecommerce', 'products'],
      });
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.warehouseOperations.update');
      toast.error(displayMessage);
    },
  });

  const remove = useMutation({
    mutationFn: ({ companyId, id }: { companyId: string; id: string }) =>
      warehouseOperationsApi.remove(companyId, id),
    onSuccess: (_data, variables) => {
      invalidate(variables.companyId);
      toast.success('تم حذف المستند');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.warehouseOperations.delete');
      toast.error(displayMessage);
    },
  });

  return { create, update, remove };
}
