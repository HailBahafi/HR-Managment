'use client';

import Image from 'next/image';
import { PackageSearch, Trash2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import type { StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { ProductPrice } from '@/features/ecommerce/storefront/components/catalog/product-price';
import { ProductGridSkeleton } from '@/features/ecommerce/storefront/components/catalog/loading-skeleton';
import { QuantitySelector } from '@/features/ecommerce/storefront/components/catalog/quantity-selector';
import { StoreErrorState } from '@/features/ecommerce/storefront/components/catalog/store-error-state';
import { useStorefrontCartProducts } from '@/features/ecommerce/storefront/hooks/use-storefront-cart-products';
import { useStorefrontCartUi } from '@/features/ecommerce/storefront/hooks/use-storefront-cart-ui';
import { buildProductDisplay, hasProductDeal } from '@/features/ecommerce/storefront/lib/product-display';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { Link } from '@/i18n/navigation';

export function StoreCartClient() {
  const t = useTranslations('storefront');
  const format = useFormatter();
  const lines = useStorefrontCartUi((s) => s.lines);
  const setQuantity = useStorefrontCartUi((s) => s.setQuantity);
  const removeItem = useStorefrontCartUi((s) => s.removeItem);
  const { data: products, isLoading, isError, refetch } = useStorefrontCartProducts();

  const productById = new Map((products ?? []).map((product) => [product.id, product]));
  const cartLines = lines
    .map((line) => ({ line, product: productById.get(line.productId) }))
    .filter((entry): entry is { line: (typeof lines)[number]; product: StorefrontProduct } => Boolean(entry.product));

  const total = cartLines.reduce((sum, { line, product }) => sum + product.price.amount * line.quantity, 0);

  function formatPrice(amount: number, currency: string) {
    return format.number(amount, { style: 'currency', currency });
  }

  if (lines.length === 0) {
    return (
      <StoreEmptyState icon={PackageSearch} title={t('cart.empty')} description={t('cart.emptyDescription')}>
        <Link
          href="/store/products"
          prefetch={false}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          {t('cart.continueShopping')}
        </Link>
      </StoreEmptyState>
    );
  }

  if (isLoading) {
    return <ProductGridSkeleton count={3} columns={{ mobile: 1, tablet: 1, desktop: 1 }} />;
  }

  if (isError) {
    return <StoreErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="flex flex-col gap-4">
        {cartLines.map(({ line, product }) => {
          const display = buildProductDisplay(product);
          const showCompare = hasProductDeal(product);
          return (
            <li key={product.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {display.imageUrl ? (
                  <Image src={display.imageUrl} alt={display.imageAlt} fill unoptimized sizes="80px" className="object-contain p-1" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <PackageSearch className="h-6 w-6" aria-hidden />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Link href={`/store/products/${product.slug}`} prefetch={false} className="font-medium text-foreground hover:text-primary">
                  {product.name}
                </Link>
                <ProductPrice
                  price={formatPrice(product.price.amount, product.price.currency)}
                  compareAtPrice={
                    showCompare && product.compareAtPrice
                      ? formatPrice(product.compareAtPrice.amount, product.compareAtPrice.currency)
                      : undefined
                  }
                  size="sm"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-muted-foreground">{t('cart.quantity')}</span>
                  <QuantitySelector
                    value={line.quantity}
                    onChange={(quantity) => setQuantity(product.id, quantity)}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(product.id)}
                    className="ms-auto inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    {t('cart.remove')}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-arabic-display text-lg font-semibold text-foreground">{t('cart.subtotal')}</h2>
        <p className="mt-2 text-2xl font-bold text-foreground">
          {formatPrice(total, cartLines[0]?.product.price.currency ?? 'SAR')}
        </p>
        <button
          type="button"
          className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t('cart.checkout')}
        </button>
        <Link href="/store/products" prefetch={false} className="mt-3 block text-center text-sm text-primary hover:underline">
          {t('cart.continueShopping')}
        </Link>
      </aside>
    </div>
  );
}
