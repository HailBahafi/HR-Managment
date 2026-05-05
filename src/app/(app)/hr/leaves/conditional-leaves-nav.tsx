'use client';

import { usePathname } from 'next/navigation';
import { LeavesNav } from '@/components/leaves/leaves-nav';

/** مسارات لا تعرض فيها شريط تبويبات الإجازات (مثلاً صفحة بعرض كامل). */
const LEAVES_NAV_HIDDEN_PREFIXES = ['/hr/leaves/balance-credit'] as const;

export function ConditionalLeavesNav() {
  const pathname = usePathname();
  const hide = LEAVES_NAV_HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (hide) return null;
  return <LeavesNav />;
}
