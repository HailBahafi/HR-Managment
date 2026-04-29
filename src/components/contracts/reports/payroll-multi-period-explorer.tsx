'use client';

import * as React from 'react';
import {
  CalendarRange, Download, FileSpreadsheet, Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useHRPayrollPeriodsStore } from '@/lib/contracts/payroll-periods-store';
import { useHRContractsStore } from '@/lib/contracts/contracts-store';
import { useHRAllowanceTypesStore } from '@/lib/contracts/allowance-types-store';
import {
  buildCompensationPreviews,
} from '@/lib/contracts/compensation-preview';
import { CompensationReportPanel } from '@/components/contracts/compensation-report-panel';

const PERIOD_STATUS_LABEL: Record<string, string> = {
  draft:  'مسودة',
  open:   'مفتوحة',
  closed: 'مغلقة',
};

export function PayrollMultiPeriodExplorer() {
  const { periods } = useHRPayrollPeriodsStore();
  const contracts    = useHRContractsStore(s => s.contracts);
  const allowanceTypes = useHRAllowanceTypesStore(s => s.items);

  const [selectedId, setSelectedId] = React.useState<string | null>(
    () => periods[0]?.id ?? null,
  );
  const [downloading, setDownloading] = React.useState(false);

  const selectedPeriod = React.useMemo(
    () => periods.find(p => p.id === selectedId) ?? null,
    [periods, selectedId],
  );

  /* ── Excel download ──────────────────────────────────────────────────── */
  const handleDownloadExcel = async () => {
    if (!selectedPeriod) return;
    setDownloading(true);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      if (!selectedPeriod) return;
      const getContract  = (id: string) => contracts.find(c => c.id === id);
      const getAlloType   = (id: string) => allowanceTypes.find(a => a.id === id);

      const previews = buildCompensationPreviews(selectedPeriod, getContract, getAlloType);
      const headers = [
        '#', 'اسم الموظف', 'القسم', 'الراتب الأساسي', 'البدلات',
        'مستحقات (أوفرتايم + مكافآت)', 'خصومات (غياب + تأخير + جزاءات)', 'الصافي',
      ];
      const rows = previews.map((r, i) => [
        i + 1,
        r.namePrimary,
        selectedPeriod.employmentLines.find(l => l.id === r.lineId)?.departmentSnapshot ?? '',
        r.baseSalary,
        r.allowancesMonthlyTotal,
        r.entitlementOvertimeSar + r.entitlementBonusSar,
        r.dedAbsenceSar + r.dedLateSar + r.dedPenaltiesSar,
        r.lineNetSar,
      ]);
      const totalRow = [
        '', 'المجموع', '',
        previews.reduce((s, r) => s + r.baseSalary, 0),
        previews.reduce((s, r) => s + r.allowancesMonthlyTotal, 0),
        previews.reduce((s, r) => s + r.entitlementOvertimeSar + r.entitlementBonusSar, 0),
        previews.reduce((s, r) => s + r.dedAbsenceSar + r.dedLateSar + r.dedPenaltiesSar, 0),
        previews.reduce((s, r) => s + r.lineNetSar, 0),
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows, totalRow]);
      ws['!cols'] = [
        { wch: 4 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 28 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, (selectedPeriod.nameAr || selectedPeriod.code).slice(0, 31));
      XLSX.writeFile(wb, `payroll-${selectedPeriod.code}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إنشاء ملف Excel');
    } finally {
      setDownloading(false);
    }
  };

  /* ── UI ──────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5 animate-fade-in" dir="rtl">

      {/* ── Period selector bar ── */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">فترات الرواتب</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={downloading || !selectedId}
            onClick={handleDownloadExcel}
          >
            {downloading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />}
            تحميل Excel
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {periods.map(p => {
            const isSel = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                  isSel
                    ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                <span>{p.nameAr || p.code}</span>
                <Badge
                  variant={
                    p.status === 'closed' ? 'success'
                    : p.status === 'open'   ? 'warning'
                    : 'secondary'
                  }
                  className="px-1.5 text-[9px]"
                >
                  {PERIOD_STATUS_LABEL[p.status] ?? p.status}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      {!selectedPeriod ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">اختر فترة لاستعراض بيانات المسير</p>
        </div>
      ) : (
        <CompensationReportPanel periodId={selectedPeriod.id} embedded />
      )}
    </div>
  );
}
