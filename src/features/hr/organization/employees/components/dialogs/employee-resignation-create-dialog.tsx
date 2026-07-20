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
import type { Employee } from '@/features/hr/organization/employees/types';
import type { CreateEmployeeResignationDto } from '@/features/hr/organization/employees/lib/api/employee-resignations';
import { todayIsoDate } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';

const DEFAULT_REASONS =
  '1. ظروف شخصية\n2. فرصة عمل أخرى\n3. الانتقال لمدينة أخرى';

type FormState = {
  resignationNumber: string;
  submissionDate: string;
  effectiveDateGregorian: string;
  effectiveDateHijri: string;
  branchNameAr: string;
  jobTitle: string;
  nationality: string;
  reasons: string;
  applicantName: string;
  signatureName: string;
  notes: string;
};

function defaultForm(employee: Employee): FormState {
  const year = new Date().getFullYear();
  return {
    resignationNumber: `RES-${year}-`,
    submissionDate: todayIsoDate(),
    effectiveDateGregorian: todayIsoDate(),
    effectiveDateHijri: '',
    branchNameAr: employee.branchNameAr || '',
    jobTitle: employee.position || '',
    nationality: employee.nationality || '',
    reasons: DEFAULT_REASONS,
    applicantName: employee.name || '',
    signatureName: employee.name || '',
    notes: '',
  };
}

type Props = {
  open: boolean;
  employee: Employee;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    payload: Omit<CreateEmployeeResignationDto, 'companyId' | 'employeeId' | 'createdBy'>,
  ) => Promise<unknown>;
};

export function EmployeeResignationCreateDialog({
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
    const resignationNumber = form.resignationNumber.trim();
    if (!resignationNumber || !form.submissionDate || !form.effectiveDateGregorian) return;

    const result = await onSubmit({
      resignationNumber,
      submissionDate: form.submissionDate,
      effectiveDateGregorian: form.effectiveDateGregorian,
      effectiveDateHijri: form.effectiveDateHijri.trim() || null,
      branchNameAr: form.branchNameAr.trim() || null,
      jobTitle: form.jobTitle.trim() || null,
      nationality: form.nationality.trim() || null,
      reasons: form.reasons.trim() || null,
      applicantName: form.applicantName.trim() || null,
      signatureName: form.signatureName.trim() || null,
      notes: form.notes.trim() || null,
      issuedByEmployeeId: employee.id,
    });

    if (result) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">إنشاء طلب استقالة</DialogTitle>
          <DialogDescription>
            تُنشأ كمسودة عبر الـ API للموظف{' '}
            <span className="font-medium text-foreground">{employee.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="res-number">رقم الاستقالة</Label>
              <Input
                id="res-number"
                dir="ltr"
                value={form.resignationNumber}
                onChange={(e) => patch('resignationNumber', e.target.value)}
                placeholder="RES-2026-0001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-submit">تاريخ التقديم</Label>
              <DatePickerInput
                id="res-submit"
                value={form.submissionDate}
                onChange={(v) => patch('submissionDate', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-effective">تاريخ السريان (ميلادي)</Label>
              <DatePickerInput
                id="res-effective"
                value={form.effectiveDateGregorian}
                onChange={(v) => patch('effectiveDateGregorian', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-hijri">تاريخ السريان (هجري)</Label>
              <Input
                id="res-hijri"
                dir="ltr"
                value={form.effectiveDateHijri}
                onChange={(e) => patch('effectiveDateHijri', e.target.value)}
                placeholder="15/01/1446"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-branch">الفرع</Label>
              <Input
                id="res-branch"
                value={form.branchNameAr}
                onChange={(e) => patch('branchNameAr', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-job">المسمى الوظيفي</Label>
              <Input
                id="res-job"
                value={form.jobTitle}
                onChange={(e) => patch('jobTitle', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-nationality">الجنسية</Label>
              <Input
                id="res-nationality"
                value={form.nationality}
                onChange={(e) => patch('nationality', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-applicant">اسم مقدّم الطلب</Label>
              <Input
                id="res-applicant"
                value={form.applicantName}
                onChange={(e) => patch('applicantName', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-signature">اسم التوقيع</Label>
              <Input
                id="res-signature"
                value={form.signatureName}
                onChange={(e) => patch('signatureName', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="res-reasons">الأسباب</Label>
              <Textarea
                id="res-reasons"
                rows={4}
                dir="rtl"
                className="resize-y text-sm"
                value={form.reasons}
                onChange={(e) => patch('reasons', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="res-notes">ملاحظات</Label>
              <Textarea
                id="res-notes"
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
