import type { MediaItem, SeoFields, Slugged, TenantScoped } from '@/features/ecommerce/domain/types/common';

export type Category = TenantScoped & Slugged & {
  id: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  image?: MediaItem;
  parentId?: string | null;
  /** Brand IDs shown in storefront mega menu for this (usually root) category. */
  featuredBrandIds?: string[];
  seo: SeoFields;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryListQuery = {
  companyId: string;
  search?: string;
  parentId?: string | null;
  page?: number;
  limit?: number;
};

export type CreateCategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;
