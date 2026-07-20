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
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import type { Employee } from '@/features/hr/organization/employees/types';
import type { CreateEmployeeClearanceDto } from '@/features/hr/organization/employees/lib/api/employee-clearances';
import { todayIsoDate } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';

const DEFAULT_REASONS =
  '• انتهاء عقد العمل\n• الرغبة الشخصية في الاستقالة\n• عدم وجود التزامات متبقية';

type FormState = {
  clearanceNumber: string;
  clearanceDate: string;
  jobTitle: string;
  reasons: string;
  financialDischargeAcknowledged: boolean;
  claimsWaived: boolean;
  noMutualObligations: boolean;
  signatureName: string;
  nationalId: string;
  notes: string;
};

function defaultForm(employee: Employee): FormState {
  const year = new Date().getFullYear();
  return {
    clearanceNumber: `CLR-${year}-`,
    clearanceDate: todayIsoDate(),
    jobTitle: employee.position || '',
    reasons: DEFAULT_REASONS,
    financialDischargeAcknowledged: true,
    claimsWaived: true,
    noMutualObligations: true,
    signatureName: employee.name || '',
    nationalId: employee.nationalId || '',
    notes: '',
  };
}

type Props = {
  open: boolean;
  employee: Employee;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    payload: Omit<CreateEmployeeClearanceDto, 'companyId' | 'employeeId' | 'createdBy'>,
  ) => Promise<unknown>;
};

export function EmployeeClearanceCreateDialog({
  open,
  employee,
  saving = false,
  onOpenChange,
  onSubmit,
}: Props) {
  const [form, setForm] = React.useState<FormState>(() => defaultForm(employee));

  React.useEffect(() => {
    if (open) setForm(defaultForm(employee));
  }, [open, employee]);

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const clearanceNumber = form.clearanceNumber.trim();
    const jobTitle = form.jobTitle.trim();
    if (!clearanceNumber || !jobTitle || !form.clearanceDate) return;

    const result = await onSubmit({
      clearanceNumber,
      clearanceDate: form.clearanceDate,
      jobTitle,
      reasons: form.reasons.trim() || null,
      financialDischargeAcknowledged: form.financialDischargeAcknowledged,
      claimsWaived: form.claimsWaived,
      noMutualObligations: form.noMutualObligations,
      signatureName: form.signatureName.trim() || null,
      nationalId: form.nationalId.trim() || null,
      notes: form.notes.trim() || null,
      issuedByEmployeeId: employee.id,
    });

    if (result) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">إنشاء إخلاء طرف</DialogTitle>
          <DialogDescription>
            تُنشأ كمسودة عبر الـ API للموظف{' '}
            <span className="font-medium text-foreground">{employee.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="clr-number">رقم إخلاء الطرف</Label>
              <Input
                id="clr-number"
                dir="ltr"
                value={form.clearanceNumber}
                onChange={(e) => patch('clearanceNumber', e.target.value)}
                placeholder="CLR-2026-0001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clr-date">تاريخ الإخلاء</Label>
              <DatePickerInput
                id="clr-date"
                value={form.clearanceDate}
                onChange={(v) => patch('clearanceDate', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clr-job">المسمى الوظيفي</Label>
              <Input
                id="clr-job"
                value={form.jobTitle}
                onChange={(e) => patch('jobTitle', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="clr-reasons">الأسباب</Label>
              <Textarea
                id="clr-reasons"
                rows={4}
                dir="rtl"
                className="resize-y text-sm"
                value={form.reasons}
                onChange={(e) => patch('reasons', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clr-signature">اسم التوقيع</Label>
              <Input
                id="clr-signature"
                value={form.signatureName}
                onChange={(e) => patch('signatureName', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clr-nid">رقم الهوية</Label>
              <Input
                id="clr-nid"
                dir="ltr"
                value={form.nationalId}
                onChange={(e) => patch('nationalId', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2 rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">إقرارات</p>
              <AckRow
                id="clr-fin"
                checked={form.financialDischargeAcknowledged}
                onCheckedChange={(v) => patch('financialDischargeAcknowledged', v)}
                label="تم إخلاء الطرف المالي"
              />
              <AckRow
                id="clr-claims"
                checked={form.claimsWaived}
                onCheckedChange={(v) => patch('claimsWaived', v)}
                label="التنازل عن المطالبات"
              />
              <AckRow
                id="clr-mutual"
                checked={form.noMutualObligations}
                onCheckedChange={(v) => patch('noMutualObligations', v)}
                label="لا توجد التزامات متبادلة"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="clr-notes">ملاحظات</Label>
              <Textarea
                id="clr-notes"
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

function AckRow({
  id,
  checked,
  onCheckedChange,
  label,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      />
      {label}
    </label>
  );
}
