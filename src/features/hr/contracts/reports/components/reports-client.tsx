'use client';

import * as React from 'react';
import { FileText, Download, Eye, Loader2, FileSpreadsheet, ReceiptText, ScrollText } from 'lucide-react';
import { PayrollMultiPeriodExplorer } from './payroll-multi-period-explorer';
import { Button } from '@/components/ui/button';
import { SetPageTitle } from '@/components/set-page-title';
import { useHRPayrollPeriodsStore, type HRPayrollPeriodRecord } from '@/lib/contracts/payroll-periods-store';
import { useHRContractsStore } from '@/lib/contracts/contracts-store';
import { data, getBranch } from '@/lib/data';
import { cn } from '@/lib/utils';
import type { PayrollRow } from './pdf-payroll-register';
import type { CashReceiptReason } from './pdf-cash-receipt';

/* ── helpers ───────────────────────────────────────────────────────────── */

function buildPayrollRows(period: HRPayrollPeriodRecord): PayrollRow[] {
  return period.employmentLines.map((line, idx) => {
    const inputs = period.employmentLineMonthlyInputs[line.id] ?? [];
    const bonus = inputs
      .filter(i => i.kind === 'allowance_amount')
      .reduce((s, i) => s + i.value, 0)
      + inputs
      .filter(i => i.kind === 'overtime_hours')
      .reduce((s, i) => s + Math.round(i.value * (line.baseSalarySnapshot / 240)), 0);
    const ded = inputs
      .filter(i => i.kind === 'deduction_amount')
      .reduce((s, i) => s + i.value, 0)
      + inputs
      .filter(i => i.kind === 'absence_days')
      .reduce((s, i) => s + Math.round(i.value * (line.baseSalarySnapshot / 30)), 0);
    return {
      order: idx + 1,
      nameAr: line.employeeNameAr,
      department: line.departmentSnapshot,
      baseSalary: line.baseSalarySnapshot,
      bonus: Math.round(bonus),
      totalSalary: Math.round(line.baseSalarySnapshot + bonus - ded),
    };
  });
}

