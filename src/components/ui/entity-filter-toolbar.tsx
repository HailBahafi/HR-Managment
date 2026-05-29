'use client';

import * as React from 'react';
import {
  CalendarDays, LayoutGrid, List, X, SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/shared/utils';
import type { DateFilterTab } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  effectiveDateRange,
  dateFilterHasRestriction,
  hasDateRangeFilter,
  todayYMD,
  thisWeekSunSatYMD,
  thisCalendarMonthYMD,
  ymdToMDYDisplay,
} from '@/features/hr/discipline/lib/discipline-date-filter';

export const DATE_TAB_BASE =
  'discipline-tab-trigger shrink-0 gap-1 px-3 text-[11px] transition-all duration-150 border';

const TAB_ACTIVE_SHELL =
  'data-[state=active]:!font-semibold data-[state=active]:!shadow-md data-[state=active]:ring-2 data-[state=active]:ring-offset-2 data-[state=active]:ring-offset-background data-[state=active]:border data-[state=active]:z-[1]';

export const DATE_TAB_TRIGGER_CLASS: Record<DateFilterTab, string> = {
  all: cn(
    DATE_TAB_BASE,
    'border-transparent bg-slate-100/85 text-slate-700 dark:bg-slate-800/55 dark:text-slate-200',
    TAB_ACTIVE_SHELL,
    'data-[state=active]:!bg-white data-[state=active]:!text-slate-950 data-[state=active]:border-slate-400/90 data-[state=active]:ring-slate-400/65',
    'dark:data-[state=active]:!bg-slate-600 dark:data-[state=active]:!text-white dark:data-[state=active]:border-slate-500 dark:data-[state=active]:ring-slate-400/45',
  ),
  today: cn(
    DATE_TAB_BASE,
    'border-transparent bg-sky-50 text-sky-800 dark:bg-sky-950/35 dark:text-sky-200',
    TAB_ACTIVE_SHELL,
    'data-[state=active]:!bg-sky-100 data-[state=active]:!text-sky-950 data-[state=active]:border-sky-400/75 data-[state=active]:ring-sky-400/55',
    'dark:data-[state=active]:!bg-sky-900/70 dark:data-[state=active]:!text-sky-50 dark:data-[state=active]:border-sky-500 dark:data-[state=active]:ring-sky-400/40',
  ),
  week: cn(
    DATE_TAB_BASE,
    'border-transparent bg-violet-50 text-violet-800 dark:bg-violet-950/35 dark:text-violet-200',
    TAB_ACTIVE_SHELL,
    'data-[state=active]:!bg-violet-100 data-[state=active]:!text-violet-950 data-[state=active]:border-violet-400/75 data-[state=active]:ring-violet-400/55',
    'dark:data-[state=active]:!bg-violet-900/65 dark:data-[state=active]:!text-violet-50 dark:data-[state=active]:border-violet-500 dark:data-[state=active]:ring-violet-400/40',
  ),
  month: cn(
    DATE_TAB_BASE,
    'border-transparent bg-teal-50 text-teal-800 dark:bg-teal-950/35 dark:text-teal-200',
    TAB_ACTIVE_SHELL,
    'data-[state=active]:!bg-teal-100 data-[state=active]:!text-teal-950 data-[state=active]:border-teal-400/75 data-[state=active]:ring-teal-400/55',
    'dark:data-[state=active]:!bg-teal-900/65 dark:data-[state=active]:!text-teal-50 dark:data-[state=active]:border-teal-500 dark:data-[state=active]:ring-teal-400/40',
  ),
  custom: cn(
    DATE_TAB_BASE,
    'border-transparent bg-amber-50 text-amber-900 dark:bg-amber-950/35 dark:text-amber-200',
    TAB_ACTIVE_SHELL,
    'data-[state=active]:!bg-amber-100 data-[state=active]:!text-amber-950 data-[state=active]:border-amber-400/80 data-[state=active]:ring-amber-400/55',
    'dark:data-[state=active]:!bg-amber-900/65 dark:data-[state=active]:!text-amber-50 dark:data-[state=active]:border-amber-500 dark:data-[state=active]:ring-amber-400/40',
  ),
};

