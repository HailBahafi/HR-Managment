'use client';

import * as React from 'react';
import {
  CalendarDays, LayoutGrid, List, X, SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/shared/utils';
import {
  filterTabTriggerClass,
  STATUS_COUNT_BADGE,
  STATUS_FILTER_TAB_TONES,
} from '@/shared/status-pill-classes';
import type { DateFilterTab } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  effectiveDateRange,
  isPeriodFilterActive,
} from '@/features/hr/discipline/lib/discipline-date-filter';
import { EntityPeriodFilter, type PeriodRange } from '@/components/ui/entity-period-filter';
import { SelectWithClear } from '@/components/ui/select-with-clear';

export const DATE_TAB_BASE =
  'discipline-tab-trigger shrink-0 gap-1 px-3 text-[11px] transition-all duration-150 border';

export const DATE_TAB_TRIGGER_CLASS: Record<DateFilterTab, string> = {
  all: filterTabTriggerClass('muted'),
  today: filterTabTriggerClass('primary'),
  week: filterTabTriggerClass('accent'),
  month: filterTabTriggerClass('success'),
  custom: filterTabTriggerClass('gold'),
};

export { STATUS_COUNT_BADGE };

export const STATUS_ALL_TRIGGER_CLASS = filterTabTriggerClass('muted');

export const STATUS_CYCLE_TRIGGER_CLASSES = STATUS_FILTER_TAB_TONES.map((tone) =>
  filterTabTriggerClass(tone),
);

export type EntityFilterToolbarHandle = {
  resetDateFilter: () => void;
  resetStatusFilter: () => void;
};

export type EntityDataViewIcon = 'list' | 'layout-grid' | 'calendar-days';

export type EntityDataViewOption = {
  value: string;
  label: string;
  icon?: EntityDataViewIcon;
};

export type EntityDataViewConfig = {
  value: string;
  onChange: (value: string) => void;
  options: readonly EntityDataViewOption[];
};

/** قائمة منسدلة واحدة بجانب شريط الأدوات (فرع، قسم، …) */
export type EntityFilterInlineSelect = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  /** Called when the dropdown opens (lazy-load options). */
  onOpen?: () => void;
};

const EMPTY_EMP_PICKER_LIST: { id: string; name: string }[] = [];
const EMPTY_SELECTED_EMP_IDS = new Set<string>();
const EMPTY_STATUS_ORDER_LIST: readonly string[] = [];
const EMPTY_STATUS_LABELS: Record<string, string> = {};
const DEFAULT_STATUS_COUNTS: Record<string, number> = { all: 0 };
const noopBounds = () => {};
const noopSetEmp = () => {};
const noopStatus = () => {};

const DATA_VIEW_TAB_CLASS =
  'entity-toolbar-view-tab flex h-8 w-8 shrink-0 items-center justify-center p-0 transition-all duration-150 data-[state=active]:!shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/40 data-[state=active]:ring-offset-2 data-[state=active]:ring-offset-background data-[state=active]:border data-[state=active]:border-primary/35';

function DataViewIcon({ name }: { name?: EntityDataViewIcon }) {
  switch (name) {
    case 'layout-grid':
      return <LayoutGrid className="h-3.5 w-3.5 shrink-0" />;
    case 'calendar-days':
      return <CalendarDays className="h-3.5 w-3.5 shrink-0" />;
    case 'list':
    default:
      return <List className="h-3.5 w-3.5 shrink-0" />;
  }
}

export interface EntityFilterToolbarProps {
  empPickerEmployees?: { id: string; name: string }[];
  selectedEmpIds?: Set<string>;
  onSelectedEmpIdsChange?: (s: Set<string>) => void;
  /** Lazy-load employee list when the user presses the filter trigger. */
  onEmployeePickerOpen?: () => void;
  employeePickerLoading?: boolean;

  statusFilter?: string;
  onStatusFilterChange?: (v: string) => void;
  statusOrder?: readonly string[];
  statusLabels?: Record<string, string>;
  statusCounts?: Record<string, number>;

  onDateBoundsChange?: (bounds: { from: string; to: string }) => void;
  onDateFilterMetaChange?: (meta: { tab: DateFilterTab; hasRestriction: boolean }) => void;

  /** Controlled period filter (optional). Pair with `onPeriodChange`. */
  periodValue?: PeriodRange;
  onPeriodChange?: (range: PeriodRange) => void;
  /** Default period for reset and active-state detection (derived from `defaultDateFilterTab` when omitted). */
  defaultPeriod?: PeriodRange;

