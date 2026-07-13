'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Languages } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type StorefrontLocale } from '@/i18n/routing';
import { cn } from '@/shared/utils';

export function StoreLocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations('storefront');
  const locale = useLocale() as StorefrontLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value as StorefrontLocale;
    if (nextLocale === locale) return;

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <label className={cn('inline-flex items-center gap-1.5', className)}>
      <Languages className="h-4 w-4 text-muted-foreground" aria-hidden />
      <span className="sr-only">{t('a11y.languageSwitcher')}</span>
      <select
        value={locale}
        onChange={handleChange}
        disabled={isPending}
        className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground disabled:opacity-60"
        aria-label={t('a11y.languageSwitcher')}
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {t(`locale.${code}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
