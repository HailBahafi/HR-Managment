'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

type Props = {
  /** إذا طابق `pathname` أحد هذه البادئات (بالضبط أو كبادئة)، لا يُعرض المحتوى. */
  prefixes: readonly string[];
  children: React.ReactNode;
};

/** يمنع تكرار منطق `usePathname` + `some(startsWith)` بين تخطيطات الوحدات. */
export function HideOnPathPrefixes({ prefixes, children }: Props) {
  const pathname = usePathname();
  if (prefixes.length === 0) return <>{children}</>;
  const hide = prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (hide) return null;
  return <>{children}</>;
}
