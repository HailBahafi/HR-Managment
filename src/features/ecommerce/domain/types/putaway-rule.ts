import type { TenantScoped } from '@/features/ecommerce/domain/types/common';
import type { PackagingType } from '@/features/ecommerce/domain/types/product';

/**
 * Putaway rule: when a product arrives at a location, store it in a destination (optionally sub-location).
 * Mirrors Odoo-style inventory putaway configuration.
 */
export type PutawayRule = TenantScoped & {
  id: string;
  warehouseId: string;
  /** Trigger / arrival location */
  arriveLocationId: string;
  productId?: string | null;
  categoryId?: string | null;
  packagingType?: PackagingType | null;
  /** Destination location */
  storeLocationId: string;
  subLocationId?: string | null;
  /** Optional storage category filter on destination */
  storageCategory?: string;
  createdAt: string;
  updatedAt: string;
};

export type PutawayRuleListQuery = {
  companyId: string;
  search?: string;
  productId?: string;
  categoryId?: string;
  warehouseId?: string;
  page?: number;
  limit?: number;
};

export type CreatePutawayRuleInput = Omit<PutawayRule, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePutawayRuleInput = Partial<CreatePutawayRuleInput>;
