'use client';

import * as React from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  EntityFilterToolbar,
  type EntityFilterToolbarHandle,
} from '@/components/ui/entity-filter-toolbar';
import type { DateFilterTab } from '@/lib/hr-discipline/discipline-date-filter';

export {
  DATE_TAB_BASE,
  DATE_TAB_TRIGGER_CLASS,
  STATUS_COUNT_BADGE,
  STATUS_ALL_TRIGGER_CLASS,
  STATUS_CYCLE_TRIGGER_CLASSES,
} from '@/components/ui/entity-filter-toolbar';

const VIEW_MODE_TAB_CLASS =
  'discipline-toolbar-view-tab h-7 gap-1 px-2.5 text-[11px] transition-all duration-150 data-[state=active]:!font-semibold data-[state=active]:!shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/40 data-[state=active]:ring-offset-2 data-[state=active]:ring-offset-background data-[state=active]:border data-[state=active]:border-primary/35';

export type DisciplineViewMode = 'cards' | 'list';

export type DisciplineFilterToolbarHandle = EntityFilterToolbarHandle;

export interface DisciplineFilterToolbarProps {
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  primaryActionIcon?: React.ReactNode;

  empPickerEmployees: { id: string; name: string }[];
  selectedEmpIds: Set<string>;
  onSelectedEmpIdsChange: (s: Set<string>) => void;

  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  statusOrder: readonly string[];
  statusLabels: Record<string, string>;
  statusCounts: Record<string, number>;

  viewMode: DisciplineViewMode;
  onViewModeChange: (v: DisciplineViewMode) => void;

  onDateBoundsChange: (bounds: { from: string; to: string }) => void;
  onDateFilterMetaChange?: (meta: { tab: DateFilterTab; hasRestriction: boolean }) => void;

  /** Optional controls before عرض cards/list (e.g. PDF export) */
  toolbarExtraTrailing?: React.ReactNode;
}

export const DisciplineFilterToolbar = React.forwardRef<
  DisciplineFilterToolbarHandle,
  DisciplineFilterToolbarProps
>(function DisciplineFilterToolbar(
  {
    primaryActionLabel,
    onPrimaryAction,
    primaryActionIcon,
    empPickerEmployees,
    selectedEmpIds,
    onSelectedEmpIdsChange,
    statusFilter,
    onStatusFilterChange,
    statusOrder,
    statusLabels,
    statusCounts,
    viewMode,
    onViewModeChange,
    onDateBoundsChange,
    onDateFilterMetaChange,
    toolbarExtraTrailing,
  },
  ref,
) {
  const icon = primaryActionIcon ?? <Plus className="h-3.5 w-3.5 shrink-0" />;

  return (
    <EntityFilterToolbar
      ref={ref}
      empPickerEmployees={empPickerEmployees}
      selectedEmpIds={selectedEmpIds}
      onSelectedEmpIdsChange={onSelectedEmpIdsChange}
      statusFilter={statusFilter}
      onStatusFilterChange={onStatusFilterChange}
      statusOrder={statusOrder}
      statusLabels={statusLabels}
      statusCounts={statusCounts}
      onDateBoundsChange={onDateBoundsChange}
      onDateFilterMetaChange={onDateFilterMetaChange}
      trailingActions={(
        <>
          {toolbarExtraTrailing}
          <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as DisciplineViewMode)}>
            <TabsList className="h-8 gap-0.5 bg-muted/70 p-0.5">
              <TabsTrigger value="cards" className={VIEW_MODE_TAB_CLASS}>
                <LayoutGrid className="h-3 w-3 shrink-0" />
                بطاقات
              </TabsTrigger>
              <TabsTrigger value="list" className={VIEW_MODE_TAB_CLASS}>
                <List className="h-3 w-3 shrink-0" />
                قائمة
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="luxe" size="sm" className="h-8 gap-1 px-3 text-xs shadow-sm" onClick={onPrimaryAction}>
            {icon}
            {primaryActionLabel}
          </Button>
        </>
      )}
    />
  );
});