  showDateSection?: boolean;
  showStatusSection?: boolean;
  showEmployeePicker?: boolean;
  /** Initial tab when the date section mounts (default `'today'`). */
  defaultDateFilterTab?: DateFilterTab;

  trailingActions?: React.ReactNode;
  /** Filters rendered first (rightmost in RTL), e.g. a custom date-range trigger */
  leadingFilters?: React.ReactNode;
  /** True when `leadingFilters` period differs from the page default (shows «مسح الكل»). */
  periodFilterActive?: boolean;
  /** Reset external period filter (`EntityPeriodFilter`) — invoked by «مسح الكل». */
  onPeriodFilterClear?: () => void;
  beforeEmployeePicker?: React.ReactNode;

  /** Primary inline selects always visible in the toolbar */
  inlineSelects?: readonly EntityFilterInlineSelect[];

  /** Secondary filters shown in a "More filters" popover */
  moreFilters?: readonly EntityFilterInlineSelect[];

  /**
   * `tabs` — قوائم منسدلة للفترات والحالات (الافتراضي).
   * `collapsible` — نفس عرض القوائم المنسدلة (متوافق مع الاسم السابق).
   */
  filterLayout?: 'tabs' | 'collapsible';

  /** تبديل عرض البيانات (جدول / شبكة / بطاقات / تقويم …) قبل `trailingActions` */
  dataView?: EntityDataViewConfig;
}

export const EntityFilterToolbar = React.forwardRef<
  EntityFilterToolbarHandle,
  EntityFilterToolbarProps
