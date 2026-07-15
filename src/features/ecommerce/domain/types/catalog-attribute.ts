import type { TenantScoped } from '@/features/ecommerce/domain/types/common';

/** How attribute options are shown on the product form / storefront. */
export type AttributeDisplayType = 'radio' | 'pills' | 'select' | 'color' | 'image' | 'multi';

/**
 * When variants are generated from attribute values:
 * - always: create variant combinations immediately
 * - dynamic: create when selected/ordered
 * - never: attribute only (no SKU matrix)
 */
export type VariantCreationMode = 'always' | 'dynamic' | 'never';

export type CatalogAttributeValue = {
  id: string;
  nameAr: string;
  /** Free text / description note */
  freeText?: string;
  /** Default extra price for this value (catalog hint; not a fixed product price). */
  defaultExtraPrice?: number;
  /** Color hex or image URL depending on displayType */
  extra?: string;
};

/** Master attribute definition — configured once, reused on products. */
export type CatalogAttribute = TenantScoped & {
  id: string;
  nameAr: string;
  displayType: AttributeDisplayType;
  createVariant: VariantCreationMode;
  values: CatalogAttributeValue[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogAttributeListQuery = {
  companyId: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateCatalogAttributeInput = Omit<CatalogAttribute, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCatalogAttributeInput = Partial<CreateCatalogAttributeInput>;
