'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  CASH_RECEIPT_VOUCHER_PURPOSE_LABELS,
  type CashReceiptVoucherPurpose,
  type CreateCashReceiptVoucherDto,
} from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';
import { todayIsoDate } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';

type FormState = {
  voucherNumber: string;
  receiptDate: string;
  amount: string;
  amountInWords: string;
  purpose: CashReceiptVoucherPurpose;
  purposeMonth: string;
  purposeYear: string;
  overtimeDays: string;
  otherDescription: string;
  branchNameAr: string;
  institutionNameAr: string;
  signatureName: string;
  branchManagerSignatureName: string;
  hrAffairsSignatureName: string;
  generalSupervisorSignatureName: string;
  financialManagerSignatureName: string;
  notes: string;
};

function defaultForm(employee: Employee, institutionNameAr: string): FormState {
  const now = new Date();
  const year = now.getFullYear();
  return {
    voucherNumber: `CRV-${year}-`,
    receiptDate: todayIsoDate(),
    amount: '',
    amountInWords: '',
    purpose: 'salary',
    purposeMonth: String(now.getMonth() + 1),
    purposeYear: String(year),
    overtimeDays: '',
    otherDescription: '',
    branchNameAr: employee.branchNameAr || '',
    institutionNameAr,
    signatureName: employee.name || '',
    branchManagerSignatureName: '',
    hrAffairsSignatureName: '',
    generalSupervisorSignatureName: '',
    financialManagerSignatureName: '',
    notes: '',
  };
}

type Props = {
  open: boolean;
  employee: Employee;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    payload: Omit<CreateCashReceiptVoucherDto, 'companyId' | 'employeeId' | 'createdBy'>,
  ) => Promise<unknown>;
};

