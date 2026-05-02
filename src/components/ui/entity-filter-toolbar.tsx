'use client';

import * as React from 'react';
import {
  CalendarDays, LayoutGrid, List, X,
} from 'lucide-react';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormField } from '@/components/hr-requests/shared-ui';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { DateFilterTab } from '@/lib/hr-discipline/discipline-date-filter';
import {
  effectiveDateRange,
  dateFilterHasRestriction,
  hasDateRangeFilter,
  parseMDYToYMD,
  todayYMD,
  thisWeekSunSatYMD,
  thisCalendarMonthYMD,
  ymdToMDYDisplay,
} from '@/lib/hr-discipline/discipline-date-filter';

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

  /** قوائم فرعية (فرع، قسم، نوع، …) بدون تكرار في الشريط الجانبي */
  inlineSelects?: readonly EntityFilterInlineSelect[];

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
    filterLayout = 'tabs',
    dataView,
  },
  ref,
) {
  const [dateFilterTab, setDateFilterTab] = React.useState<DateFilterTab>(defaultDateFilterTab);
  const [appliedCustomFrom, setAppliedCustomFrom] = React.useState('');
  const [appliedCustomTo, setAppliedCustomTo] = React.useState('');
  const [customDialogOpen, setCustomDialogOpen] = React.useState(false);
  const [dialogFromMDY, setDialogFromMDY] = React.useState('');
  const [dialogToMDY, setDialogToMDY] = React.useState('');

  const effectiveBounds = React.useMemo(
    () => (showDateSection ? effectiveDateRange(dateFilterTab, appliedCustomFrom, appliedCustomTo) : { from: '', to: '' }),
    [showDateSection, dateFilterTab, appliedCustomFrom, appliedCustomTo],
  );

  const onDateBoundsChangeRef = React.useRef(onDateBoundsChange);
  onDateBoundsChangeRef.current = onDateBoundsChange;
  React.useEffect(() => {
    onDateBoundsChangeRef.current(effectiveBounds);
  }, [effectiveBounds]);

  const onDateFilterMetaChangeRef = React.useRef(onDateFilterMetaChange);
  onDateFilterMetaChangeRef.current = onDateFilterMetaChange;
  React.useEffect(() => {
    if (!showDateSection) {
      onDateFilterMetaChangeRef.current?.({ tab: 'all', hasRestriction: false });
      return;
    }
    onDateFilterMetaChangeRef.current?.({
      tab: dateFilterTab,
      hasRestriction: dateFilterHasRestriction(dateFilterTab, appliedCustomFrom, appliedCustomTo),
    });
  }, [showDateSection, dateFilterTab, appliedCustomFrom, appliedCustomTo]);

  const openCustomDateDialog = React.useCallback(() => {
    setDialogFromMDY(appliedCustomFrom ? ymdToMDYDisplay(appliedCustomFrom) : '');
    setDialogToMDY(appliedCustomTo ? ymdToMDYDisplay(appliedCustomTo) : '');
    setCustomDialogOpen(true);
  }, [appliedCustomFrom, appliedCustomTo]);

  const applyCustomDialog = React.useCallback(() => {
    const parsedFrom = parseMDYToYMD(dialogFromMDY);
    const parsedTo = parseMDYToYMD(dialogToMDY);
    if (parsedFrom === null || parsedTo === null) {
      toast.error('صيغة التاريخ غير صحيحة. استخدم mm/dd/yyyy');
      return;
    }
    setAppliedCustomFrom(parsedFrom);
    setAppliedCustomTo(parsedTo);
    setCustomDialogOpen(false);
  }, [dialogFromMDY, dialogToMDY]);

  const fillDialogToday = React.useCallback(() => {
    const t = todayYMD();
    setDialogFromMDY(ymdToMDYDisplay(t));
    setDialogToMDY(ymdToMDYDisplay(t));
  }, []);

  const fillDialogThisWeek = React.useCallback(() => {
    const { from, to } = thisWeekSunSatYMD();
    setDialogFromMDY(ymdToMDYDisplay(from));
    setDialogToMDY(ymdToMDYDisplay(to));
  }, []);

  const fillDialogThisMonth = React.useCallback(() => {
    const { from, to } = thisCalendarMonthYMD();
    setDialogFromMDY(ymdToMDYDisplay(from));
    setDialogToMDY(ymdToMDYDisplay(to));
  }, []);

  const resetDateFilter = React.useCallback(() => {
    setDateFilterTab('all');
    setAppliedCustomFrom('');
    setAppliedCustomTo('');
  }, []);

  const resetStatusFilter = React.useCallback(() => {
    onStatusFilterChange('all');
  }, [onStatusFilterChange]);

  const handleDatePeriodSelect = React.useCallback((v: string) => {
    const next = v as DateFilterTab;
    if (next === 'custom') {
      setDateFilterTab('custom');
      openCustomDateDialog();
      return;
    }
    setDateFilterTab(next);
  }, [openCustomDateDialog]);

  React.useImperativeHandle(ref, () => ({
    resetDateFilter,
    resetStatusFilter,
  }), [resetDateFilter, resetStatusFilter]);

  const showDateReset = showDateSection && dateFilterTab !== 'all';
  const showStatusReset = showStatusSection && statusFilter !== 'all';

  const useFilterDropdowns = filterLayout === 'tabs' || filterLayout === 'collapsible';

  const dateCustomRangeRow = showDateSection && dateFilterTab === 'custom' ? (
    <div className="flex w-full max-w-full flex-wrap items-center justify-between gap-2 border-border/40 border-dashed bg-muted/15 px-2 py-1.5 rounded-md">
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
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {showDateSection ? (
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">الفترات</span>
            <Select value={dateFilterTab} onValueChange={handleDatePeriodSelect}>
              <SelectTrigger className="h-8 w-[min(100%,12.5rem)] text-xs" dir="rtl" aria-label="فلتر الفترة">
                <SelectValue placeholder="الفترة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفترات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
                <SelectItem value="custom">مخصص…</SelectItem>
              </SelectContent>
            </Select>
            {showDateReset ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="إعادة ضبط الفترات"
                title="إعادة ضبط الفترات"
                onClick={(e) => {
                  e.preventDefault();
                  resetDateFilter();
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        ) : null}
        {showStatusSection ? (
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">الحالات</span>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="h-8 w-[min(100%,14rem)] text-xs" dir="rtl" aria-label="فلتر الحالة">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {`الكل (${statusCounts.all ?? 0})`}
                </SelectItem>
                {statusOrder.map((s) => (
                  <SelectItem key={s} value={s}>
                    {`${statusLabels[s] ?? s} (${statusCounts[s] ?? 0})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showStatusReset ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="إعادة ضبط الحالات"
                title="إعادة ضبط الحالات"
                onClick={(e) => {
                  e.preventDefault();
                  resetStatusFilter();
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {dateCustomRangeRow}
    </div>
  ) : null;

  return (
    <>
      <div className="rounded-lg border border-border/50 bg-card/50 px-3 py-2 shadow-sm sm:px-4">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            {filterDropdownRow}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {inlineSelects?.map((sel) => (
              <Select key={sel.id} value={sel.value} onValueChange={sel.onChange}>
                <SelectTrigger className={cn('h-8 min-w-[8.5rem] max-w-[13rem] text-xs', sel.className)}>
                  <SelectValue placeholder={sel.placeholder ?? '—'} />
                </SelectTrigger>
                <SelectContent>
                  {sel.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            {beforeEmployeePicker}
            {showEmployeePicker ? (
              <EmployeePicker employees={empPickerEmployees} selected={selectedEmpIds} onChange={onSelectedEmpIdsChange} />
            ) : null}
            {dataView && dataView.options.length >= 2 ? (
              <Tabs value={dataView.value} onValueChange={dataView.onChange}>
                <TabsList className="h-8 gap-0.5 bg-muted/70 p-0.5">
                  {dataView.options.map((opt) => (
                    <TabsTrigger key={opt.value} value={opt.value} className={DATA_VIEW_TAB_CLASS}>
                      <DataViewIcon name={opt.icon} />
                      {opt.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            ) : null}
            {trailingActions}
          </div>
        </div>
      </div>

      {showDateSection ? (
        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
          <DialogContent className="border-border sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>نطاق تاريخ مخصص</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <FormField label="من">
                <Input
                  dir="ltr"
                  placeholder="mm/dd/yyyy"
                  autoComplete="off"
                  value={dialogFromMDY}
                  onChange={(e) => setDialogFromMDY(e.target.value)}
                  className="font-mono text-sm"
                />
              </FormField>
              <FormField label="إلى">
                <Input
                  dir="ltr"
                  placeholder="mm/dd/yyyy"
                  autoComplete="off"
                  value={dialogToMDY}
                  onChange={(e) => setDialogToMDY(e.target.value)}
                  className="font-mono text-sm"
                />
              </FormField>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1 text-xs" onClick={fillDialogToday}>
                  <CalendarDays className="h-3 w-3 opacity-70" />
                  اليوم
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-1 text-xs" onClick={fillDialogThisWeek}>
                  <CalendarDays className="h-3 w-3 opacity-70" />
                  هذا الأسبوع
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-1 text-xs" onClick={fillDialogThisMonth}>
                  <CalendarDays className="h-3 w-3 opacity-70" />
                  هذا الشهر
                </Button>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setCustomDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="button" onClick={applyCustomDialog}>
                تأكيد
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
});
