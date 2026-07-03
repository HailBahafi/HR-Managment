'use client';

import type { ReactNode } from 'react';
import { SaudiRiyal } from 'lucide-react';
import { cn } from '@/shared/utils';

export function isSarCurrency(currency?: string | null): boolean {
  const code = currency?.trim().toUpperCase();
  return !code || code === 'SAR';
}

type SarAmountProps = {
  children: ReactNode;
  currency?: string | null;
  className?: string;
  iconClassName?: string;
  suffix?: ReactNode;
};

/** Amount followed by the Saudi riyal icon (RTL: number then icon). */
export function SarAmount({
  children,
  currency,
  className,
  iconClassName,
  suffix,
}: SarAmountProps) {
  if (!isSarCurrency(currency)) {
    return (
      <span className={cn('tabular-nums', className)} dir="ltr">
        {children}
        {currency ? ` ${currency}` : null}
        {suffix}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-0.5 tabular-nums', className)} dir="rtl">
      <span dir="ltr">{children}</span>
      <SaudiRiyal
        className={cn('h-3.5 w-3.5 shrink-0 text-current opacity-85', iconClassName)}
        aria-hidden
      />
      {suffix ? <span>{suffix}</span> : null}
    </span>
  );
}
