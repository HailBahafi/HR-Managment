import { cn } from '@/shared/utils';

type ProductPriceProps = {
  price: string;
  compareAtPrice?: string;
  discountPercent?: number | null;
  layout?: 'stacked' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  muted?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: { price: 'text-base font-bold', compare: 'text-xs', discount: 'text-xs' },
  md: { price: 'text-lg font-bold', compare: 'text-sm', discount: 'text-sm' },
  lg: { price: 'text-2xl font-bold', compare: 'text-base', discount: 'text-base' },
} as const;

export function ProductPrice({
  price,
  compareAtPrice,
  discountPercent,
  layout = 'inline',
  size = 'sm',
  muted = false,
  className,
}: ProductPriceProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        layout === 'stacked' && 'flex flex-col gap-0.5',
        layout === 'inline' && 'flex flex-wrap items-baseline gap-x-2 gap-y-0.5',
        muted && 'opacity-60',
        className,
      )}
    >
      <span className={cn(sizes.price, 'text-foreground')}>{price}</span>
      {compareAtPrice ? (
        <span className={cn(sizes.compare, 'text-muted-foreground line-through')}>{compareAtPrice}</span>
      ) : null}
      {discountPercent && discountPercent > 0 ? (
        <span className={cn(sizes.discount, 'font-bold text-secondary')}>{discountPercent}%</span>
      ) : null}
    </div>
  );
}
