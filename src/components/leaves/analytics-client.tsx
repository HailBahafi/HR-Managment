'use client';

import * as React from 'react';
import {
  TrendingUp, Users, CalendarOff, Clock, ChevronLeft, ChevronRight, FileDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn, toWesternDigits } from '@/lib/utils';
import {
  MOCK_ANALYTICS_EMPLOYEES,
  MOCK_ANALYTICS_TIMELINE_BARS,
  MOCK_BRANCHES,
  MOCK_UNIFIED_LEAVES,
  STATUS_LABELS,
} from '@/lib/leaves/unified-mock';
import type { EmployeeLeaveAnalyticsRow, UnifiedLeaveRecord } from '@/lib/leaves/types';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { LeavesAnalyticsPdf } from '@/components/pdf/leaves-analytics-pdf';
import { data } from '@/lib/data';
import { hasDateRangeFilter, intervalOverlapsYmdRange } from '@/lib/hr-discipline/discipline-date-filter';

// ─── colour maps ─────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  annual: 'bg-primary/80 text-primary-foreground',
  sick: 'bg-amber-500/80 text-white',
  unpaid: 'bg-muted text-muted-foreground border border-border',
  maternity: 'bg-pink-500/80 text-white',
  emergency: 'bg-destructive/80 text-white',
};

const TYPE_LABEL: Record<string, string> = {
  annual: 'سنوية', sick: 'مرضية', unpaid: 'بدون راتب', maternity: 'أمومة', emergency: 'طارئة',
};

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft flex items-start gap-4">
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', accent ?? 'bg-primary/10')}>
        <Icon className={cn('h-5 w-5', accent ? 'text-white' : 'text-primary')} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Branch breakdown bar ─────────────────────────────────────────────────────