export const STATUS_COUNT_BADGE =
  'me-1.5 rounded-md bg-white/65 px-1.5 py-0.5 font-mono text-[10px] tabular-nums dark:bg-black/25 group-data-[state=active]:bg-white/95 group-data-[state=active]:shadow-sm dark:group-data-[state=active]:bg-black/45';

export const STATUS_ALL_TRIGGER_CLASS = cn(
  DATE_TAB_BASE,
  'group border-transparent bg-slate-100/85 text-slate-700 dark:bg-slate-800/55 dark:text-slate-200',
  TAB_ACTIVE_SHELL,
  'data-[state=active]:!bg-white data-[state=active]:!text-slate-950 data-[state=active]:border-slate-400/90 data-[state=active]:ring-slate-400/65',
  'dark:data-[state=active]:!bg-slate-600 dark:data-[state=active]:!text-white dark:data-[state=active]:border-slate-500 dark:data-[state=active]:ring-slate-400/45',
);

export const STATUS_CYCLE_TRIGGER_CLASSES = [
  cn(
    'border-transparent bg-sky-50 text-sky-800 dark:bg-sky-950/35 dark:text-sky-200',
    TAB_ACTIVE_SHELL,
    'data-[state=active]:!bg-sky-100 data-[state=active]:!text-sky-950 data-[state=active]:border-sky-400/75 data-[state=active]:ring-sky-400/55',
    'dark:data-[state=active]:!bg-sky-900/70 dark:data-[state=active]:!text-sky-50 dark:data-[state=active]:border-sky-500 dark:data-[state=active]:ring-sky-400/40',
  ),
  cn(
    'border-transparent bg-emerald-50 text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200',
    TAB_ACTIVE_SHELL,
    'data-[state=active]:!bg-emerald-100 data-[state=active]:!text-emerald-950 data-[state=active]:border-emerald-400/75 data-[state=active]:ring-emerald-400/55',
    'dark:data-[state=active]:!bg-emerald-900/65 dark:data-[state=active]:!text-emerald-50 dark:data-[state=active]:border-emerald-500 dark:data-[state=active]:ring-emerald-400/40',
  ),
  cn(
    'border-transparent bg-violet-50 text-violet-800 dark:bg-violet-950/35 dark:text-violet-200',
    TAB_ACTIVE_SHELL,
    'data-[state=active]:!bg-violet-100 data-[state=active]:!text-violet-950 data-[state=active]:border-violet-400/75 data-[state=active]:ring-violet-400/55',
    'dark:data-[state=active]:!bg-violet-900/65 dark:data-[state=active]:!text-violet-50 dark:data-[state=active]:border-violet-500 dark:data-[state=active]:ring-violet-400/40',
  ),
  cn(
    'border-transparent bg-amber-50 text-amber-900 dark:bg-amber-950/35 dark:text-amber-200',
    TAB_ACTIVE_SHELL,
    'data-[state=active]:!bg-amber-100 data-[state=active]:!text-amber-950 data-[state=active]:border-amber-400/80 data-[state=active]:ring-amber-400/55',
    'dark:data-[state=active]:!bg-amber-900/65 dark:data-[state=active]:!text-amber-50 dark:data-[state=active]:border-amber-500 dark:data-[state=active]:ring-amber-400/40',
  ),
  cn(
    'border-transparent bg-rose-50 text-rose-800 dark:bg-rose-950/35 dark:text-rose-200',
    TAB_ACTIVE_SHELL,
    'data-[state=active]:!bg-rose-100 data-[state=active]:!text-rose-950 data-[state=active]:border-rose-400/75 data-[state=active]:ring-rose-400/55',
    'dark:data-[state=active]:!bg-rose-900/65 dark:data-[state=active]:!text-rose-50 dark:data-[state=active]:border-rose-500 dark:data-[state=active]:ring-rose-400/40',
  ),
  cn(
    'border-transparent bg-cyan-50 text-cyan-800 dark:bg-cyan-950/35 dark:text-cyan-200',
    TAB_ACTIVE_SHELL,
    'data-[state=active]:!bg-cyan-100 data-[state=active]:!text-cyan-950 data-[state=active]:border-cyan-400/75 data-[state=active]:ring-cyan-400/55',
    'dark:data-[state=active]:!bg-cyan-900/65 dark:data-[state=active]:!text-cyan-50 dark:data-[state=active]:border-cyan-500 dark:data-[state=active]:ring-cyan-400/40',
  ),
  cn(
    'border-transparent bg-indigo-50 text-indigo-800 dark:bg-indigo-950/35 dark:text-indigo-200',
    TAB_ACTIVE_SHELL,
    'data-[state=active]:!bg-indigo-100 data-[state=active]:!text-indigo-950 data-[state=active]:border-indigo-400/75 data-[state=active]:ring-indigo-400/55',
    'dark:data-[state=active]:!bg-indigo-900/65 dark:data-[state=active]:!text-indigo-50 dark:data-[state=active]:border-indigo-500 dark:data-[state=active]:ring-indigo-400/40',
  ),
  cn(
    'border-transparent bg-orange-50 text-orange-900 dark:bg-orange-950/35 dark:text-orange-200',
    TAB_ACTIVE_SHELL,
    'data-[state=active]:!bg-orange-100 data-[state=active]:!text-orange-950 data-[state=active]:border-orange-400/75 data-[state=active]:ring-orange-400/55',
    'dark:data-[state=active]:!bg-orange-900/65 dark:data-[state=active]:!text-orange-50 dark:data-[state=active]:border-orange-500 dark:data-[state=active]:ring-orange-400/40',
  ),
];

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
  'entity-toolbar-view-tab h-7 gap-1 px-2.5 text-[11px] transition-all duration-150 data-[state=active]:!font-semibold data-[state=active]:!shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/40 data-[state=active]:ring-offset-2 data-[state=active]:ring-offset-background data-[state=active]:border data-[state=active]:border-primary/35';

