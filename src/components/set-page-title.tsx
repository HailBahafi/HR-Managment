'use client';

import { useSetPageTitle, type PageTitleMeta } from '@/components/page-title-context';

export function SetPageTitle(props: PageTitleMeta) {
  useSetPageTitle(props);
  return null;
}