function amountWords(n: number): string {
  return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)} ريال سعودي فقط لا غير`;
}

type DocTab = 'payroll' | 'receipt' | 'clearance';

/* ── component ─────────────────────────────────────────────────────────── */

export function ReportsClient() {
  const { periods } = useHRPayrollPeriodsStore();
  const { contracts } = useHRContractsStore();
  const employees = data.employees;

  const [tab, setTab] = React.useState<DocTab>('payroll');
  const [loading, setLoading] = React.useState(false);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [pdfName, setPdfName] = React.useState('report.pdf');
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  /* ── payroll state ── */
  const [periodId, setPeriodId] = React.useState(periods[0]?.id ?? '');

  /* ── receipt state ── */
  const [rcptEmpId, setRcptEmpId]       = React.useState(employees[0]?.id ?? '');
  const [rcptAmount, setRcptAmount]     = React.useState('');
  const [rcptWritten, setRcptWritten]   = React.useState('');
  const [rcptReason, setRcptReason]     = React.useState<CashReceiptReason>('salary');
  const [rcptDetail, setRcptDetail]     = React.useState('');
  const [rcptDate, setRcptDate]         = React.useState(new Date().toISOString().slice(0, 10));

  /* ── clearance state ── */
  const [clrEmpId, setClrEmpId]     = React.useState(employees[0]?.id ?? '');
  const [clrEndDate, setClrEndDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [clrDate, setClrDate]       = React.useState(new Date().toISOString().slice(0, 10));

  const company = React.useMemo(() => ({
    nameAr: data.company.name,
    nameEn: data.company.nameEn,
  }), []);

  /* ── generate ──────────────────────────────────────────────────────── */
  const handleGenerate = React.useCallback(async () => {
    setLoading(true);
    setPdfUrl(null);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      let docEl: React.ReactElement | null = null;
      let fileName = 'report.pdf';

      if (tab === 'payroll') {
        const period = periods.find(p => p.id === periodId);
        if (!period) throw new Error('الرجاء اختيار فترة الرواتب');
        const rows = buildPayrollRows(period);
        const { PayrollRegisterDoc } = await import('./pdf-payroll-register');
        docEl = React.createElement(PayrollRegisterDoc, {
          company,
          periodNameAr: period.nameAr,
          branchNameAr: 'جميع الفروع',
          rows,
        });
        fileName = `payroll-register-${period.code}.pdf`;
      }

      if (tab === 'receipt') {
        const emp = employees.find(e => e.id === rcptEmpId);
        if (!emp) throw new Error('الرجاء اختيار الموظف');
        const branch = getBranch(emp.branchId);
        const { CashReceiptDoc } = await import('./pdf-cash-receipt');
        docEl = React.createElement(CashReceiptDoc, {
          company,
          employeeNameAr: emp.name,
          branchNameAr: branch?.name ?? 'المقر الرئيسي',
          amountNumeric: Number(rcptAmount) || 0,
          amountWritten: rcptWritten || amountWords(Number(rcptAmount) || 0),
          reason: rcptReason,
          reasonDetail: rcptDetail,
          date: rcptDate,
        });
        fileName = `cash-receipt-${emp.employeeCode}-${rcptDate.slice(0, 7)}.pdf`;
      }

      if (tab === 'clearance') {
        const emp = employees.find(e => e.id === clrEmpId);
        if (!emp) throw new Error('الرجاء اختيار الموظف');
        const contract = contracts.find(c => c.employeeId === clrEmpId && c.status === 'active')
          ?? contracts.find(c => c.employeeId === clrEmpId);
        const { ClearanceDoc } = await import('./pdf-clearance');
        docEl = React.createElement(ClearanceDoc, {
          company,
          employeeNameAr: emp.name,
          nationalId: emp.nationalId,
          nationality: emp.nationality,
          startDate: contract?.startDate ?? emp.startDate,
          endDate: clrEndDate,
          date: clrDate,
        });
        fileName = `clearance-${emp.employeeCode}.pdf`;
      }

      if (!docEl) return;
       
      const blob = await pdf(docEl as any).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfName(fileName);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الملف');
    } finally {
      setLoading(false);
    }
  }, [tab, periodId, periods, employees, contracts, rcptEmpId, rcptAmount, rcptWritten, rcptReason, rcptDetail, rcptDate, clrEmpId, clrEndDate, clrDate, company]);

  /* ── tab change: reset pdf ── */
  const switchTab = (t: DocTab) => { setTab(t); setPdfUrl(null); };

  /* ── UI ─────────────────────────────────────────────────────────────── */
  const TABS: { key: DocTab; label: string; icon: React.ElementType }[] = [
    { key: 'payroll',   label: 'مسير الرواتب',    icon: FileSpreadsheet },
    { key: 'receipt',   label: 'سند استلام نقدي', icon: ReceiptText },
    { key: 'clearance', label: 'مخالصة موظف',     icon: ScrollText },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <SetPageTitle titleAr="كشف مسيرات الرواتب" descriptionAr="إنشاء وطباعة التقارير الرسمية وتصديرها PDF" iconName="FileText" />

 
      {tab === 'payroll' && <PayrollMultiPeriodExplorer />}

      {tab !== 'payroll' && (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3"> 
        {/* ── LEFT: Form ── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">خيارات النموذج</h3>
          </div>

          {/* payroll form removed — handled by PayrollMultiPeriodExplorer above */}

          {/* Receipt form */}
          {tab === 'receipt' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الموظف</label>
                <select value={rcptEmpId} onChange={e => setRcptEmpId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.employeeCode}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">نوع السند</label>
                <select value={rcptReason} onChange={e => setRcptReason(e.target.value as CashReceiptReason)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="salary">راتب شهري</option>
                  <option value="advance">سلفة / قرض</option>
                  <option value="allowance">بدل</option>
                  <option value="overtime">بدل إضافي</option>
                  <option value="storage_deficit">بدل عجز مخزون</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">تفاصيل / الشهر</label>
                <input value={rcptDetail} onChange={e => setRcptDetail(e.target.value)} placeholder="مثال: أبريل 2025"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">المبلغ (رقماً)</label>
                <input type="number" value={rcptAmount} onChange={e => setRcptAmount(e.target.value)} placeholder="0.00"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-left" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">المبلغ كتابةً <span className="text-xs text-muted-foreground">(اختياري)</span></label>
                <input value={rcptWritten} onChange={e => setRcptWritten(e.target.value)} placeholder="يُحسب تلقائياً"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">التاريخ</label>
                <input type="date" value={rcptDate} onChange={e => setRcptDate(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
              </div>
            </div>
          )}

          {/* Clearance form */}
          {tab === 'clearance' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الموظف</label>
                <select value={clrEmpId} onChange={e => setClrEmpId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.employeeCode}</option>)}
                </select>
              </div>
              {clrEmpId && (() => {
                const emp = employees.find(e => e.id === clrEmpId);
                const ctr = contracts.find(c => c.employeeId === clrEmpId && c.status === 'active');
                if (!emp) return null;
                return (
                  <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-0.5">
                    <p><span className="font-medium">الجنسية:</span> {emp.nationality}</p>
                    <p><span className="font-medium">رقم الهوية:</span> {emp.nationalId}</p>
                    <p><span className="font-medium">تاريخ التعيين:</span> {ctr?.startDate ?? emp.startDate}</p>
                  </div>
                );
              })()}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">تاريخ إنهاء الخدمة</label>
                <input type="date" value={clrEndDate} onChange={e => setClrEndDate(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">تاريخ إصدار الوثيقة</label>
                <input type="date" value={clrDate} onChange={e => setClrDate(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
              </div>
            </div>
          )}

          <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2 mt-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            {loading ? 'جاري الإنشاء...' : 'إنشاء ومعاينة PDF'}
          </Button>

          {pdfUrl && (
            <a href={pdfUrl} download={pdfName}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors">
              <Download className="h-4 w-4" />
              تحميل الملف ({pdfName})
            </a>
          )}
        </div>

        {/* ── RIGHT: Preview ── */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-soft overflow-hidden" style={{ minHeight: 620 }}>
          {pdfUrl ? (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              className="h-full w-full"
              style={{ minHeight: 620, border: 'none' }}
              title="معاينة PDF"
            />
          ) : (
            <div className="flex h-full min-h-[620px] flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
                {tab === 'receipt'   && <ReceiptText      className="h-9 w-9 text-muted-foreground" />}
                {tab === 'clearance' && <ScrollText       className="h-9 w-9 text-muted-foreground" />}
              </div>
              <div>
                <p className="font-semibold text-muted-foreground">
                  {tab === 'receipt'   && 'سند استلام نقدي'}
                  {tab === 'clearance' && 'مخالصة موظف'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground/60">
                  اختر الخيارات ثم اضغط "إنشاء ومعاينة PDF"
                </p>
              </div>
              {loading && (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">جاري إنشاء الملف...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
