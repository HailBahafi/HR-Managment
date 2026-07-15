import type { Inventory, MediaItem, Money, SeoFields, Slugged, TenantScoped } from '@/features/ecommerce/domain/types/common';
import type { ProductStatus } from '@/features/ecommerce/domain/constants/product-status';
import type { StockStatus } from '@/features/ecommerce/domain/constants/stock-status';

export type { ProductStatus, StockStatus };

/** Odoo-style product type. */
export type ProductType = 'goods' | 'service' | 'combo';

/** Inventory tracking mode (lot / serial deferred for warehouse ops linkage). */
export type ProductTracking = 'none' | 'lot' | 'serial';

export type ProductPriceLine = {
  id: string;
  priceList: string;
  minQty: number;
  packaging?: string;
  unitPrice: number;
};

export type ProductPurchaseLine = {
  id: string;
  supplier: string;
  supplierProductName?: string;
  supplierProductCode?: string;
  startDate?: string;
  endDate?: string;
  quantity: number;
  uom?: string;
  unitPrice: number;
  discountPercent?: number;
  leadTimeDays?: number;
};

export type Product = TenantScoped &
  Slugged & {
    id: string;
    sku: string;
    nameAr: string;
    nameEn?: string;
    description?: string;
    brandId?: string | null;
    categoryId?: string | null;
    status: ProductStatus;
    stockStatus: StockStatus;
    inventory: Inventory;
    price: Money;
    compareAtPrice?: Money;
    media: MediaItem[];
    seo: SeoFields;
    tags?: string[];
    /** Extended catalog fields (Odoo-inspired). Optional for legacy seed compatibility. */
    productType?: ProductType;
    tracking?: ProductTracking;
    barcode?: string;
    uom?: string;
    salesTax?: string;
    purchaseTax?: string;
    cost?: Money;
    posAvailable?: boolean;
    saleOk?: boolean;
    purchaseOk?: boolean;
    attributeNotes?: string;
    weightKg?: number;
    volumeM3?: number;
    responsible?: string;
    receiptDescription?: string;
    deliveryDescription?: string;
    internalMoveDescription?: string;
    priceLines?: ProductPriceLine[];
    purchaseLines?: ProductPurchaseLine[];
    createdAt: string;
    updatedAt: string;
    archivedAt?: string | null;
  };

export type ProductListQuery = {
  companyId: string;
  search?: string;
  categoryId?: string;
  brandId?: string;
  tag?: string;
  status?: ProductStatus;
  stockStatus?: StockStatus;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type CreateProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>;
export type UpdateProductInput = Partial<CreateProductInput>;
