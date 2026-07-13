import type { Inventory, MediaItem, Money, SeoFields, Slugged, TenantScoped } from '@/features/ecommerce/domain/types/common';
import type { ProductStatus } from '@/features/ecommerce/domain/constants/product-status';
import type { StockStatus } from '@/features/ecommerce/domain/constants/stock-status';

export type { ProductStatus, StockStatus };

export type Product = TenantScoped & Slugged & {
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
