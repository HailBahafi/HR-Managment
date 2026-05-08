'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useEntityFilterSlotRegion } from '@/components/entity-filter-slot-context';
import { cn } from '@/lib/utils';
import { HR_PERMISSIONS_BASE } from '@/features/hr/permissions/constants/routes';

const EXCLUDED_FILTER_PATHS = new Set(['/hr/dashboard', HR_PERMISSIONS_BASE]);

/**
 * Host region for `useEntityFilterSlot`: toolbar is teleported here from page clients.
 * لا يُعرض على لوحة التحكم ولا صلاحيات النظام.
 */
export function AppEntityFilterRegion({ className }: { className?: string }) {
  const pathname = usePathname();
  const { slot, setSlot } = useEntityFilterSlotRegion();
  const excluded = EXCLUDED_FILTER_PATHS.has(pathname);

  React.useEffect(() => {
    if (excluded) setSlot(null);
  }, [excluded, setSlot]);

  if (excluded || !slot) return null;
  return (
    <div className={cn('mb-5 mt-1 animate-fade-in sm:mt-2', className)}>
      {slot}
    </div>
  );
}
