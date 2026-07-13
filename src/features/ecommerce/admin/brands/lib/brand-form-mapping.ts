import type { Brand, CreateBrandInput } from '@/features/ecommerce/domain/types/brand';
import type { BrandFormValues } from '@/features/ecommerce/admin/brands/schemas/brand-schema';
import { BRAND_FORM_DEFAULT_VALUES } from '@/features/ecommerce/admin/brands/schemas/brand-schema';

export function brandToFormValues(brand: Brand): BrandFormValues {
  return {
    nameAr: brand.nameAr,
    nameEn: brand.nameEn ?? '',
    slug: brand.slug,
    description: brand.description ?? '',
    websiteUrl: brand.websiteUrl ?? '',
    logoUrl: brand.logo?.url ?? '',
    isActive: brand.isActive,
    metaTitle: brand.seo.metaTitle ?? '',
    metaDescription: brand.seo.metaDescription ?? '',
  };
}

export function formValuesToCreateBrandInput(values: BrandFormValues, companyId: string): CreateBrandInput {
  return {
    companyId,
    nameAr: values.nameAr,
    nameEn: values.nameEn || undefined,
    slug: values.slug,
    description: values.description || undefined,
    websiteUrl: values.websiteUrl || undefined,
    logo: values.logoUrl
      ? {
          id: `media-${Math.random().toString(36).slice(2, 10)}`,
          url: values.logoUrl,
          alt: values.nameAr,
          type: 'image',
          position: 0,
          isPrimary: true,
        }
      : undefined,
    isActive: values.isActive,
    seo: {
      metaTitle: values.metaTitle || undefined,
      metaDescription: values.metaDescription || undefined,
    },
  };
}

export { BRAND_FORM_DEFAULT_VALUES };
