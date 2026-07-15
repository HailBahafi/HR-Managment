import type { TenantScoped } from '@/features/ecommerce/domain/types/common';

export type WarehouseStatus = 'active' | 'inactive';

export type Warehouse = TenantScoped & {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  address?: string;
  status: WarehouseStatus;
  createdAt: string;
  updatedAt: string;
};

export type WarehouseListQuery = {
  companyId: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateWarehouseInput = Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWarehouseInput = Partial<CreateWarehouseInput>;

export type WarehouseLocation = TenantScoped & {
  id: string;
  warehouseId: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  aisle?: string;
  rack?: string;
  bin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WarehouseLocationListQuery = {
  companyId: string;
  warehouseId: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateWarehouseLocationInput = Omit<WarehouseLocation, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWarehouseLocationInput = Partial<CreateWarehouseLocationInput>;

/** صرف | استلام | حركات داخلية */
export type WarehouseOperationKind = 'issue' | 'receipt' | 'internal';

export type WarehouseOperationStatus = 'draft' | 'posted' | 'cancelled';

export type WarehouseOperationLine = {
  id: string;
  productName: string;
  sku?: string;
  quantity: number;
  fromLocationId?: string;
  toLocationId?: string;
  notes?: string;
};

export type WarehouseOperation = TenantScoped & {
  id: string;
  warehouseId: string;
  kind: WarehouseOperationKind;
  reference: string;
  status: WarehouseOperationStatus;
  occurredAt: string;
  notes?: string;
  lines: WarehouseOperationLine[];
  createdAt: string;
  updatedAt: string;
};

export type WarehouseOperationListQuery = {
  companyId: string;
  warehouseId: string;
  kind: WarehouseOperationKind;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateWarehouseOperationInput = Omit<WarehouseOperation, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWarehouseOperationInput = Partial<CreateWarehouseOperationInput>;
