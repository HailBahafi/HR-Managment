import type { CreateProductInput, Product } from '@/features/ecommerce/domain/types/product';
import type { MediaItem } from '@/features/ecommerce/domain/types/common';
import type { ProductFormInput, ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { PRODUCT_FORM_DEFAULT_VALUES } from '@/features/ecommerce/admin/products/schemas/product-schema';

function parseTagsInput(tagsInput: string | undefined): string[] | undefined {
  const tags = (tagsInput ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length > 0 ? tags : undefined;
}

function formatTagsForInput(tags: string[] | undefined): string {
  return tags?.join(', ') ?? '';
}

/** Maps an existing product into form values for the edit dialog. */
export function productToFormValues(product: Product): ProductFormInput {
  return {
    sku: product.sku,
    nameAr: product.nameAr,
    nameEn: product.nameEn ?? '',
    slug: product.slug,
    description: product.description ?? '',
    categoryId: product.categoryId ?? undefined,
    brandId: product.brandId ?? undefined,
    status: product.status,
    stockStatus: product.stockStatus,
    stockQuantity: product.inventory.quantity,
    trackInventory: product.inventory.trackInventory,
    allowBackorder: product.inventory.allowBackorder,
    tagsInput: formatTagsForInput(product.tags),
    priceAmount: product.price.amount,
    priceCurrency: product.price.currency,
    compareAtPriceAmount: product.compareAtPrice?.amount,
    media: [...product.media]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({ url: item.url, alt: item.alt, isPrimary: item.isPrimary })),
    metaTitle: product.seo.metaTitle ?? '',
    metaDescription: product.seo.metaDescription ?? '',
  };
}

/** Maps form values back into the API's create-input shape (companyId is injected by the caller). */
export function formValuesToCreateInput(
  values: ProductFormValues,
  companyId: string,
): CreateProductInput {
  const hasPrimary = values.media.some((item) => item.isPrimary);
  const media: MediaItem[] = values.media.map((item, index) => ({
    id: `media-${Math.random().toString(36).slice(2, 10)}`,
    url: item.url,
    alt: item.alt || values.nameAr,
    type: 'image',
    position: index,
    // If no image was explicitly marked primary, the first one wins — the storefront/admin
    // always needs exactly one primary image to pick a thumbnail from.
    isPrimary: hasPrimary ? item.isPrimary : index === 0,
  }));

  return {
    companyId,
    sku: values.sku,
    nameAr: values.nameAr,
    nameEn: values.nameEn || undefined,
    slug: values.slug,
    description: values.description || undefined,
    categoryId: values.categoryId ?? null,
    brandId: values.brandId ?? null,
    status: values.status,
    stockStatus: values.stockStatus,
    inventory: {
      trackInventory: values.trackInventory,
      quantity: values.stockQuantity,
      lowStockThreshold: 5,
      allowBackorder: values.allowBackorder,
    },
    price: { amount: values.priceAmount, currency: values.priceCurrency },
    compareAtPrice: values.compareAtPriceAmount
      ? { amount: values.compareAtPriceAmount, currency: values.priceCurrency }
      : undefined,
    media,
    seo: {
      metaTitle: values.metaTitle || undefined,
      metaDescription: values.metaDescription || undefined,
    },
    tags: parseTagsInput(values.tagsInput),
  };
}

export { PRODUCT_FORM_DEFAULT_VALUES };
