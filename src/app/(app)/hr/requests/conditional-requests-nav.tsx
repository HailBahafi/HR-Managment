'use client';

import { usePathname } from 'next/navigation';
import { RequestsNav } from '@/components/hr-requests/requests-nav';

/** مسارات لا تعرض فيها شريط تبويبات الطلبات (مثلاً صفحة بعرض كامل). */
const REQUESTS_NAV_HIDDEN_PREFIXES = [
  '/hr/requests/general',
  '/hr/requests/attendance-corrections',
  '/hr/requests/unified-management',
  '/hr/requests/request-types',
] as const;

export function ConditionalRequestsNav() {
  const pathname = usePathname();
  const hide = REQUESTS_NAV_HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (hide) return null;
  return <RequestsNav />;
}

