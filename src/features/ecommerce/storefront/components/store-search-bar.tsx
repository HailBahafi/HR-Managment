'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

type StoreSearchBarProps = {
  className?: string;
  variant?: 'header' | 'compact';
};

export function StoreSearchBar({ className, variant = 'header' }: StoreSearchBarProps) {
  const t = useTranslations('storefront');
  const router = useRouter();
  const [query, setQuery] = React.useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/store/search?q=${encodeURIComponent(trimmed)}` : '/store/search');
  }

  return (
    <form onSubmit={handleSubmit} className={cn('w-full', className)} role="search">
      <label htmlFor="store-header-search" className="sr-only">
        {t('search.placeholder')}
      </label>
      <div className="relative">
        <Search
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground',
            variant === 'header' ? 'start-4 h-5 w-5' : 'start-3 h-4 w-4',
          )}
          aria-hidden
        />
        <input
          id="store-header-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('search.placeholder')}
          className={cn(
            'w-full border-0 bg-background text-foreground outline-none ring-primary/20 transition-shadow focus:ring-2',
            variant === 'header'
              ? 'h-11 rounded-full ps-12 pe-4 text-sm shadow-sm'
              : 'h-10 rounded-lg border border-border ps-10 pe-3 text-sm',
          )}
          autoComplete="off"
        />
      </div>
    </form>
  );
}
