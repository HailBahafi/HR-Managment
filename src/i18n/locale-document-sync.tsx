'use client';

import { useLayoutEffect } from 'react';
import { isRtlLocale, type StorefrontLocale } from '@/i18n/routing';

/** Syncs document lang/dir for locale routes. Runs before paint on client navigations. */
export function LocaleDocumentSync({ locale }: { locale: StorefrontLocale }) {
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';

  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang='${locale}';document.documentElement.dir='${dir}';`,
      }}
    />
  );
}