export function EmployeeCashReceiptVoucherCreateDialog({
  open,
  employee,
  saving = false,
  onOpenChange,
  onSubmit,
}: Props) {
  const { data: activeCompany } = useActiveCompany();
  const institutionDefault = activeCompany?.nameAr ?? 'مؤسسة روز للتجارة';
  const [form, setForm] = React.useState<FormState>(() => defaultForm(employee, institutionDefault));

  React.useEffect(() => {
    if (open) setForm(defaultForm(employee, institutionDefault));
  }, [open, employee, institutionDefault]);

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const voucherNumber = form.voucherNumber.trim();
    const amountInWords = form.amountInWords.trim();
    const amount = Number(form.amount);
    if (!voucherNumber || !form.receiptDate || !Number.isFinite(amount) || amount <= 0) return;
    if (amountInWords.length < 3) {
      toast.error('المبلغ كتابةً مطلوب (3 أحرف على الأقل)');
      return;
    }

    const purposeMonth = form.purposeMonth ? Number(form.purposeMonth) : null;
    const purposeYear = form.purposeYear ? Number(form.purposeYear) : null;
    const overtimeDays = form.overtimeDays ? Number(form.overtimeDays) : null;

    const result = await onSubmit({
      voucherNumber,
      receiptDate: form.receiptDate,
      amount,
      amountInWords,
      purpose: form.purpose,
      purposeMonth: Number.isFinite(purposeMonth) ? purposeMonth : null,
      purposeYear: Number.isFinite(purposeYear) ? purposeYear : null,
      overtimeDays: Number.isFinite(overtimeDays) ? overtimeDays : null,
      otherDescription: form.otherDescription.trim() || null,
      branchNameAr: form.branchNameAr.trim() || null,
      institutionNameAr: form.institutionNameAr.trim() || null,
      signatureName: form.signatureName.trim() || null,
      branchManagerSignatureName: form.branchManagerSignatureName.trim() || null,
      hrAffairsSignatureName: form.hrAffairsSignatureName.trim() || null,
      generalSupervisorSignatureName: form.generalSupervisorSignatureName.trim() || null,
      financialManagerSignatureName: form.financialManagerSignatureName.trim() || null,
      notes: form.notes.trim() || null,
      issuedByEmployeeId: employee.id,
    });

    if (result) onOpenChange(false);
  };

  const showMonthYear = form.purpose === 'salary' || form.purpose === 'storage_deficit';
  const showOvertimeDays = form.purpose === 'overtime';
  const showOtherDescription = form.purpose === 'other' || form.purpose === 'transport';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">إنشاء سند استلام نقدي</DialogTitle>
          <DialogDescription>
            تُنشأ كمسودة عبر الـ API للمستلم{' '}
            <span className="font-medium text-foreground">{employee.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="crv-number">رقم السند</Label>
              <Input
                id="crv-number"
                dir="ltr"
                value={form.voucherNumber}
                onChange={(e) => patch('voucherNumber', e.target.value)}
                placeholder="CRV-2026-0001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crv-date">تاريخ الاستلام</Label>
              <DatePickerInput
                id="crv-date"
                value={form.receiptDate}
                onChange={(v) => patch('receiptDate', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الغرض</Label>
              <Select
                value={form.purpose}
                onValueChange={(v) => patch('purpose', v as CashReceiptVoucherPurpose)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CASH_RECEIPT_VOUCHER_PURPOSE_LABELS) as CashReceiptVoucherPurpose[]).map(
                    (key) => (
                      <SelectItem key={key} value={key}>
                        {CASH_RECEIPT_VOUCHER_PURPOSE_LABELS[key]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crv-amount">المبلغ (رقمًا)</Label>
              <Input
                id="crv-amount"
                type="number"
                min={0}
                step="0.01"
                dir="ltr"
                value={form.amount}
                onChange={(e) => patch('amount', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crv-words">المبلغ (كتابةً)</Label>
              <Input
                id="crv-words"
                value={form.amountInWords}
                onChange={(e) => patch('amountInWords', e.target.value)}
                placeholder="ثلاثة آلاف وخمسمائة ريال سعودي فقط لا غير"
                required
                minLength={3}
                maxLength={500}
              />
            </div>
            {showMonthYear ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="crv-month">الشهر</Label>
                  <Input
                    id="crv-month"
                    type="number"
                    min={1}
                    max={12}
                    dir="ltr"
                    value={form.purposeMonth}
                    onChange={(e) => patch('purposeMonth', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crv-year">السنة</Label>
                  <Input
                    id="crv-year"
                    type="number"
                    min={2000}
                    dir="ltr"
                    value={form.purposeYear}
                    onChange={(e) => patch('purposeYear', e.target.value)}
                  />
                </div>
              </>
            ) : null}
            {showOvertimeDays ? (
              <div className="space-y-1.5">
                <Label htmlFor="crv-ot-days">أيام الإضافي</Label>
                <Input
                  id="crv-ot-days"
                  type="number"
                  min={0}
                  dir="ltr"
                  value={form.overtimeDays}
                  onChange={(e) => patch('overtimeDays', e.target.value)}
                />
              </div>
            ) : null}
            {showOtherDescription ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="crv-other">وصف إضافي</Label>
                <Input
                  id="crv-other"
                  value={form.otherDescription}
                  onChange={(e) => patch('otherDescription', e.target.value)}
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="crv-institution">المؤسسة</Label>
              <Input
                id="crv-institution"
                value={form.institutionNameAr}
                onChange={(e) => patch('institutionNameAr', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crv-branch">الفرع</Label>
              <Input
                id="crv-branch"
                value={form.branchNameAr}
                onChange={(e) => patch('branchNameAr', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="crv-signature">توقيع المستلم</Label>
              <Input
                id="crv-signature"
                value={form.signatureName}
                onChange={(e) => patch('signatureName', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">تواقيع الاعتماد (اختياري)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="crv-bm">مدير الفرع</Label>
                  <Input
                    id="crv-bm"
                    value={form.branchManagerSignatureName}
                    onChange={(e) => patch('branchManagerSignatureName', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crv-hr">شؤون الموظفين</Label>
                  <Input
                    id="crv-hr"
                    value={form.hrAffairsSignatureName}
                    onChange={(e) => patch('hrAffairsSignatureName', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crv-gs">المشرف العام</Label>
                  <Input
                    id="crv-gs"
                    value={form.generalSupervisorSignatureName}
                    onChange={(e) => patch('generalSupervisorSignatureName', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crv-fm">المدير المالي</Label>
                  <Input
                    id="crv-fm"
                    value={form.financialManagerSignatureName}
                    onChange={(e) => patch('financialManagerSignatureName', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="crv-notes">ملاحظات</Label>
              <Textarea
                id="crv-notes"
                rows={2}
                dir="rtl"
                className="resize-y text-sm"
                value={form.notes}
                onChange={(e) => patch('notes', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" variant="luxe" disabled={saving}>
              {saving ? 'جاري الحفظ…' : 'إنشاء مسودة'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
