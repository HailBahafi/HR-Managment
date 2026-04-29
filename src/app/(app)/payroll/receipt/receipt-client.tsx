'use client';

import * as React from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import {
  Download, Eye, FileText, User, Building2, CreditCard, Calendar, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { data, getEmployee, getBranch, getDepartment } from '@/lib/data';
import { cn, formatCurrency } from '@/lib/utils';
import { useSetPageTitle } from '@/components/page-title-context';
import SalaryReceiptDocument, { type ReceiptEmployee, type ReceiptPayslip } from '@/components/pdf/salary-receipt-pdf';

function buildReceiptEmployee(empId: string): ReceiptEmployee | null {
  const emp = getEmployee(empId);
  if (!emp) return null;
  const branch = getBranch(emp.branchId);
  const dept   = getDepartment(emp.departmentId);
  return {
    name: emp.name, nameEn: emp.nameEn, employeeCode: emp.employeeCode,
    position: emp.position, department: dept?.name ?? '', branch: branch?.name ?? '',
    nationalId: emp.nationalId, iban: emp.iban, startDate: emp.startDate,
  };
}

function buildReceiptPayslip(raw: (typeof data.payslips)[0]): ReceiptPayslip {
  return {
    month: raw.month, year: raw.year,
    baseSalary: raw.baseSalary, housing: raw.housing, transport: raw.transport,
    otherAllowances: raw.otherAllowances, overtime: raw.overtime,
    gosi: raw.gosi, absenceDeduction: raw.absenceDeduction,
    latenessDeduction: raw.latenessDeduction, loanDeduction: raw.loanDeduction,
    otherDeductions: raw.otherDeductions,
    gross: raw.gross, net: raw.net,
    workingDays: raw.workingDays, presentDays: raw.presentDays,
    absentDays: raw.absentDays, lateDays: raw.lateDays,
  };
}

export function ReceiptClient() {
  useSetPageTitle({ titleAr: 'إيصالات الرواتب', descriptionAr: 'إنشاء وتحميل إيصالات استلام الراتب', iconName: 'FileText' });

  const [selectedId, setSelectedId] = React.useState<string>(data.payslips[0]?.id ?? '');
  const [preview, setPreview]       = React.useState(false);

  const payslip        = data.payslips.find(p => p.id === selectedId);
  const employee       = payslip ? buildReceiptEmployee(payslip.employeeId) : null;
  const receiptPayslip = payslip ? buildReceiptPayslip(payslip) : null;
  const LOGO_URL       = `${window.location.origin}/logo.png`;
  const canRender      = !!employee && !!receiptPayslip;

  const fileName = canRender
    ? `إيصال-${employee!.employeeCode}-${receiptPayslip!.month}-${receiptPayslip!.year}.pdf`
    : 'receipt.pdf';

  const pdfDoc = canRender ? (
    <SalaryReceiptDocument employee={employee!} payslip={receiptPayslip!} logoUrl={LOGO_URL} />
  ) : null;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">إيصالات استلام الراتب</h1>
          <p className="mt-1 text-sm text-muted-foreground">اختر الموظف والشهر لمعاينة الإيصال وتحميله بصيغة PDF</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-4 w-4 text-primary" />
          <span>{data.payslips.length} إيصال متاح</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          اختر الإيصال:
        </div>
        <Select value={selectedId} onValueChange={v => { setSelectedId(v); setPreview(false); }}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="اختر موظفاً وشهراً…" />
          </SelectTrigger>
          <SelectContent>
            {data.payslips.map(p => {
              const emp = getEmployee(p.employeeId);
              return (
                <SelectItem key={p.id} value={p.id}>
                  {emp?.name ?? p.employeeId} — {p.month} {p.year}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 mr-auto flex-wrap">
          <Button
            variant="outline" size="sm" className="gap-2"
            onClick={() => setPreview(v => !v)} disabled={!canRender}
          >
            <Eye className="h-4 w-4" />
            {preview ? 'إخفاء المعاينة' : 'معاينة'}
          </Button>

          {canRender && pdfDoc && (
            <PDFDownloadLink document={pdfDoc} fileName={fileName}>
              {({ loading }) => (
                <Button variant="luxe" size="sm" className="gap-2" disabled={loading}>
                  <Download className="h-4 w-4" />
                  {loading ? 'جارٍ التحضير…' : 'تحميل PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">

        {/* Left: employee + summary */}
        <div className="space-y-4">

          {employee ? (
            <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
              <div className="bg-[hsl(175,55%,14%)] px-5 py-4">
                <p className="text-[11px] text-white/50 mb-1 tracking-wider uppercase">الموظف</p>
                <h2 className="font-display text-lg font-bold text-white">{employee.name}</h2>
                <p className="text-sm text-white/60 mt-0.5">{employee.position}</p>
              </div>
              <div className="divide-y divide-border/40">
                {[
                  { icon: User,       label: 'رقم الموظف',      value: employee.employeeCode },
                  { icon: Building2,  label: 'القسم / الفرع',    value: `${employee.department} · ${employee.branch}` },
                  { icon: CreditCard, label: 'IBAN',              value: employee.iban },
                  { icon: Calendar,   label: 'تاريخ الالتحاق',   value: employee.startDate },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <row.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">{row.label}</p>
                      <p className="text-sm font-semibold truncate">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-12 text-muted-foreground">
              <User className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">اختر موظفاً من القائمة</p>
            </div>
          )}

          {receiptPayslip && (
            <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
                <p className="font-display text-sm font-bold">ملخص الراتب</p>
                <Badge variant="gold" className="text-[10px]">{receiptPayslip.month} {receiptPayslip.year}</Badge>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: 'الراتب الأساسي',     value: receiptPayslip.baseSalary,  color: 'text-foreground' },
                  { label: 'إجمالي البدلات',      value: receiptPayslip.housing + receiptPayslip.transport + receiptPayslip.otherAllowances + receiptPayslip.overtime, color: 'text-emerald-600' },
                  { label: 'إجمالي الاستحقاقات', value: receiptPayslip.gross,       color: 'text-emerald-700', bold: true },
                  { label: 'إجمالي الخصومات',    value: receiptPayslip.gosi + receiptPayslip.absenceDeduction + receiptPayslip.latenessDeduction + receiptPayslip.loanDeduction + receiptPayslip.otherDeductions, color: 'text-destructive', minus: true },
                ].map((r, i) => (
                  <div key={i} className={cn('flex items-center justify-between', i === 2 && 'pt-2 border-t border-border/40')}>
                    <span className="text-xs text-muted-foreground">{r.label}</span>
                    <span className={cn('text-sm tabular-nums font-semibold', r.color, r.bold && 'text-base')}>
                      {r.minus ? '(' : ''}{formatCurrency(r.value)}{r.minus ? ')' : ''}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-[hsl(38,62%,92%)] rounded-lg px-3 py-2.5">
                  <span className="text-sm font-bold text-[hsl(175,55%,18%)]">صافي الراتب</span>
                  <span className="font-display text-xl font-bold text-[hsl(38,62%,35%)]">
                    {formatCurrency(receiptPayslip.net)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {receiptPayslip && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'أيام العمل', value: receiptPayslip.workingDays, color: 'text-foreground' },
                { label: 'حضور',       value: receiptPayslip.presentDays, color: 'text-emerald-600' },
                { label: 'غياب',       value: receiptPayslip.absentDays,  color: 'text-destructive' },
                { label: 'تأخر',       value: receiptPayslip.lateDays,    color: 'text-amber-600' },
              ].map((a, i) => (
                <div key={i} className="flex flex-col items-center rounded-xl border border-border bg-card py-3 px-2">
                  <span className={cn('font-display text-xl font-bold', a.color)}>{a.value}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{a.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: PDF viewer / placeholder */}
        <div className={cn(
          'rounded-xl border border-border bg-card shadow-soft overflow-hidden transition-all',
          preview ? 'min-h-[700px]' : 'flex items-center justify-center min-h-[300px]',
        )}>
          {preview && canRender && pdfDoc ? (
            <PDFViewer width="100%" height="100%" style={{ minHeight: 700, border: 'none' }}>
              {pdfDoc}
            </PDFViewer>
          ) : (
            <div className="flex flex-col items-center gap-4 py-16 text-center px-8">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(38,62%,52%)]">
                  <Download className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div>
                <p className="font-display text-base font-bold">
                  {canRender ? 'الإيصال جاهز' : 'اختر إيصالاً'}
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  {canRender
                    ? 'اضغط "معاينة" لعرض الإيصال كامل أو "تحميل PDF" لحفظه'
                    : 'اختر موظفاً وشهراً من القائمة أعلاه'}
                </p>
              </div>
              {canRender && pdfDoc && (
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setPreview(true)}>
                    <Eye className="h-4 w-4" /> معاينة
                  </Button>
                  <PDFDownloadLink document={pdfDoc} fileName={fileName}>
                    {({ loading }) => (
                      <Button variant="luxe" size="sm" className="gap-2" disabled={loading}>
                        <Download className="h-4 w-4" />
                        {loading ? 'جارٍ التحضير…' : 'تحميل PDF'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
