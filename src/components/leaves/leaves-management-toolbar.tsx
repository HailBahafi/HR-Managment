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
import {
  DATE_TAB_BASE,
  DATE_TAB_TRIGGER_CLASS,
  STATUS_ALL_TRIGGER_CLASS,
  STATUS_CYCLE_TRIGGER_CLASSES,
  STATUS_COUNT_BADGE,
} from '@/components/hr-discipline/discipline-filter-toolbar';

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

  /** جدول/تقويم + زر إضافة إجازة (يُعرض بعد اختيار الموظفين كما في الانضباط) */
  trailingActions: React.ReactNode;
}

export function LeavesManagementToolbar({
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
  trailingActions,
}: LeavesManagementToolbarProps) {
  const [dateFilterTab, setDateFilterTab] = React.useState<DateFilterTab>('all');
  const [appliedCustomFrom, setAppliedCustomFrom] = React.useState('');
  const [appliedCustomTo, setAppliedCustomTo] = React.useState('');
  const [customDialogOpen, setCustomDialogOpen] = React.useState(false);
  const [dialogFromMDY, setDialogFromMDY] = React.useState('');
  const [dialogToMDY, setDialogToMDY] = React.useState('');
  const [filterStripOpen, setFilterStripOpen] = React.useState<'date' | 'status' | null>(null);

  const effectiveBounds = React.useMemo(
    () => effectiveDateRange(dateFilterTab, appliedCustomFrom, appliedCustomTo),
    [dateFilterTab, appliedCustomFrom, appliedCustomTo],
  );

  React.useEffect(() => {
    onDateBoundsChange(effectiveBounds);
  }, [effectiveBounds, onDateBoundsChange]);

  React.useEffect(() => {
    onDateFilterMetaChange?.({
      tab: dateFilterTab,
      hasRestriction: dateFilterHasRestriction(dateFilterTab, appliedCustomFrom, appliedCustomTo),
    });
  }, [dateFilterTab, appliedCustomFrom, appliedCustomTo, onDateFilterMetaChange]);

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

  const dateStripSummary = React.useMemo(() => {
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
  }, [dateFilterTab, appliedCustomFrom, appliedCustomTo]);

  const statusStripSummary = React.useMemo(() => {
    if (statusFilter === 'all') return `الكل · ${statusCounts.all ?? 0}`;
    return `${statusLabels[statusFilter] ?? statusFilter} · ${statusCounts[statusFilter] ?? 0}`;
  }, [statusFilter, statusCounts, statusLabels]);

  const showDateReset = filterStripOpen === 'date' || dateFilterTab !== 'all';
  const showStatusReset = filterStripOpen === 'status' || statusFilter !== 'all';

  return (
    <>
      <div className="rounded-lg border border-border/50 bg-card/50 px-3 py-2 shadow-sm sm:px-4">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-col items-start gap-2">
            <div className="flex flex-wrap items-center gap-2">
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
            </div>

            {filterStripOpen === 'date' ? (
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

            {filterStripOpen === 'status' ? (
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
            <EmployeePicker employees={empPickerEmployees} selected={selectedEmpIds} onChange={onSelectedEmpIdsChange} />
            {trailingActions}
          </div>
        </div>
      </div>

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
    </>
  );
}