function BranchBar({ leaves }: { leaves: UnifiedLeaveRecord[] }) {
  const counts = React.useMemo(() => {
    const map: Record<string, number> = {};
    leaves.forEach((l) => { map[l.requestBranchId] = (map[l.requestBranchId] ?? 0) + 1; });
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return MOCK_BRANCHES.map((b) => ({ ...b, count: map[b.id] ?? 0, pct: Math.round(((map[b.id] ?? 0) / total) * 100) }));
  }, [leaves]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-4">
      <p className="font-semibold">توزيع الإجازات حسب الفرع</p>
      <div className="flex h-3 overflow-hidden rounded-full">
        {counts.map((b, i) => (
          <div
            key={b.id}
            className={cn('h-full transition-all', i === 0 ? 'bg-primary' : i === 1 ? 'bg-amber-500' : 'bg-pink-500')}
            style={{ width: `${b.pct}%` }}
          />
        ))}
      </div>
      <div className="flex gap-4">
        {counts.map((b, i) => (
          <div key={b.id} className="flex items-center gap-1.5 text-xs">
            <span className={cn('h-2.5 w-2.5 rounded-full', i === 0 ? 'bg-primary' : i === 1 ? 'bg-amber-500' : 'bg-pink-500')} />
            <span className="text-muted-foreground">{b.nameAr}</span>
            <span className="font-semibold">{b.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Employee card ────────────────────────────────────────────────────────────

function EmployeeCard({ row }: { row: EmployeeLeaveAnalyticsRow }) {
  const annualPct = row.annualTotal > 0 ? Math.round((row.annualConsumed / row.annualTotal) * 100) : 0;
  const sickPct = row.sickCap > 0 ? Math.round((row.sickUsed / row.sickCap) * 100) : 0;
  const branch = MOCK_BRANCHES.find((b) => b.id === row.branchId);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: `hsl(${row.avatarHue} 60% 45%)` }}
        >
          {row.nameAr.split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-sm">{row.nameAr}</p>
          <p className="truncate text-xs text-muted-foreground">{row.roleAr} · {branch?.nameAr}</p>
        </div>
        {row.absenceDays > 0 && (
          <span className="mr-auto shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
            {row.absenceDays} غياب
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>سنوية</span>
          <span>{row.annualConsumed}/{row.annualTotal} يوم</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${annualPct}%` }} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>مرضية</span>
          <span>{row.sickUsed}/{row.sickCap} يوم</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${sickPct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineView() {
  const [monthOffset, setMonthOffset] = React.useState(0);
  const now = new Date(2026, 3 + monthOffset, 1); // April 2026 base
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = toWesternDigits(
    now.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric', numberingSystem: 'latn' }),
  );

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const barsInView = MOCK_ANALYTICS_TIMELINE_BARS.filter((bar) => {
    const s = new Date(bar.rangeStart);
    const e = new Date(bar.rangeEnd);
    const mStart = new Date(year, month, 1);
    const mEnd = new Date(year, month, daysInMonth);
    return s <= mEnd && e >= mStart;
  });

  const employees = MOCK_ANALYTICS_EMPLOYEES.filter((e) => barsInView.some((b) => b.employeeId === e.id));

  return (
    <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="font-semibold">الجدول الزمني للإجازات</p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setMonthOffset((o) => o - 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="min-w-[120px] text-center text-sm font-medium">{monthLabel}</span>
          <Button variant="ghost" size="icon" onClick={() => setMonthOffset((o) => o + 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day header */}
          <div className="flex border-b border-border bg-muted/40">
            <div className="w-40 shrink-0 px-4 py-2 text-xs font-semibold text-muted-foreground">الموظف</div>
            {days.map((d) => (
              <div key={d} className="flex-1 py-2 text-center text-[10px] text-muted-foreground font-mono">{d}</div>
            ))}
          </div>
          {/* Rows */}
          {employees.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">لا توجد إجازات في هذا الشهر</div>
          ) : employees.map((emp) => {
            const empBars = barsInView.filter((b) => b.employeeId === emp.id);
            return (
              <div key={emp.id} className="flex items-center border-b border-border/50 last:border-0">
                <div className="w-40 shrink-0 px-4 py-3 text-xs font-medium truncate">{emp.nameAr}</div>
                <div className="relative flex flex-1 items-center" style={{ height: 36 }}>
                  {days.map((d) => {
                    const date = new Date(year, month, d);
                    const bar = empBars.find((b) => new Date(b.rangeStart) <= date && new Date(b.rangeEnd) >= date);
                    return (
                      <div
                        key={d}
                        className={cn('flex-1 h-6 mx-px rounded-sm transition-colors', bar ? TYPE_COLOR[bar.leaveType] : 'bg-transparent')}
                        title={bar ? TYPE_LABEL[bar.leaveType] : undefined}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 border-t border-border px-5 py-3">
        {Object.entries(TYPE_LABEL).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('h-2.5 w-2.5 rounded-sm', TYPE_COLOR[k]?.split(' ')[0])} />
            {v}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ANALYTICS_LEAVE_STATUS_ORDER = ['pending', 'approved', 'rejected', 'cancelled'] as const;

export function AnalyticsClient() {
  const [branchFilter, setBranchFilter] = React.useState('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [leaveStatusFilter, setLeaveStatusFilter] = React.useState<string>('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [pdfOpen, setPdfOpen] = React.useState(false);

  const empPickerList = React.useMemo(
    () => MOCK_ANALYTICS_EMPLOYEES.map((e) => ({ id: e.id, name: e.nameAr })),
    [],
  );

  const leavesInRange = React.useMemo(
    () => MOCK_UNIFIED_LEAVES.filter((l) => intervalOverlapsYmdRange(l.start, l.end, dateBounds.from, dateBounds.to)),
    [dateBounds.from, dateBounds.to],
  );

  const leaveStatusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: leavesInRange.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };
    for (const l of leavesInRange) counts[l.status] = (counts[l.status] ?? 0) + 1;
    return counts;
  }, [leavesInRange]);

  const leavesMatchingToolbar = React.useMemo(() => {
    return leavesInRange.filter((l) => leaveStatusFilter === 'all' || l.status === leaveStatusFilter);
  }, [leavesInRange, leaveStatusFilter]);

  const totalLeaves = leavesMatchingToolbar.length;
  const approved = leavesMatchingToolbar.filter((l) => l.status === 'approved').length;
  const pending = leavesMatchingToolbar.filter((l) => l.status === 'pending').length;
  const totalDays = leavesMatchingToolbar.reduce((s, l) => s + l.workingDays, 0);

  const visibleEmployeeIds = React.useMemo(() => {
    const ids = new Set(leavesMatchingToolbar.map((l) => l.employeeId));
    const restrict = hasDateRangeFilter(dateBounds.from, dateBounds.to) || leaveStatusFilter !== 'all';
    return { ids, restrict };
  }, [leavesMatchingToolbar, dateBounds.from, dateBounds.to, leaveStatusFilter]);

  const filteredEmployees = React.useMemo(() => {
    return MOCK_ANALYTICS_EMPLOYEES
      .filter((e) => branchFilter === 'all' || e.branchId === branchFilter)
      .filter((e) => selectedEmpIds.size === 0 || selectedEmpIds.has(e.id))
      .filter((e) => {
        if (!visibleEmployeeIds.restrict) return true;
        return visibleEmployeeIds.ids.has(e.id);
      });
  }, [branchFilter, selectedEmpIds, visibleEmployeeIds]);

  const statusLabelsForToolbar: Record<string, string> = {
    pending: STATUS_LABELS.pending,
    approved: STATUS_LABELS.approved,
    rejected: STATUS_LABELS.rejected,
    cancelled: STATUS_LABELS.cancelled,
  };

  const empNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const e of MOCK_ANALYTICS_EMPLOYEES) m.set(e.id, e.nameAr);
    return m;
  }, []);

  const leavePdfRows = React.useMemo(
    () =>
      leavesMatchingToolbar.map((l) => ({
        employeeNameAr: empNameById.get(l.employeeId) ?? l.employeeId,
        start: l.start,
        end: l.end,
        typeAr: TYPE_LABEL[l.type] ?? l.type,
        statusAr: STATUS_LABELS[l.status] ?? l.status,
        workingDays: l.workingDays,
      })),
    [leavesMatchingToolbar, empNameById],
  );

  const employeePdfRows = React.useMemo(
    () =>
      filteredEmployees.map((row) => {
        const branch = MOCK_BRANCHES.find((b) => b.id === row.branchId);
        return {
          nameAr: row.nameAr,
          annual: `${row.annualConsumed}/${row.annualTotal}`,
          sick: `${row.sickUsed}/${row.sickCap}`,
          branch: branch?.nameAr ?? row.branchId,
        };
      }),
    [filteredEmployees],
  );

  const analyticsPdfDoc = React.useMemo(() => {
    const hasLeaves = leavePdfRows.length > 0;
    const hasEmps = employeePdfRows.length > 0;
    if (!hasLeaves && !hasEmps) return null;
    return (
      <LeavesAnalyticsPdf
        companyNameAr={data.company.name}
        companyNameEn={data.company.nameEn}
        filterSummary={`الفرع: ${branchFilter === 'all' ? 'الكل' : (MOCK_BRANCHES.find((b) => b.id === branchFilter)?.nameAr ?? branchFilter)} · الموظفون: ${selectedEmpIds.size === 0 ? 'الكل' : `${selectedEmpIds.size} محدد`} · حالة الإجازة: ${leaveStatusFilter === 'all' ? 'الكل' : (statusLabelsForToolbar[leaveStatusFilter] ?? leaveStatusFilter)} · التاريخ: ${hasDateRangeFilter(dateBounds.from, dateBounds.to) ? `${dateBounds.from} — ${dateBounds.to}` : 'غير محدد (كل الفترات في العينة)'}`}
        kpi={{ total: totalLeaves, approved, pending, workDays: totalDays }}
        leaveRows={leavePdfRows}
        employeeRows={employeePdfRows}
      />
    );
  }, [
    leavePdfRows,
    employeePdfRows,
    branchFilter,
    selectedEmpIds.size,
    leaveStatusFilter,
    dateBounds.from,
    dateBounds.to,
    totalLeaves,
    approved,
    pending,
    totalDays,
  ]);

  const analyticsPdfFileName = 'leaves-analytics.pdf';

  return (
    <div className="space-y-6">
      <PdfPreviewExportDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title="معاينة تصدير تحليلات الإجازات"
        fileName={analyticsPdfFileName}
        document={analyticsPdfDoc}
      />
      <EntityFilterToolbar
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={leaveStatusFilter}
        onStatusFilterChange={setLeaveStatusFilter}
        statusOrder={ANALYTICS_LEAVE_STATUS_ORDER}
        statusLabels={statusLabelsForToolbar}
        statusCounts={leaveStatusCounts}
        onDateBoundsChange={setDateBounds}
        trailingActions={(
          <>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="الفرع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفروع</SelectItem>
                {MOCK_BRANCHES.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.nameAr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                if (!analyticsPdfDoc) {
                  toast.error('لا توجد بيانات للتصدير ضمن الفلاتر الحالية.');
                  return;
                }
                setPdfOpen(true);
              }}
            >
              <FileDown className="h-3.5 w-3.5" />
              تصدير PDF
            </Button>
          </>
        )}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="إجمالي الطلبات" value={totalLeaves} icon={Users} accent="bg-primary text-primary-foreground" />
        <KpiCard label="موافق عليها" value={approved} icon={TrendingUp} accent="bg-emerald-600 text-white" />
        <KpiCard label="قيد الانتظار" value={pending} icon={Clock} accent="bg-amber-500 text-white" />
        <KpiCard label="أيام عمل (محاكاة)" value={totalDays} sub="مجموع أيام العمل في الطلبات المصفّاة" icon={CalendarOff} accent="bg-pink-500 text-white" />
      </div>

      <BranchBar leaves={leavesMatchingToolbar} />

      <TimelineView />

      <div>
        <p className="mb-4 font-semibold">أرصدة الموظفين</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEmployees.map((row) => (
            <EmployeeCard key={row.id} row={row} />
          ))}
        </div>
      </div>
    </div>
  );
}
