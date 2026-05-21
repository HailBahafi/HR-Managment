'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useEntityFilterSlotRegion } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActionsRegion } from '@/components/layouts/page-header-actions-context';
import { cn } from '@/shared/utils';
import { HR_PERMISSIONS_BASE } from '@/features/hr/permissions/constants/routes';

const EXCLUDED_FILTER_PATHS = new Set(['/hr/dashboard', HR_PERMISSIONS_BASE]);

export function AppEntityFilterRegion({ className }: { className?: string }) {
  const pathname = usePathname();
  const { slot, setSlot } = useEntityFilterSlotRegion();
  const { filterPanelOpen } = usePageHeaderActionsRegion();
  const excluded = EXCLUDED_FILTER_PATHS.has(pathname);

  React.useEffect(() => {
    if (excluded) setSlot(null);
  }, [excluded, setSlot]);

  if (excluded || !slot || !filterPanelOpen) return null;
  return (
    <div className={cn('mb-5 animate-fade-in', className)}>
      {slot}
    </div>
  );
}
