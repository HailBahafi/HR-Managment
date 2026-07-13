import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { StorefrontCategory } from '@/features/ecommerce/storefront/domain/storefront-models';
import { cn } from '@/shared/utils';

type CategoryCardProps = {
  category: StorefrontCategory;
  variant?: 'circle' | 'card' | 'list';
  showLabel?: boolean;
  className?: string;
};

export function CategoryCard({ category, variant = 'circle', showLabel = true, className }: CategoryCardProps) {
  const href = `/store/categories/${category.slug}` as const;
  const label = category.name;
  const alt = category.imageAlt || label;

  if (variant === 'list') {
    return (
      <Link
        href={href}
        prefetch={false}
        className={cn(
          'flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/40',
          className,
        )}
      >
        <CategoryThumb imageUrl={category.imageUrl} alt={alt} size="sm" />
        {showLabel ? <span className="text-sm font-medium text-foreground">{label}</span> : null}
      </Link>
    );
  }

  if (variant === 'card') {
    return (
      <Link
        href={href}
        prefetch={false}
        className={cn(
          'group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated',
          className,
        )}
      >
        <div className="relative aspect-[4/3] w-full bg-muted">
          {category.imageUrl ? (
            <Image src={category.imageUrl} alt={alt} fill unoptimized className="object-cover transition-transform duration-200 group-hover:scale-105" />
          ) : null}
        </div>
        {showLabel ? (
          <div className="p-3">
            <span className="line-clamp-2 text-sm font-medium text-foreground">{label}</span>
          </div>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn('flex w-24 shrink-0 flex-col items-center gap-2 sm:w-28', className)}
    >
      <CategoryThumb imageUrl={category.imageUrl} alt={alt} size="md" />
      {showLabel ? <span className="line-clamp-2 text-center text-xs font-medium text-foreground">{label}</span> : null}
    </Link>
  );
}

function CategoryThumb({
  imageUrl,
  alt,
  size,
}: {
  imageUrl: string | null;
  alt: string;
  size: 'sm' | 'md';
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-full border-2 border-border bg-muted',
        size === 'sm' && 'h-10 w-10',
        size === 'md' && 'h-20 w-20 sm:h-24 sm:w-24',
      )}
    >
      {imageUrl ? <Image src={imageUrl} alt={alt} fill unoptimized className="object-cover" /> : null}
    </div>
  );
}
