import type { TenantScoped } from '@/features/ecommerce/domain/types/common';

/** On-hand quantity of a product (or variant) at a specific warehouse location. */
export type LocationStock = TenantScoped & {
  id: string;
  productId: string;
  /** When set, stock is tracked per sellable variant (aligns with storefront). */
  variantId?: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
  updatedAt: string;
};

/** Aggregated availability row for order fulfillment UI. */
export type StockAvailabilityRow = {
  warehouseId: string;
  warehouseNameAr: string;
  locationId: string;
  locationNameAr: string;
  quantity: number;
};

export type LocationStockListQuery = {
  companyId: string;
  productId?: string;
  variantId?: string;
  warehouseId?: string;
  locationId?: string;
};
