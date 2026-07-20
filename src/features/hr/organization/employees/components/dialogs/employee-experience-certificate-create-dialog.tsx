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
import type { Employee } from '@/features/hr/organization/employees/types';
import type {
  CreateExperienceCertificateDto,
  ExperienceCertificateLanguage,
} from '@/features/hr/organization/employees/lib/api/experience-certificates';
import { todayIsoDate } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';

type FormState = {
  certificateNumber: string;
  issuanceDate: string;
  serviceStartDate: string;
  serviceEndDate: string;
  jobTitleOnCertificate: string;
  dutiesSummary: string;
  purpose: string;
  addressedTo: string;
  language: ExperienceCertificateLanguage;
  notes: string;
};

function defaultForm(employee: Employee): FormState {
  const year = new Date().getFullYear();
  return {
    certificateNumber: `EXP-${year}-`,
    issuanceDate: todayIsoDate(),
    serviceStartDate: employee.startDate || todayIsoDate(),
    serviceEndDate: employee.endDate || todayIsoDate(),
    jobTitleOnCertificate: employee.position || '',
    dutiesSummary: '',
    purpose: '',
    addressedTo: '',
    language: 'ar',
    notes: '',
  };
}

type Props = {
  open: boolean;
  employee: Employee;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    payload: Omit<CreateExperienceCertificateDto, 'companyId' | 'employeeId' | 'createdBy'>,
  ) => Promise<unknown>;
};

export function EmployeeExperienceCertificateCreateDialog({
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
    const certificateNumber = form.certificateNumber.trim();
    const jobTitleOnCertificate = form.jobTitleOnCertificate.trim();
    if (!certificateNumber || !jobTitleOnCertificate || !form.issuanceDate || !form.serviceStartDate) {
      return;
    }

    const result = await onSubmit({
      certificateNumber,
      issuanceDate: form.issuanceDate,
      serviceStartDate: form.serviceStartDate,
      serviceEndDate: form.serviceEndDate || null,
      jobTitleOnCertificate,
      dutiesSummary: form.dutiesSummary.trim() || null,
      purpose: form.purpose.trim() || null,
      addressedTo: form.addressedTo.trim() || null,
      language: form.language,
      notes: form.notes.trim() || null,
      issuedByEmployeeId: employee.id,
    });

    if (result) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">إنشاء شهادة خبرة</DialogTitle>
          <DialogDescription>
            تُنشأ كمسودة عبر الـ API للموظف{' '}
            <span className="font-medium text-foreground">{employee.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="exp-cert-no">رقم الشهادة</Label>
              <Input
                id="exp-cert-no"
                dir="ltr"
                value={form.certificateNumber}
                onChange={(e) => patch('certificateNumber', e.target.value)}
                placeholder="EXP-2026-0001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-issue-date">تاريخ الإصدار</Label>
              <DatePickerInput
                id="exp-issue-date"
                value={form.issuanceDate}
                onChange={(v) => patch('issuanceDate', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>اللغة</Label>
              <Select
                value={form.language}
                onValueChange={(v) => patch('language', v as ExperienceCertificateLanguage)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">عربي</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="both">ثنائي اللغة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-svc-start">بداية الخدمة</Label>
              <DatePickerInput
                id="exp-svc-start"
                value={form.serviceStartDate}
                onChange={(v) => patch('serviceStartDate', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-svc-end">نهاية الخدمة</Label>
              <DatePickerInput
                id="exp-svc-end"
                value={form.serviceEndDate}
                onChange={(v) => patch('serviceEndDate', v)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="exp-job-title">المسمى الوظيفي في الشهادة</Label>
              <Input
                id="exp-job-title"
                value={form.jobTitleOnCertificate}
                onChange={(e) => patch('jobTitleOnCertificate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="exp-duties">ملخص المهام</Label>
              <Textarea
                id="exp-duties"
                rows={3}
                dir="rtl"
                className="resize-y text-sm"
                value={form.dutiesSummary}
                onChange={(e) => patch('dutiesSummary', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-purpose">الغرض</Label>
              <Input
                id="exp-purpose"
                value={form.purpose}
                onChange={(e) => patch('purpose', e.target.value)}
                placeholder="لتقديمها للجهات المعنية"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-addressed">موجّهة إلى</Label>
              <Input
                id="exp-addressed"
                value={form.addressedTo}
                onChange={(e) => patch('addressedTo', e.target.value)}
                placeholder="الجهات الحكومية"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="exp-notes">ملاحظات</Label>
              <Textarea
                id="exp-notes"
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
