'use client';

import * as React from 'react';
import { FileText, Download, Loader2, FileSpreadsheet, ReceiptText, ScrollText } from 'lucide-react';
import { toast } from 'sonner';
import { PayrollMultiPeriodExplorer } from './payroll-multi-period-explorer';
import { ClearancePrintHtml, type ClearancePrintProps } from './clearance-print-html';
import { CashReceiptPrintHtml, type CashReceiptPrintHtmlProps } from './pdf-cash-receipt-print-html';
import { Button } from '@/components/ui/button';
import { SetPageTitle } from '@/components/set-page-title';
import { useHRContractsStore } from '@/lib/contracts/contracts-store';
import { data, getBranch } from '@/lib/data';
import { exportDomToPdf } from '@/lib/pdf/exportDomToPdf';
import type { CashReceiptReason } from './pdf-cash-receipt-print-html';

function amountWords(n: number): string {
  return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)} ريال سعودي فقط لا غير`;
}

type DocTab = 'payroll' | 'receipt' | 'clearance';

export function ReportsClient() {
  const { contracts } = useHRContractsStore();
  const employees = data.employees;

  const [tab, setTab] = React.useState<DocTab>('payroll');
  const [clearanceExporting, setClearanceExporting] = React.useState(false);
  const [receiptExporting, setReceiptExporting] = React.useState(false);
  const clearancePrintRef = React.useRef<HTMLDivElement>(null);
  const receiptPrintRef = React.useRef<HTMLDivElement>(null);

  const [rcptEmpId, setRcptEmpId]       = React.useState(employees[0]?.id ?? '');
  const [rcptAmount, setRcptAmount]     = React.useState('');
  const [rcptWritten, setRcptWritten]   = React.useState('');
  const [rcptReason, setRcptReason]     = React.useState<CashReceiptReason>('salary');
  const [rcptDetail, setRcptDetail]     = React.useState('');
  const [rcptDate, setRcptDate]         = React.useState(new Date().toISOString().slice(0, 10));

  const [clrEmpId, setClrEmpId]     = React.useState(employees[0]?.id ?? '');
  const [clrEndDate, setClrEndDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [clrDate, setClrDate]       = React.useState(new Date().toISOString().slice(0, 10));

  const company = React.useMemo(() => ({
    nameAr: data.company.name,
    nameEn: data.company.nameEn,
  }), []);

  const clearancePrint = React.useMemo((): { props: ClearancePrintProps; fileName: string } | null => {
    const emp = employees.find(e => e.id === clrEmpId);
    if (!emp) return null;
    const contract = contracts.find(c => c.employeeId === clrEmpId && c.status === 'active')
      ?? contracts.find(c => c.employeeId === clrEmpId);
    return {
      props: {
        company,
        employeeNameAr: emp.name,
        nationalId: emp.nationalId,
        nationality: emp.nationality,
        startDate: contract?.startDate ?? emp.startDate,
        endDate: clrEndDate,
        date: clrDate,
      },
      fileName: `clearance-${emp.employeeCode}.pdf`,
    };
  }, [employees, contracts, clrEmpId, clrEndDate, clrDate, company]);

  const receiptPrint = React.useMemo((): { props: CashReceiptPrintHtmlProps; fileName: string } | null => {
    const emp = employees.find(e => e.id === rcptEmpId);
    if (!emp) return null;
    const branch = getBranch(emp.branchId);
    return {
      props: {
        company,
        employeeNameAr: emp.name,
        branchNameAr: branch?.name ?? 'المقر الرئيسي',
        amountNumeric: Number(rcptAmount) || 0,
        amountWritten: rcptWritten || amountWords(Number(rcptAmount) || 0),
        reason: rcptReason,
        reasonDetail: rcptDetail,
        date: rcptDate,
      },
      fileName: `cash-receipt-${emp.employeeCode}-${rcptDate.slice(0, 7)}.pdf`,
    };
  }, [employees, company, rcptEmpId, rcptAmount, rcptWritten, rcptReason, rcptDetail, rcptDate]);

  const handleClearanceDownload = React.useCallback(async () => {
    if (!clearancePrint) {
      toast.error('الرجاء اختيار الموظف');
      return;
    }
    const el = clearancePrintRef.current;
    if (!el) {
      toast.error('تعذر العثور على منطقة الطباعة');
      return;
    }
    setClearanceExporting(true);
    try {
      await exportDomToPdf(el, clearancePrint.fileName);
      toast.success('تم تنزيل الملف');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'فشل تصدير PDF');
    } finally {
      setClearanceExporting(false);
    }
  }, [clearancePrint]);

  const handleReceiptDownload = React.useCallback(async () => {
    if (!receiptPrint) {
      toast.error('الرجاء اختيار الموظف');
      return;
    }
    const el = receiptPrintRef.current;
    if (!el) {
      toast.error('تعذر العثور على منطقة الطباعة');
      return;
    }
    setReceiptExporting(true);
    try {
      await exportDomToPdf(el, receiptPrint.fileName);
      toast.success('تم تنزيل الملف');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'فشل تصدير PDF');
    } finally {
      setReceiptExporting(false);
    }
  }, [receiptPrint]);

  const switchTab = (t: DocTab) => { setTab(t); };

  const TABS: { key: DocTab; label: string; icon: React.ElementType }[] = [
    { key: 'payroll',   label: 'مسير الرواتب',    icon: FileSpreadsheet },
    { key: 'receipt',   label: 'سند استلام نقدي', icon: ReceiptText },
    { key: 'clearance', label: 'مخالصة موظف',     icon: ScrollText },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <SetPageTitle titleAr="كشف مسيرات الرواتب" descriptionAr="إنشاء وطباعة التقارير الرسمية وتصديرها PDF" iconName="FileText" />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="نوع التقرير">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            variant={tab === key ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={() => switchTab(key)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Button>
        ))}
      </div>

      {tab === 'payroll' && <PayrollMultiPeriodExplorer />}

      {tab !== 'payroll' && (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">خيارات النموذج</h3>
          </div>

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

          {tab === 'receipt' ? (
            <Button
              type="button"
              onClick={handleReceiptDownload}
              disabled={receiptExporting || !receiptPrint}
              className="w-full gap-2 mt-2"
            >
              {receiptExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {receiptExporting ? 'جاري التصدير…' : 'تحميل PDF'}
            </Button>
          ) : tab === 'clearance' ? (
            <Button
              type="button"
              onClick={handleClearanceDownload}
              disabled={clearanceExporting || !clearancePrint}
              className="w-full gap-2 mt-2"
            >
              {clearanceExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {clearanceExporting ? 'جاري التصدير…' : 'تحميل PDF'}
            </Button>
          ) : null}

          {(tab === 'receipt' || tab === 'clearance') && (
            <p className="text-xs text-muted-foreground text-center">
              المعاينة الحية على اليمين؛ التحميل يلتقط نفس العرض كملف PDF.
            </p>
          )}
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-soft overflow-hidden" style={{ minHeight: 620 }}>
          {tab === 'clearance' && clearancePrint ? (
            <div className="h-full max-h-[min(80vh,900px)] overflow-auto bg-muted/20 p-4" dir="rtl">
              <ClearancePrintHtml ref={clearancePrintRef} {...clearancePrint.props} />
            </div>
          ) : tab === 'receipt' && receiptPrint ? (
            <div className="h-full max-h-[min(80vh,900px)] overflow-auto bg-muted/20 p-4" dir="rtl">
              <CashReceiptPrintHtml ref={receiptPrintRef} {...receiptPrint.props} />
            </div>
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
                  {tab === 'receipt' && 'اختر الموظف والخيارات لتظهر المعاينة هنا'}
                  {tab === 'clearance' && 'اختر الموظف والتواريخ لتظهر المعاينة هنا'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
