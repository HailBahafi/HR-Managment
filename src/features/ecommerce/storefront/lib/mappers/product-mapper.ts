import type { Product } from '@/features/ecommerce/domain/types/product';
import type { StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';
import { resolveLocalizedOptional, resolveLocalizedText, type LocalizableString } from '@/features/ecommerce/storefront/domain/localizable';

type ProductRecord = Product & {
  name?: LocalizableString;
  description?: LocalizableString;
};

function resolveName(product: Product, locale: StorefrontLocale): string {
  const record = product as ProductRecord;
  if (record.name) return resolveLocalizedText(record.name, locale);
  return locale === 'en' && product.nameEn ? product.nameEn : product.nameAr;
}

function resolveDescription(product: Product, locale: StorefrontLocale): string {
  const record = product as ProductRecord;
  if (record.description && typeof record.description === 'object') {
    return resolveLocalizedText(record.description as LocalizableString, locale);
  }
  if (typeof product.description === 'string') return product.description;
  return resolveName(product, locale);
}

export function mapStorefrontProduct(product: Product, locale: StorefrontLocale): StorefrontProduct {
  const primary = product.media.find((item) => item.isPrimary) ?? product.media[0] ?? null;
  const name = resolveName(product, locale);

  return {
    id: product.id,
    companyId: product.companyId,
    slug: product.slug,
    sku: product.sku,
    name,
    description: resolveDescription(product, locale),
    brandId: product.brandId ?? null,
    categoryId: product.categoryId ?? null,
    status: product.status,
    stockStatus: product.stockStatus,
    inventory: product.inventory,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    media: product.media,
    imageUrl: primary?.url ?? null,
    imageAlt: primary?.alt || name,
    tags: product.tags ?? [],
    metaTitle: product.seo.metaTitle || name,
    metaDescription: product.seo.metaDescription || resolveDescription(product, locale),
  };
}

export function mapStorefrontProducts(products: Product[], locale: StorefrontLocale): StorefrontProduct[] {
  return products.map((product) => mapStorefrontProduct(product, locale));
}
