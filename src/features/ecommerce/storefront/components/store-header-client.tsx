'use client';

import * as React from 'react';
import { Heart, ShoppingCart, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type {
  StorefrontBrand,
  StorefrontCategory,
  StorefrontCompanyConfig,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import { StoreLocaleSwitcher } from '@/features/ecommerce/storefront/components/store-locale-switcher';
import { StoreCategoryNavBar, StoreMobileCategoryNav } from '@/features/ecommerce/storefront/components/store-mega-menu';
import { StoreSearchBar } from '@/features/ecommerce/storefront/components/store-search-bar';
import { useCartItemCount } from '@/features/ecommerce/storefront/hooks/use-storefront-cart-ui';
import { useWishlistCount } from '@/features/ecommerce/storefront/hooks/use-storefront-wishlist-ui';
import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

type StoreHeaderInteractiveProps = {
  config: StorefrontCompanyConfig;
  categories: StorefrontCategory[];
  brands: StorefrontBrand[];
  logo: React.ReactNode;
};

function BadgeIcon({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex">
      {children}
      {count > 0 ? (
        <span className="absolute -end-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </span>
  );
}

export function StoreHeaderInteractive({ config, categories, brands, logo }: StoreHeaderInteractiveProps) {
  const t = useTranslations('storefront');
  const cartCount = useCartItemCount();
  const wishlistCount = useWishlistCount();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          <div className="min-w-0 shrink">{logo}</div>

          <div className="hidden min-w-0 flex-1 lg:block">
            <StoreSearchBar />
          </div>

          <div className="ms-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
            <StoreLocaleSwitcher className="hidden sm:inline-flex [&_select]:border-primary-foreground/30 [&_select]:bg-primary [&_select]:text-primary-foreground" />

            <button
              type="button"
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-primary-foreground/10 sm:inline-flex"
              title={t('nav.login')}
            >
              <User className="h-4 w-4" aria-hidden />
              <span>{t('nav.login')}</span>
            </button>

            <Link
              href="/store/wishlist"
              prefetch={false}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/10"
              aria-label={t('nav.wishlist')}
            >
              <BadgeIcon count={wishlistCount}>
                <Heart className="h-5 w-5" aria-hidden />
              </BadgeIcon>
            </Link>

            <Link
              href="/store/cart"
              prefetch={false}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/10"
              aria-label={t('nav.cart')}
            >
              <BadgeIcon count={cartCount}>
                <ShoppingCart className="h-5 w-5" aria-hidden />
              </BadgeIcon>
            </Link>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/10 lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="store-mobile-nav"
              aria-label={mobileOpen ? t('a11y.closeMenu') : t('a11y.openMenu')}
              onClick={() => setMobileOpen((value) => !value)}
            >
              <span className="text-lg leading-none">{mobileOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        <div className="px-3 pb-3 sm:px-6 lg:hidden">
          <StoreSearchBar />
        </div>
      </div>

      <StoreCategoryNavBar categories={categories} brands={brands} />

      <nav
        id="store-mobile-nav"
        className={cn('border-b border-border bg-background lg:hidden', mobileOpen ? 'block animate-fade-in' : 'hidden')}
        aria-label={t('a11y.mobileNav')}
      >
        <div className="mx-auto flex max-w-[1400px] flex-col gap-1 px-3 py-3 sm:px-6">
          <StoreLocaleSwitcher />
          {config.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <StoreMobileCategoryNav
            categories={categories}
            brands={brands}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </nav>
    </>
  );
}
