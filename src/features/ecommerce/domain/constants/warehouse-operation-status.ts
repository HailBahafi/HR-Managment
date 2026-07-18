import type {
  WarehouseOperationKind,
  WarehouseOperationStatus,
} from '@/features/ecommerce/domain/types/warehouse';

export const WAREHOUSE_OPERATION_STATUS_LABELS_AR: Record<WarehouseOperationStatus, string> = {
  draft: 'مسودة',
  ready: 'جاهز',
  done: 'منتهي',
  cancelled: 'ملغى',
};

/** Workflow steps shown in the picking header (excludes cancelled). */
export const WAREHOUSE_OPERATION_FLOW_STEPS: WarehouseOperationStatus[] = ['draft', 'ready', 'done'];

export const WAREHOUSE_OPERATION_KIND_LABELS_AR: Record<WarehouseOperationKind, string> = {
  receipt: 'الإيصالات',
  issue: 'الصرف',
  internal: 'حركات داخلية',
};
