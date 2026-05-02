'use client';

import * as React from 'react';
import { CalendarDays, ChevronDown, X } from 'lucide-react';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormField } from '@/components/hr-requests/shared-ui';
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

export interface EntityFilterToolbarProps {
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

  showDateSection?: boolean;
  showStatusSection?: boolean;
  showEmployeePicker?: boolean;
  /** Initial tab when the date section mounts (default `'all'`). */
  defaultDateFilterTab?: DateFilterTab;

  trailingActions?: React.ReactNode;
  beforeEmployeePicker?: React.ReactNode;
}

export const EntityFilterToolbar = React.forwardRef<
  EntityFilterToolbarHandle,
  EntityFilterToolbarProps
>(function EntityFilterToolbar(
  {
    empPickerEmployees,
    selectedEmpIds,
    onSelectedEmpIdsChange,
    statusFilter,
    onStatusFilterChange,
    statusOrder,
    statusLabels,
    statusCounts,
    onDateBoundsChange,
    onDateFilterMetaChange,
    showDateSection = true,
    showStatusSection = true,
    showEmployeePicker = true,
    defaultDateFilterTab = 'all',
    trailingActions,
    beforeEmployeePicker,
  },
  ref,
) {
  const [dateFilterTab, setDateFilterTab] = React.useState<DateFilterTab>(defaultDateFilterTab);
  const [appliedCustomFrom, setAppliedCustomFrom] = React.useState('');
  const [appliedCustomTo, setAppliedCustomTo] = React.useState('');
  const [customDialogOpen, setCustomDialogOpen] = React.useState(false);
  const [dialogFromMDY, setDialogFromMDY] = React.useState('');
  const [dialogToMDY, setDialogToMDY] = React.useState('');
  const [filterStripOpen, setFilterStripOpen] = React.useState<'date' | 'status' | null>(null);

  const effectiveBounds = React.useMemo(
    () => (showDateSection ? effectiveDateRange(dateFilterTab, appliedCustomFrom, appliedCustomTo) : { from: '', to: '' }),
    [showDateSection, dateFilterTab, appliedCustomFrom, appliedCustomTo],
  );

  React.useEffect(() => {
    onDateBoundsChange(effectiveBounds);
  }, [effectiveBounds, onDateBoundsChange]);

  React.useEffect(() => {
    if (!showDateSection) {
      onDateFilterMetaChange?.({ tab: 'all', hasRestriction: false });
      return;
    }
    onDateFilterMetaChange?.({
      tab: dateFilterTab,
      hasRestriction: dateFilterHasRestriction(dateFilterTab, appliedCustomFrom, appliedCustomTo),
    });
  }, [showDateSection, dateFilterTab, appliedCustomFrom, appliedCustomTo, onDateFilterMetaChange]);

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

  const toggleFilterStrip = React.useCallback((which: 'date' | 'status') => {
    setFilterStripOpen((prev) => (prev === which ? null : which));
  }, []);

  const resetDateFilter = React.useCallback(() => {
    setDateFilterTab('all');
    setAppliedCustomFrom('');
    setAppliedCustomTo('');
    setFilterStripOpen((prev) => (prev === 'date' ? null : prev));
  }, []);

  const resetStatusFilter = React.useCallback(() => {
    onStatusFilterChange('all');
    setFilterStripOpen((prev) => (prev === 'status' ? null : prev));
  }, [onStatusFilterChange]);

  React.useImperativeHandle(ref, () => ({
    resetDateFilter,
    resetStatusFilter,
  }), [resetDateFilter, resetStatusFilter]);

  const dateStripSummary = React.useMemo(() => {
    if (!showDateSection) return '';
    switch (dateFilterTab) {
      case 'all':
        return 'كل الفترات';
      case 'today':
        return 'اليوم';
      case 'week':
        return 'هذا الأسبوع';
      case 'month':
        return 'هذا الشهر';
      case 'custom':
        return hasDateRangeFilter(appliedCustomFrom, appliedCustomTo)
          ? `${ymdToMDYDisplay(appliedCustomFrom)} — ${ymdToMDYDisplay(appliedCustomTo)}`
          : 'مخصص';
      default:
        return '';
    }
  }, [showDateSection, dateFilterTab, appliedCustomFrom, appliedCustomTo]);

  const statusStripSummary = React.useMemo(() => {
    if (!showStatusSection) return '';
    if (statusFilter === 'all') return `الكل · ${statusCounts.all ?? 0}`;
    return `${statusLabels[statusFilter] ?? statusFilter} · ${statusCounts[statusFilter] ?? 0}`;
  }, [showStatusSection, statusFilter, statusCounts, statusLabels]);

  const showDateReset = showDateSection && (filterStripOpen === 'date' || dateFilterTab !== 'all');
  const showStatusReset = showStatusSection && (filterStripOpen === 'status' || statusFilter !== 'all');

  const showDateStripPanel = showDateSection && filterStripOpen === 'date';
  const showStatusStripPanel = showStatusSection && filterStripOpen === 'status';

  return (
    <>
      <div className="rounded-lg border border-border/50 bg-card/50 px-3 py-2 shadow-sm sm:px-4">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-col items-start gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {showDateSection ? (
                <div className="flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant={filterStripOpen === 'date' ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-xs font-medium"
                    onClick={() => toggleFilterStrip('date')}
                    aria-expanded={filterStripOpen === 'date'}
                  >
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    الفترات
                    <span className="max-w-40 truncate rounded-md bg-background/80 px-1.5 py-0.5 font-normal text-[10px] text-muted-foreground sm:max-w-56" title={dateStripSummary}>
                      {dateStripSummary}
                    </span>
                    <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 opacity-60 transition-transform', filterStripOpen === 'date' && 'rotate-180')} />
                  </Button>
                  {showDateReset ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="إعادة ضبط الفترات إلى كل الفترات وإخفاء الشريط"
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
                <div className="flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant={filterStripOpen === 'status' ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-xs font-medium"
                    onClick={() => toggleFilterStrip('status')}
                    aria-expanded={filterStripOpen === 'status'}
                  >
                    الحالات
                    <span className="max-w-36 truncate rounded-md bg-background/80 px-1.5 py-0.5 font-normal text-[10px] text-muted-foreground sm:max-w-48" title={statusStripSummary}>
                      {statusStripSummary}
                    </span>
                    <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 opacity-60 transition-transform', filterStripOpen === 'status' && 'rotate-180')} />
                  </Button>
                  {showStatusReset ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="إعادة ضبط الحالات إلى الكل وإخفاء الشريط"
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

            {showDateStripPanel ? (
              <div className="max-w-[min(100%,42rem)] border-t border-border/50 pt-2">
                <div className="overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin]">
                  <Tabs
                    value={dateFilterTab}
                    onValueChange={(v) => {
                      const next = v as DateFilterTab;
                      if (next === 'custom') {
                        setDateFilterTab('custom');
                        openCustomDateDialog();
                        return;
                      }
                      setDateFilterTab(next);
                    }}
                  >
                    <TabsList className="inline-flex h-auto min-h-8 w-max flex-nowrap gap-1.5 bg-muted/30 p-1 dark:bg-muted/20">
                      <TabsTrigger value="all" className={DATE_TAB_TRIGGER_CLASS.all}>كل الفترات</TabsTrigger>
                      <TabsTrigger value="today" className={DATE_TAB_TRIGGER_CLASS.today}>
                        <CalendarDays className="h-3 w-3 shrink-0 opacity-70" />
                        اليوم
                      </TabsTrigger>
                      <TabsTrigger value="week" className={DATE_TAB_TRIGGER_CLASS.week}>
                        <CalendarDays className="h-3 w-3 shrink-0 opacity-70" />
                        هذا الأسبوع
                      </TabsTrigger>
                      <TabsTrigger value="month" className={DATE_TAB_TRIGGER_CLASS.month}>
                        <CalendarDays className="h-3 w-3 shrink-0 opacity-70" />
                        هذا الشهر
                      </TabsTrigger>
                      <TabsTrigger value="custom" className={DATE_TAB_TRIGGER_CLASS.custom}>
                        <CalendarDays className="h-3 w-3 shrink-0 opacity-70" />
                        مخصص
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {dateFilterTab === 'custom' ? (
                  <div className="mt-2 flex w-full max-w-full flex-wrap items-center justify-between gap-2 border-border/40 border-dashed bg-muted/15 px-2 py-1.5">
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
                ) : null}
              </div>
            ) : null}

            {showStatusStripPanel ? (
              <div className="max-w-[min(100%,52rem)] border-t border-border/50 pt-2">
                <div className="overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin]">
                  <Tabs value={statusFilter} onValueChange={onStatusFilterChange}>
                    <TabsList className="inline-flex h-auto min-h-9 w-max flex-nowrap gap-1.5 bg-muted/30 p-1 dark:bg-muted/20">
                      <TabsTrigger value="all" className={STATUS_ALL_TRIGGER_CLASS}>
                        الكل
                        <span className={STATUS_COUNT_BADGE}>{statusCounts.all ?? 0}</span>
                      </TabsTrigger>
                      {statusOrder.map((s, i) => (
                        <TabsTrigger
                          key={s}
                          value={s}
                          className={cn(
                            'group',
                            DATE_TAB_BASE,
                            STATUS_CYCLE_TRIGGER_CLASSES[i % STATUS_CYCLE_TRIGGER_CLASSES.length],
                          )}
                        >
                          {statusLabels[s] ?? s}
                          <span className={STATUS_COUNT_BADGE}>{statusCounts[s] ?? 0}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {beforeEmployeePicker}
            {showEmployeePicker ? (
              <EmployeePicker employees={empPickerEmployees} selected={selectedEmpIds} onChange={onSelectedEmpIdsChange} />
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
