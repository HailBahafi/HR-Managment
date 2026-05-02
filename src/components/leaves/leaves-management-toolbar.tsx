'use client';

import * as React from 'react';
import {
  EntityFilterToolbar,
  type EntityFilterToolbarHandle,
} from '@/components/ui/entity-filter-toolbar';
import type { DateFilterTab } from '@/lib/hr-discipline/discipline-date-filter';

export type LeavesManagementToolbarHandle = EntityFilterToolbarHandle;

export interface LeavesManagementToolbarProps {
  empPickerEmployees: { id: string; name: string }[];
  selectedEmpIds: Set<string>;
  onSelectedEmpIdsChange: (s: Set<string>) => void;

  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  statusOrder: readonly string[];
  statusLabels: Record<string, string>;
  statusCounts: Record<string, number>;

  onDateBoundsChange: (bounds: { from: string; to: string }) => void;
  onDateFilterMetaChange?: (meta: { tab: DateFilterTab; hasRestriction: boolean }) => void;

  trailingActions: React.ReactNode;
}

export const LeavesManagementToolbar = React.forwardRef<
  LeavesManagementToolbarHandle,
  LeavesManagementToolbarProps
>(function LeavesManagementToolbar(props, ref) {
  const { trailingActions, ...rest } = props;
  return (
    <EntityFilterToolbar
      ref={ref}
      {...rest}
      trailingActions={trailingActions}
    />
  );
});
