import type { StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';

export type ProductDisplayModel = {
  imageUrl: string | null;
  imageAlt: string;
  outOfStock: boolean;
  hasDeal: boolean;
  discountPercent: number | null;
  /** Tag-driven promo chip (best-seller / deals). */
  promoBadge: 'best-seller' | 'deals' | null;
  sellingFast: boolean;
  /** Deterministic mock social proof until catalog API provides ratings. */
  rating: number;
  reviewCount: number;
};

function mockSocialProof(id: string): { rating: number; reviewCount: number } {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash + id.charCodeAt(index) * (index + 1)) % 997;
  }
  return {
    rating: Math.round((3.8 + (hash % 12) / 10) * 10) / 10,
    reviewCount: 40 + (hash % 2400),
  };
}

function resolvePromoBadge(tags: string[]): 'best-seller' | 'deals' | null {
  const normalized = tags.map((tag) => tag.toLowerCase());
  if (normalized.some((tag) => tag.includes('best'))) return 'best-seller';
  if (normalized.some((tag) => tag.includes('deal') || tag.includes('offer'))) return 'deals';
  return null;
}

function isSellingFast(product: StorefrontProduct): boolean {
  if (!product.inventory.trackInventory) return false;
  if (product.stockStatus !== 'in_stock') return false;
  return product.inventory.quantity <= product.inventory.lowStockThreshold;
}

export function buildProductDisplay(product: StorefrontProduct): ProductDisplayModel {
  const primaryMedia = product.media.find((item) => item.isPrimary) ?? product.media[0] ?? null;
  const imageUrl = primaryMedia?.url ?? product.imageUrl;
  const imageAlt = primaryMedia?.alt || product.imageAlt || product.name;
  const outOfStock = product.stockStatus === 'out_of_stock' || product.stockStatus === 'discontinued';
  const hasDeal = Boolean(product.compareAtPrice && product.compareAtPrice.amount > product.price.amount);
  const discountPercent =
    hasDeal && product.compareAtPrice
      ? Math.round(((product.compareAtPrice.amount - product.price.amount) / product.compareAtPrice.amount) * 100)
      : null;
  const social = mockSocialProof(product.id);

  return {
    imageUrl,
    imageAlt,
    outOfStock,
    hasDeal,
    discountPercent,
    promoBadge: resolvePromoBadge(product.tags),
    sellingFast: isSellingFast(product),
    rating: social.rating,
    reviewCount: social.reviewCount,
  };
}

export function hasProductDeal(product: StorefrontProduct): boolean {
  return Boolean(product.compareAtPrice && product.compareAtPrice.amount > product.price.amount);
}