>(function EntityFilterToolbar(
  {
    empPickerEmployees = EMPTY_EMP_PICKER_LIST,
    selectedEmpIds = EMPTY_SELECTED_EMP_IDS,
    onSelectedEmpIdsChange = noopSetEmp,
    onEmployeePickerOpen,
    employeePickerLoading = false,
    statusFilter = 'all',
    onStatusFilterChange = noopStatus,
    statusOrder = EMPTY_STATUS_ORDER_LIST,
    statusLabels = EMPTY_STATUS_LABELS,
    statusCounts = DEFAULT_STATUS_COUNTS,
    onDateBoundsChange = noopBounds,
    onDateFilterMetaChange,
    periodValue,
    onPeriodChange,
    defaultPeriod,
    showDateSection = true,
    showStatusSection = true,
    showEmployeePicker = true,
    defaultDateFilterTab = 'today',
    trailingActions,
    leadingFilters,
    periodFilterActive = false,
    onPeriodFilterClear,
    beforeEmployeePicker,
    inlineSelects,
    moreFilters,
    filterLayout = 'tabs',
    dataView,
  },
  ref,
) {
  const resolvedDefaultPeriod = React.useMemo(
    () => defaultPeriod ?? effectiveDateRange(defaultDateFilterTab, '', ''),
    [defaultPeriod, defaultDateFilterTab],
  );

  const [internalPeriod, setInternalPeriod] = React.useState<PeriodRange>(resolvedDefaultPeriod);
  const isPeriodControlled = periodValue != null && onPeriodChange != null;
  const period = isPeriodControlled ? periodValue! : internalPeriod;

  React.useEffect(() => {
    if (!isPeriodControlled) {
      setInternalPeriod(resolvedDefaultPeriod);
    }
  }, [resolvedDefaultPeriod, isPeriodControlled]);

  const applyPeriod = React.useCallback((range: PeriodRange) => {
    if (isPeriodControlled) {
      onPeriodChange!(range);
    } else {
      setInternalPeriod(range);
    }
  }, [isPeriodControlled, onPeriodChange]);

  const onDateBoundsChangeRef = React.useRef(onDateBoundsChange);
  onDateBoundsChangeRef.current = onDateBoundsChange;
  const lastEmittedBoundsKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!showDateSection) return;
    const key = `${period.from}\u0000${period.to}`;
    if (lastEmittedBoundsKeyRef.current === key) return;
    lastEmittedBoundsKeyRef.current = key;
    onDateBoundsChangeRef.current(period);
  }, [showDateSection, period.from, period.to]);

  const onDateFilterMetaChangeRef = React.useRef(onDateFilterMetaChange);
  onDateFilterMetaChangeRef.current = onDateFilterMetaChange;
  const lastEmittedMetaKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!showDateSection) {
      const key = 'all|0';
      if (lastEmittedMetaKeyRef.current === key) return;
      lastEmittedMetaKeyRef.current = key;
      onDateFilterMetaChangeRef.current?.({ tab: 'all', hasRestriction: false });
      return;
    }
    const hasR = isPeriodFilterActive(period, resolvedDefaultPeriod);
    const key = `${hasR ? 'custom' : defaultDateFilterTab}|${hasR ? 1 : 0}`;
    if (lastEmittedMetaKeyRef.current === key) return;
    lastEmittedMetaKeyRef.current = key;
    onDateFilterMetaChangeRef.current?.({
      tab: hasR ? 'custom' : defaultDateFilterTab,
      hasRestriction: hasR,
    });
  }, [showDateSection, period, resolvedDefaultPeriod, defaultDateFilterTab]);

  const resetDateFilter = React.useCallback(() => {
    applyPeriod(resolvedDefaultPeriod);
  }, [applyPeriod, resolvedDefaultPeriod]);

  const resetStatusFilter = React.useCallback(() => {
    onStatusFilterChange('all');
  }, [onStatusFilterChange]);

  React.useImperativeHandle(ref, () => ({
    resetDateFilter,
    resetStatusFilter,
  }), [resetDateFilter, resetStatusFilter]);

  const internalPeriodActive = showDateSection && isPeriodFilterActive(period, resolvedDefaultPeriod);

  const statusSelectValue =
    statusFilter === 'all' || statusOrder.includes(statusFilter) ? statusFilter : 'all';

  const useFilterDropdowns = filterLayout === 'tabs' || filterLayout === 'collapsible';

  const statusFilterControl = useFilterDropdowns && showStatusSection && statusOrder.length > 0 ? (
    <SelectWithClear
      value={statusSelectValue === 'all' ? '' : statusSelectValue}
      onValueChange={(v) => onStatusFilterChange(v || 'all')}
      onClear={resetStatusFilter}
      placeholder="اختر الحالة"
      className="w-[9.25rem] max-w-[9.25rem]"
    >
      {statusOrder.map((s) => (
        <SelectItem key={s} value={s}>
          {statusLabels[s] ?? s}
        </SelectItem>
      ))}
    </SelectWithClear>
  ) : null;

  const periodFilterControl = showDateSection ? (
    <EntityPeriodFilter
      value={period}
      onChange={applyPeriod}
      triggerClassName="w-[11rem] max-w-[14rem]"
    />
  ) : null;

  const hasSecondaryFilters =
    Boolean(inlineSelects?.length) || Boolean(beforeEmployeePicker) || showEmployeePicker;
  const hasDataView = Boolean(dataView && dataView.options.length >= 2);
  const hasActionStrip = hasDataView || Boolean(trailingActions);

  const pickerBlock = hasSecondaryFilters ? (
    <>
      {inlineSelects?.map((sel) => {
        const allowed = new Set(sel.options.map((o) => o.value));
        const coerced =
          allowed.has(sel.value)
            ? sel.value
            : (sel.options.find((o) => o.value === 'all')?.value ?? sel.options[0]?.value ?? '');
        if (!sel.options.length) return null;
        return (
          <SelectWithClear
            key={sel.id}
            value={coerced === 'all' ? '' : coerced}
            onValueChange={(v) => sel.onChange(v || 'all')}
            onClear={() => sel.onChange('all')}
            placeholder={sel.placeholder ?? '—'}
            onOpenChange={(open) => {
              if (open) sel.onOpen?.();
            }}
            className={cn('w-[9rem] max-w-[9rem]', sel.className)}
          >
            {sel.options.filter((o) => o.value !== 'all' && o.value !== '').map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectWithClear>
        );
      })}
      {beforeEmployeePicker}
      {showEmployeePicker ? (
        <EmployeePicker
          employees={empPickerEmployees}
          selected={selectedEmpIds}
          onChange={onSelectedEmpIdsChange}
          loading={employeePickerLoading}
          onRequestLoad={onEmployeePickerOpen}
        />
      ) : null}
    </>
  ) : null;


  const [moreFiltersOpen, setMoreFiltersOpen] = React.useState(false);
  const activeMoreCount = React.useMemo(
    () => moreFilters?.filter((f) => f.value !== 'all' && f.value !== '').length ?? 0,
    [moreFilters],
  );

  const hasAnyActiveFilter = React.useMemo(() =>
    periodFilterActive ||
    internalPeriodActive ||
    (showEmployeePicker && selectedEmpIds.size > 0) ||
    (showStatusSection && statusFilter !== 'all') ||
    (inlineSelects?.some((s) => s.value !== 'all' && s.value !== '') ?? false) ||
    (moreFilters?.some((s) => s.value !== 'all' && s.value !== '') ?? false),
    [
      periodFilterActive,
      internalPeriodActive,
      showEmployeePicker,
      selectedEmpIds.size,
      showStatusSection,
      statusFilter,
      inlineSelects,
      moreFilters,
    ],
  );

  const clearAllFilters = React.useCallback(() => {
    onPeriodFilterClear?.();
    resetDateFilter();
    resetStatusFilter();
    if (showEmployeePicker) onSelectedEmpIdsChange(new Set());
    inlineSelects?.forEach((s) => s.onChange('all'));
    moreFilters?.forEach((s) => s.onChange('all'));
  }, [
    onPeriodFilterClear,
    resetDateFilter,
    resetStatusFilter,
    showEmployeePicker,
    onSelectedEmpIdsChange,
    inlineSelects,
    moreFilters,
  ]);

  const moreFiltersPopover = moreFilters?.length ? (
    <Popover open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'relative h-8 gap-1.5 px-3 text-xs shrink-0',
            activeMoreCount > 0 && 'border-primary/50 bg-primary/5 text-primary hover:bg-primary/10',
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          فلاتر
          {activeMoreCount > 0 && (
            <Badge
              variant="secondary"
              className="ms-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground"
            >
              {activeMoreCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-72 p-4"
        dir="rtl"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">فلاتر إضافية</p>
          {activeMoreCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => {
                moreFilters.forEach((f) => {
                  const allOpt = f.options.find((o) => o.value === 'all');
                  if (allOpt) f.onChange('all');
                });
              }}
            >
              <X className="h-3 w-3" />
              إعادة ضبط
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {moreFilters.map((sel) => {
            const allowed = new Set(sel.options.map((o) => o.value));
            const coerced = allowed.has(sel.value)
              ? sel.value
              : (sel.options.find((o) => o.value === 'all')?.value ?? sel.options[0]?.value ?? '');
            if (!sel.options.length) return null;
            const isActive = coerced !== 'all' && coerced !== '';
            return (
              <div key={sel.id} className="space-y-1.5">
                <label className={cn('block text-xs font-medium', isActive ? 'text-primary' : 'text-muted-foreground')}>
                  {sel.placeholder ?? sel.id}
                </label>
                <SelectWithClear
                  value={coerced === 'all' ? '' : coerced}
                  onValueChange={(v) => sel.onChange(v || 'all')}
                  onClear={() => sel.onChange('all')}
                  placeholder={sel.placeholder ?? '—'}
                  className={cn('w-full', isActive && 'border-primary/40 bg-primary/5')}
                >
                  {sel.options.filter((o) => o.value !== 'all').map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectWithClear>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  ) : null;

  return (
    <>
      <div className="rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 shadow-sm backdrop-blur-sm overflow-visible sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2">
          {leadingFilters}
          {leadingFilters ? (
            <>
              {periodFilterControl}
              {pickerBlock}
              {statusFilterControl}
            </>
          ) : (
            <>
              {periodFilterControl}
              {statusFilterControl}
              {pickerBlock}
            </>
          )}
          {moreFiltersPopover}
          {hasAnyActiveFilter && (
            <button
              type="button"
              aria-label="مسح كل الفلاتر"
              className="flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={clearAllFilters}
            >
              <X className="h-3.5 w-3.5" />
              مسح الكل
            </button>
          )}
          {hasDataView && dataView ? (
            <div className="ms-auto">
              <Tabs value={dataView.value} onValueChange={dataView.onChange}>
                <TabsList className="h-8 shrink-0 gap-0.5 bg-muted/70 p-0.5">
                  {dataView.options.map((opt) => (
                    <TabsTrigger
                      key={opt.value}
                      value={opt.value}
                      className={DATA_VIEW_TAB_CLASS}
                      aria-label={opt.label}
                      title={opt.label}
                    >
                      <DataViewIcon name={opt.icon} />
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          ) : null}
          {trailingActions && (
            <div className={cn('flex items-center gap-2', !hasDataView && 'ms-auto')}>
              {trailingActions}
            </div>
          )}
        </div>
      </div>
    </>
  );
});
