'use client';

import * as React from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import {
  MOCK_ANALYTICS_EMPLOYEES,
  MOCK_BRANCHES,
  MOCK_UNIFIED_LEAVES,
  STATUS_LABELS,
} from '@/lib/leaves/unified-mock';
import type { EmployeeLeaveAnalyticsRow } from '@/lib/leaves/types';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { LeavesAnalyticsPrintHtml } from '@/components/pdf/print/leaves-analytics-print-html';
import { data } from '@/lib/data';
import { hasDateRangeFilter, intervalOverlapsYmdRange } from '@/lib/hr-discipline/discipline-date-filter';
import { downloadXlsxMultiSheet, type XlsxCell } from '@/lib/export/download-xlsx';

const TYPE_LABEL: Record<string, string> = {
  annual: 'سنوية', sick: 'مرضية', unpaid: 'بدون راتب', maternity: 'أمومة', emergency: 'طارئة',
};

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
          <div className="h-full rounded-full bg-warning transition-all" style={{ width: `${sickPct}%` }} />
        </div>
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

  const printable = React.useMemo(() => {
    const hasLeaves = leavePdfRows.length > 0;
    const hasEmps = employeePdfRows.length > 0;
    if (!hasLeaves && !hasEmps) return null;
    return (
      <LeavesAnalyticsPrintHtml
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

  const handleExportAnalyticsExcel = React.useCallback(async () => {
    const leaveHeader: XlsxCell[] = ['الموظف', 'من', 'إلى', 'نوع الإجازة', 'الحالة', 'أيام عمل'];
    const leaveRows: XlsxCell[][] = [
      leaveHeader,
      ...leavesMatchingToolbar.map((l) => [
        empNameById.get(l.employeeId) ?? l.employeeId,
        l.start,
        l.end,
        TYPE_LABEL[l.type] ?? l.type,
        STATUS_LABELS[l.status] ?? l.status,
        l.workingDays,
      ]),
    ];
    const empHeader: XlsxCell[] = ['الموظف', 'سنوية (مستخدم/إجمالي)', 'مرضية (مستخدم/سقف)', 'الفرع'];
    const empRows: XlsxCell[][] = [
      empHeader,
      ...filteredEmployees.map((row) => {
        const branch = MOCK_BRANCHES.find((b) => b.id === row.branchId);
        return [
          row.nameAr,
          `${row.annualConsumed}/${row.annualTotal}`,
          `${row.sickUsed}/${row.sickCap}`,
          branch?.nameAr ?? row.branchId,
        ];
      }),
    ];
    const sheets: { name: string; data: XlsxCell[][] }[] = [];
    if (leaveRows.length > 1) sheets.push({ name: 'الإجازات', data: leaveRows });
    if (empRows.length > 1) sheets.push({ name: 'الموظفون', data: empRows });
    if (sheets.length === 0) {
      toast.error('لا توجد بيانات للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    await downloadXlsxMultiSheet('leaves-analytics.xlsx', sheets);
    toast.success('تم تنزيل ملف Excel.');
  }, [leavesMatchingToolbar, filteredEmployees, empNameById]);

  const branchSelectOptions = React.useMemo(
    () => [{ value: 'all', label: 'جميع الفروع' }, ...MOCK_BRANCHES.map((b) => ({ value: b.id, label: b.nameAr }))],
    [],
  );

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  useEntityFilterSlot(
    () => (
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
        inlineSelects={[
          {
            id: 'branch',
            value: branchFilter,
            onChange: setBranchFilter,
            placeholder: 'الفرع',
            options: branchSelectOptions,
          },
        ]}
        trailingActions={(
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                if (!printable) {
                  toast.error('لا توجد بيانات للتصدير ضمن الفلاتر الحالية.');
                  return;
                }
                setPdfOpen(true);
              }}
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => void handleExportAnalyticsExcel()}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </Button>
          </>
        )}
      />
    ),
    [
      branchFilter,
      selectedEmpKey,
      leaveStatusFilter,
      dateBounds.from,
      dateBounds.to,
      leaveStatusCounts.all,
      leaveStatusCounts.pending,
      leaveStatusCounts.approved,
      leaveStatusCounts.rejected,
      leaveStatusCounts.cancelled,
      leavePdfRows.length,
      employeePdfRows.length,
      handleExportAnalyticsExcel,
      empPickerList,
      branchSelectOptions,
    ],
  );

  return (
    <div className="space-y-6">
      <PdfPreviewExportDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title="معاينة تصدير تحليلات الإجازات"
        fileName={analyticsPdfFileName}
        printable={printable}
      />

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
