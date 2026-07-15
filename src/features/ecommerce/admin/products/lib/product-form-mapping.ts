import type { CreateProductInput, Product } from '@/features/ecommerce/domain/types/product';
import type { MediaItem } from '@/features/ecommerce/domain/types/common';
import type { ProductFormInput, ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  createDefaultUomLines,
  PRODUCT_FORM_DEFAULT_VALUES,
} from '@/features/ecommerce/admin/products/schemas/product-schema';

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
    media: [...product.media]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({ url: item.url, alt: item.alt, isPrimary: item.isPrimary })),
    metaTitle: product.seo.metaTitle ?? '',
    metaDescription: product.seo.metaDescription ?? '',
    productType: product.productType ?? 'goods',
    tracking: product.tracking ?? 'none',
    barcode: product.barcode ?? '',
    posAvailable: product.posAvailable ?? false,
    saleOk: product.saleOk ?? true,
    attributes: product.attributes ?? [],
    uomLines:
      product.uomLines && product.uomLines.length > 0
        ? product.uomLines
        : createDefaultUomLines(),
  };
}

type MappingOptions = {
  /** Keep catalog display price when editing — prices are not set as fixed product master data. */
  existing?: Product | null;
};

/** Maps form values back into the API's create-input shape (companyId is injected by the caller). */
export function formValuesToCreateInput(
  values: ProductFormValues,
  companyId: string,
  options?: MappingOptions,
): CreateProductInput {
  const hasPrimary = values.media.some((item) => item.isPrimary);
  const media: MediaItem[] = values.media.map((item, index) => ({
    id: `media-${Math.random().toString(36).slice(2, 10)}`,
    url: item.url,
    alt: item.alt || values.nameAr,
    type: 'image',
    position: index,
    isPrimary: hasPrimary ? item.isPrimary : index === 0,
  }));

  const existing = options?.existing;
  const currency = existing?.price.currency ?? 'SAR';

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
    price: existing?.price ?? { amount: 0, currency },
    compareAtPrice: existing?.compareAtPrice,
    media,
    seo: {
      metaTitle: values.metaTitle || undefined,
      metaDescription: values.metaDescription || undefined,
    },
    tags: parseTagsInput(values.tagsInput),
    productType: values.productType,
    tracking: values.tracking,
    barcode: values.barcode || undefined,
    posAvailable: values.posAvailable,
    saleOk: values.saleOk,
    attributes: values.attributes,
    uomLines: values.uomLines.map((line) => ({
      ...line,
      uneceCode: line.uneceCode || undefined,
    })),
  };
}

export { PRODUCT_FORM_DEFAULT_VALUES };