function DataViewIcon({ name }: { name?: EntityDataViewIcon }) {
  switch (name) {
    case 'layout-grid':
      return <LayoutGrid className="h-3 w-3 shrink-0" />;
    case 'calendar-days':
      return <CalendarDays className="h-3 w-3 shrink-0" />;
    case 'list':
    default:
      return <List className="h-3 w-3 shrink-0" />;
  }
}

export interface EntityFilterToolbarProps {
  empPickerEmployees?: { id: string; name: string }[];
  selectedEmpIds?: Set<string>;
  onSelectedEmpIdsChange?: (s: Set<string>) => void;

  statusFilter?: string;
  onStatusFilterChange?: (v: string) => void;
  statusOrder?: readonly string[];
  statusLabels?: Record<string, string>;
  statusCounts?: Record<string, number>;

  onDateBoundsChange?: (bounds: { from: string; to: string }) => void;
  onDateFilterMetaChange?: (meta: { tab: DateFilterTab; hasRestriction: boolean }) => void;

  showDateSection?: boolean;
  showStatusSection?: boolean;
  showEmployeePicker?: boolean;
  /** Initial tab when the date section mounts (default `'all'`). */
  defaultDateFilterTab?: DateFilterTab;

  trailingActions?: React.ReactNode;
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

// ─── Shared clearable select used by every filter dropdown in the toolbar ─────

function SelectWithClear({
  value,
  onValueChange,
  onClear,
  placeholder,
  children,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  onClear: () => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const isActive = value !== '' && value !== undefined;
  return (
    <div className="relative shrink-0">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          dir="rtl"
          hideChevron={isActive}
          className={cn(
            'h-8 text-xs overflow-hidden [&_span]:truncate',
            'focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus:border-input',
            'data-[state=open]:ring-0 data-[state=open]:border-input',
            className,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent dir="rtl">
          {children}
        </SelectContent>
      </Select>
      {isActive && (
        <button
          type="button"
          aria-label="مسح"
          className="absolute end-2 top-1/2 -translate-y-1/2 z-10 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.stopPropagation(); onClear(); }}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export const EntityFilterToolbar = React.forwardRef<
  EntityFilterToolbarHandle,
  EntityFilterToolbarProps
>(function EntityFilterToolbar(
  {
    empPickerEmployees = EMPTY_EMP_PICKER_LIST,
    selectedEmpIds = EMPTY_SELECTED_EMP_IDS,
    onSelectedEmpIdsChange = noopSetEmp,
    statusFilter = 'all',
    onStatusFilterChange = noopStatus,
    statusOrder = EMPTY_STATUS_ORDER_LIST,
    statusLabels = EMPTY_STATUS_LABELS,
    statusCounts = DEFAULT_STATUS_COUNTS,
    onDateBoundsChange = noopBounds,
    onDateFilterMetaChange,
    showDateSection = true,
    showStatusSection = true,
    showEmployeePicker = true,
    defaultDateFilterTab = 'all',
    trailingActions,
    beforeEmployeePicker,
    inlineSelects,
    moreFilters,
    filterLayout = 'tabs',
    dataView,
  },
  ref,
) {
  const [dateFilterTab, setDateFilterTab] = React.useState<DateFilterTab>(defaultDateFilterTab);
  const [appliedCustomFrom, setAppliedCustomFrom] = React.useState('');
  const [appliedCustomTo, setAppliedCustomTo] = React.useState('');
  const [customDialogOpen, setCustomDialogOpen] = React.useState(false);
  const [dialogFromDate, setDialogFromDate] = React.useState<Date | undefined>(undefined);
  const [dialogToDate, setDialogToDate] = React.useState<Date | undefined>(undefined);
  const [fromCalOpen, setFromCalOpen] = React.useState(false);
  const [toCalOpen, setToCalOpen] = React.useState(false);

  const effectiveBounds = React.useMemo(
    () => (showDateSection ? effectiveDateRange(dateFilterTab, appliedCustomFrom, appliedCustomTo) : { from: '', to: '' }),
    [showDateSection, dateFilterTab, appliedCustomFrom, appliedCustomTo],
  );

  const onDateBoundsChangeRef = React.useRef(onDateBoundsChange);
  onDateBoundsChangeRef.current = onDateBoundsChange;
  const lastEmittedBoundsKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const b = effectiveBounds;
    const key = `${b.from}\u0000${b.to}`;
    if (lastEmittedBoundsKeyRef.current === key) return;
    lastEmittedBoundsKeyRef.current = key;
    onDateBoundsChangeRef.current(b);
  }, [effectiveBounds]);

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
    const hasR = dateFilterHasRestriction(dateFilterTab, appliedCustomFrom, appliedCustomTo);
    const key = `${dateFilterTab}|${hasR ? 1 : 0}`;
    if (lastEmittedMetaKeyRef.current === key) return;
    lastEmittedMetaKeyRef.current = key;
    onDateFilterMetaChangeRef.current?.({
      tab: dateFilterTab,
      hasRestriction: hasR,
    });
  }, [showDateSection, dateFilterTab, appliedCustomFrom, appliedCustomTo]);

  const ymdToDate = (ymd: string): Date | undefined => {
    if (!ymd) return undefined;
    const [y, m, d] = ymd.split('-').map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
  };

  const dateToYmd = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const openCustomDateDialog = React.useCallback(() => {
    setDialogFromDate(ymdToDate(appliedCustomFrom));
    setDialogToDate(ymdToDate(appliedCustomTo));
    setCustomDialogOpen(true);
  }, [appliedCustomFrom, appliedCustomTo]);

  const applyCustomDialog = React.useCallback(() => {
    if (!dialogFromDate || !dialogToDate) return;
    setAppliedCustomFrom(dateToYmd(dialogFromDate));
    setAppliedCustomTo(dateToYmd(dialogToDate));
    setCustomDialogOpen(false);
  }, [dialogFromDate, dialogToDate]);

  const fillDialogToday = React.useCallback(() => {
    const t = ymdToDate(todayYMD());
    setDialogFromDate(t);
    setDialogToDate(t);
  }, []);

  const fillDialogThisWeek = React.useCallback(() => {
    const { from, to } = thisWeekSunSatYMD();
    setDialogFromDate(ymdToDate(from));
    setDialogToDate(ymdToDate(to));
  }, []);

  const fillDialogThisMonth = React.useCallback(() => {
    const { from, to } = thisCalendarMonthYMD();
    setDialogFromDate(ymdToDate(from));
    setDialogToDate(ymdToDate(to));
  }, []);

  const resetDateFilter = React.useCallback(() => {
    setDateFilterTab('all');
    setAppliedCustomFrom('');
    setAppliedCustomTo('');
  }, []);

  const resetStatusFilter = React.useCallback(() => {
    onStatusFilterChange('all');
  }, [onStatusFilterChange]);

  const prevDateTabRef = React.useRef<DateFilterTab>('all');

  const handleDatePeriodSelect = React.useCallback((v: string) => {
    const next = v as DateFilterTab;
    if (next === 'custom') {
      prevDateTabRef.current = dateFilterTab;
      setDateFilterTab('custom');
      openCustomDateDialog();
      return;
    }
    setDateFilterTab(next);
  }, [dateFilterTab, openCustomDateDialog]);

  React.useImperativeHandle(ref, () => ({
    resetDateFilter,
    resetStatusFilter,
  }), [resetDateFilter, resetStatusFilter]);

  const showDateReset = showDateSection && dateFilterTab !== 'all';
  const showStatusReset = showStatusSection && statusFilter !== 'all';

  const dateTabForSelect: DateFilterTab =
    dateFilterTab === 'all' || dateFilterTab === 'today' || dateFilterTab === 'week' || dateFilterTab === 'month' || dateFilterTab === 'custom'
      ? dateFilterTab
      : 'all';

  const statusSelectValue =
    statusFilter === 'all' || statusOrder.includes(statusFilter) ? statusFilter : 'all';

  const useFilterDropdowns = filterLayout === 'tabs' || filterLayout === 'collapsible';

  const dateCustomRangeRow = showDateSection && dateFilterTab === 'custom' ? (
    <div className="flex w-full min-w-0 max-w-full basis-full shrink-0 flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-border/40 bg-muted/15 px-2 py-1.5">
      <p className="min-w-0 text-[11px] text-muted-foreground" dir="ltr">
        {hasDateRangeFilter(appliedCustomFrom, appliedCustomTo)
          ? (
            <>
              <span className="text-foreground/80">المحدد:</span>
              {' '}
              {ymdToMDYDisplay(appliedCustomFrom) || '…'}
              {' — '}
              {ymdToMDYDisplay(appliedCustomTo) || '…'}
            </>
            )
          : 'لم يُحدَّد نطاق. استخدم «اختيار التواريخ» ثم تأكيد.'}
      </p>
      <Button type="button" variant="outline" size="sm" className="h-7 shrink-0 text-[11px]" onClick={openCustomDateDialog}>
        {hasDateRangeFilter(appliedCustomFrom, appliedCustomTo) ? 'تعديل النطاق' : 'اختيار التواريخ'}
      </Button>
    </div>
  ) : null;

  const filterDropdownRow = useFilterDropdowns && (showDateSection || showStatusSection) ? (
    <>
      <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-x-2 gap-y-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {showDateSection ? (
          <SelectWithClear
            value={dateTabForSelect === 'all' ? '' : dateTabForSelect}
            onValueChange={(v) => handleDatePeriodSelect(v || 'all')}
            onClear={resetDateFilter}
            placeholder="اختر الفترة"
            className="w-[9.25rem] max-w-[9.25rem]"
          >
            <SelectItem value="today">اليوم</SelectItem>
            <SelectItem value="week">هذا الأسبوع</SelectItem>
            <SelectItem value="month">هذا الشهر</SelectItem>
            <SelectItem value="custom">مخصص…</SelectItem>
          </SelectWithClear>
        ) : null}
        {showStatusSection ? (
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
        ) : null}
      </div>
      {dateCustomRangeRow}
    </>
  ) : null;

  const hasSecondaryFilters =
    Boolean(inlineSelects?.length) || Boolean(beforeEmployeePicker) || showEmployeePicker;
  const hasDataView = Boolean(dataView && dataView.options.length >= 2);
  const hasActionStrip = hasDataView || Boolean(trailingActions);


  const [moreFiltersOpen, setMoreFiltersOpen] = React.useState(false);
  const activeMoreCount = React.useMemo(
    () => moreFilters?.filter((f) => f.value !== 'all' && f.value !== '').length ?? 0,
    [moreFilters],
  );

  const hasAnyActiveFilter = React.useMemo(() =>
    (showDateSection && dateFilterTab !== 'all') ||
    (showStatusSection && statusFilter !== 'all') ||
    (inlineSelects?.some((s) => s.value !== 'all' && s.value !== '') ?? false) ||
    (moreFilters?.some((s) => s.value !== 'all' && s.value !== '') ?? false),
    [showDateSection, dateFilterTab, showStatusSection, statusFilter, inlineSelects, moreFilters],
  );

  const clearAllFilters = React.useCallback(() => {
    resetDateFilter();
    resetStatusFilter();
    inlineSelects?.forEach((s) => s.onChange('all'));
    moreFilters?.forEach((s) => s.onChange('all'));
  }, [resetDateFilter, resetStatusFilter, inlineSelects, moreFilters]);

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
      <div className="rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 shadow-sm backdrop-blur-sm sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2">
          {filterDropdownRow}
          {hasSecondaryFilters ? (
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
                    className={cn('w-[9rem] max-w-[9rem]', sel.className)}
                  >
                    {sel.options.filter((o) => o.value !== 'all').map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectWithClear>
                );
              })}
              {beforeEmployeePicker}
              {showEmployeePicker ? (
                <EmployeePicker employees={empPickerEmployees} selected={selectedEmpIds} onChange={onSelectedEmpIdsChange} />
              ) : null}
            </>
          ) : null}
          {moreFiltersPopover}
          {hasDataView && dataView ? (
            <div className="ms-auto">
              <Tabs value={dataView.value} onValueChange={dataView.onChange}>
                <TabsList className="h-8 shrink-0 gap-0.5 bg-muted/70 p-0.5">
                  {dataView.options.map((opt) => (
                    <TabsTrigger key={opt.value} value={opt.value} className={DATA_VIEW_TAB_CLASS}>
                      <DataViewIcon name={opt.icon} />
                      {opt.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          ) : null}
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
        </div>
      </div>

      {showDateSection ? (
        <Dialog open={customDialogOpen} onOpenChange={(open) => {
          if (!open && !appliedCustomFrom && !appliedCustomTo) {
            setDateFilterTab(prevDateTabRef.current);
          }
          setCustomDialogOpen(open);
        }}>
          <DialogContent className="border-border sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>نطاق تاريخ مخصص</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">من</label>
                  <Popover open={fromCalOpen} onOpenChange={setFromCalOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start gap-2 text-sm font-normal',
                          !dialogFromDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarDays className="h-4 w-4 shrink-0 opacity-60" />
                        {dialogFromDate
                          ? dialogFromDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'اختر تاريخاً'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dialogFromDate}
                        onSelect={(d) => { setDialogFromDate(d); setFromCalOpen(false); }}
                        disabled={(d) => dialogToDate ? d > dialogToDate : false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">إلى</label>
                  <Popover open={toCalOpen} onOpenChange={setToCalOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start gap-2 text-sm font-normal',
                          !dialogToDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarDays className="h-4 w-4 shrink-0 opacity-60" />
                        {dialogToDate
                          ? dialogToDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'اختر تاريخاً'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dialogToDate}
                        onSelect={(d) => { setDialogToDate(d); setToCalOpen(false); }}
                        disabled={(d) => dialogFromDate ? d < dialogFromDate : false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCustomDialogOpen(false);
                  if (!appliedCustomFrom && !appliedCustomTo) {
                    setDateFilterTab(prevDateTabRef.current);
                  }
                }}
              >
                إلغاء
              </Button>
              <Button type="button" onClick={applyCustomDialog} disabled={!dialogFromDate || !dialogToDate}>
                تأكيد
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
});
