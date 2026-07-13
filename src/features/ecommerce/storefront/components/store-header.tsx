import Image from 'next/image';
import type {
  StorefrontBrand,
  StorefrontCategory,
  StorefrontCompanyConfig,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import { StoreHeaderInteractive } from '@/features/ecommerce/storefront/components/store-header-client';
import { Link } from '@/i18n/navigation';

type StoreHeaderProps = {
  config: StorefrontCompanyConfig;
  categories: StorefrontCategory[];
  brands: StorefrontBrand[];
};

export function StoreHeader({ config, categories, brands }: StoreHeaderProps) {
  const logo = (
    <Link
      href="/store"
      prefetch={false}
      aria-label={config.name}
      className="flex shrink-0 items-center gap-2 font-arabic-display text-base font-bold sm:text-lg"
    >
      {config.logoUrl ? (
        <Image src={config.logoUrl} alt="" width={36} height={36} unoptimized className="rounded" aria-hidden />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-black text-secondary-foreground">
          {config.name.charAt(0)}
        </span>
      )}
      <span className="hidden sm:inline">{config.name}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 shadow-soft">
      <StoreHeaderInteractive config={config} categories={categories} brands={brands} logo={logo} />
    </header>
  );
}
