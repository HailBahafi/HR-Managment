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
  const { renderFnRef, reRenderSlotRef } = useEntityFilterSlotRegion();
  const { filterPanelOpen, setFilterPanelOpen } = usePageHeaderActionsRegion();
  const excluded = EXCLUDED_FILTER_PATHS.has(pathname);

  // forceUpdate lets useEntityFilterSlot trigger our re-render without any
  // context state change — the caller component never sees this re-render.
  const [, forceUpdate] = React.useReducer((n: number) => n + 1, 0);

  // Register our forceUpdate before any useEffect in child components fire
  // (useLayoutEffect runs before useEffect across the whole commit).
  React.useLayoutEffect(() => {
    reRenderSlotRef.current = forceUpdate;
    return () => { reRenderSlotRef.current = null; };
  }, [reRenderSlotRef]);

  // Clear slot when navigating to an excluded path.
  React.useEffect(() => {
    if (excluded) renderFnRef.current = null;
  }, [excluded, renderFnRef]);

  // Render the slot content fresh on every render (renderFnRef.current is always current).
  const content = excluded ? null : (renderFnRef.current?.() ?? null);

  // Auto-open the filter panel the first time a slot is registered.
  const hasContent = content !== null;
  React.useEffect(() => {
    if (hasContent && !excluded) setFilterPanelOpen(true);
  }, [hasContent, excluded, setFilterPanelOpen]);

  if (excluded || !content || !filterPanelOpen) return null;
  return (
    <div className={cn('mb-5 animate-fade-in', className)}>
      {content}
    </div>
  );
}
