'use client';

import * as React from 'react';
import { X, User, Briefcase, Banknote, Phone, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { data } from '@/lib/data';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewEmployeeForm {
  nameAr: string; nameEn: string;
  email: string; phone: string;
  nationalId: string; nationality: string;
  gender: string; birthDate: string; maritalStatus: string;
  position: string; departmentId: string; branchId: string; managerId: string;
  contractType: string; startDate: string;
  baseSalary: string; housingAllowance: string; transportAllowance: string; otherAllowances: string;
  bankAccount: string; iban: string;
  address: string; emergencyContact: string;
  role: string;
}

const EMPTY_FORM: NewEmployeeForm = {
  nameAr: '', nameEn: '', email: '', phone: '',
  nationalId: '', nationality: 'سعودي', gender: 'male', birthDate: '', maritalStatus: 'single',
  position: '', departmentId: '', branchId: '', managerId: 'none',
  contractType: 'permanent', startDate: '',
  baseSalary: '', housingAllowance: '', transportAllowance: '', otherAllowances: '',
  bankAccount: '', iban: '',
  address: '', emergencyContact: '',
  role: 'employee',
};

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

// ─── Field row ────────────────────────────────────────────────────────────────

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={cn('space-y-1.5', span2 && 'sm:col-span-2')}>
      <Label className="text-xs text-muted-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function NewEmployeeDrawer({ open, onOpenChange }: Props) {
  const [form, setForm] = React.useState<NewEmployeeForm>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Partial<Record<keyof NewEmployeeForm, string>>>({});
  const [saved, setSaved] = React.useState(false);

  const patch = <K extends keyof NewEmployeeForm>(k: K, v: NewEmployeeForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.nameAr.trim()) e.nameAr = 'مطلوب';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'بريد غير صالح';
    if (!form.phone.trim()) e.phone = 'مطلوب';
    if (!form.nationalId.trim()) e.nationalId = 'مطلوب';
    if (!form.position.trim()) e.position = 'مطلوب';
    if (!form.departmentId) e.departmentId = 'مطلوب';
    if (!form.branchId) e.branchId = 'مطلوب';
    if (!form.startDate) e.startDate = 'مطلوب';
    if (!form.baseSalary || Number(form.baseSalary) <= 0) e.baseSalary = 'مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onOpenChange(false);
      setForm(EMPTY_FORM);
    }, 1200);
  };

  const handleClose = () => {
    onOpenChange(false);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const totalComp = (
    (Number(form.baseSalary) || 0) +
    (Number(form.housingAllowance) || 0) +
    (Number(form.transportAllowance) || 0) +
    (Number(form.otherAllowances) || 0)
  ).toLocaleString('ar-SA');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden border-border p-0">
        {/* Header */}
        <div className="shrink-0 border-b border-border px-6 py-5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">إضافة موظف جديد</DialogTitle>
            <DialogDescription>أدخل بيانات الموظف الجديد. الحقول المميزة بـ * إلزامية.</DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Personal info */}
          <div className="space-y-4">
            <SectionHeader icon={User} title="البيانات الشخصية" description="المعلومات الأساسية للموظف" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم الكامل بالعربية" required>
                <Input
                  value={form.nameAr}
                  onChange={(e) => patch('nameAr', e.target.value)}
                  className={cn(errors.nameAr && 'border-destructive')}
                  placeholder="عبدالرحمن المالكي"
                />
                {errors.nameAr && <p className="text-[11px] text-destructive">{errors.nameAr}</p>}
              </Field>
              <Field label="الاسم بالإنجليزية">
                <Input dir="ltr" value={form.nameEn} onChange={(e) => patch('nameEn', e.target.value)} placeholder="Abdulrahman Al-Malki" />
              </Field>
              <Field label="الجنس">
                <Select value={form.gender} onValueChange={(v) => patch('gender', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="تاريخ الميلاد">
                <Input type="date" dir="ltr" value={form.birthDate} onChange={(e) => patch('birthDate', e.target.value)} />
              </Field>
              <Field label="الجنسية">
                <Input value={form.nationality} onChange={(e) => patch('nationality', e.target.value)} placeholder="سعودي" />
              </Field>
              <Field label="الحالة الاجتماعية">
                <Select value={form.maritalStatus} onValueChange={(v) => patch('maritalStatus', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">أعزب</SelectItem>
                    <SelectItem value="married">متزوج</SelectItem>
                    <SelectItem value="divorced">مطلق</SelectItem>
                    <SelectItem value="widowed">أرمل</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="رقم الهوية / الإقامة" required>
                <Input
                  dir="ltr"
                  value={form.nationalId}
                  onChange={(e) => patch('nationalId', e.target.value)}
                  className={cn(errors.nationalId && 'border-destructive')}
                  placeholder="1098765432"
                />
                {errors.nationalId && <p className="text-[11px] text-destructive">{errors.nationalId}</p>}
              </Field>
              <Field label="العنوان">
                <Input value={form.address} onChange={(e) => patch('address', e.target.value)} placeholder="حي النخيل، الرياض" />
              </Field>
            </div>
          </div>

          <Separator />

          {/* Contact */}
          <div className="space-y-4">
            <SectionHeader icon={Phone} title="بيانات التواصل" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="البريد الإلكتروني" required>
                <Input
                  dir="ltr"
                  type="email"
                  value={form.email}
                  onChange={(e) => patch('email', e.target.value)}
                  className={cn(errors.email && 'border-destructive')}
                  placeholder="name@company.sa"
                />
                {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
              </Field>
              <Field label="رقم الجوال" required>
                <Input
                  dir="ltr"
                  value={form.phone}
                  onChange={(e) => patch('phone', e.target.value)}
                  className={cn(errors.phone && 'border-destructive')}
                  placeholder="+966 50 123 4567"
                />
                {errors.phone && <p className="text-[11px] text-destructive">{errors.phone}</p>}
              </Field>
              <Field label="جهة اتصال الطوارئ">
                <Input dir="ltr" value={form.emergencyContact} onChange={(e) => patch('emergencyContact', e.target.value)} placeholder="+966 55 000 1111" />
              </Field>
            </div>
          </div>

          <Separator />

          {/* Employment */}
          <div className="space-y-4">
            <SectionHeader icon={Briefcase} title="بيانات التوظيف" description="المسمى الوظيفي والقسم والفرع" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="المسمى الوظيفي" required span2>
                <Input
                  value={form.position}
                  onChange={(e) => patch('position', e.target.value)}
                  className={cn(errors.position && 'border-destructive')}
                  placeholder="مدير تطوير الأعمال"
                />
                {errors.position && <p className="text-[11px] text-destructive">{errors.position}</p>}
              </Field>
              <Field label="القسم" required>
                <Select value={form.departmentId} onValueChange={(v) => patch('departmentId', v)}>
                  <SelectTrigger className={cn(errors.departmentId && 'border-destructive')}>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && <p className="text-[11px] text-destructive">{errors.departmentId}</p>}
              </Field>
              <Field label="الفرع" required>
                <Select value={form.branchId} onValueChange={(v) => patch('branchId', v)}>
                  <SelectTrigger className={cn(errors.branchId && 'border-destructive')}>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branchId && <p className="text-[11px] text-destructive">{errors.branchId}</p>}
              </Field>
              <Field label="المدير المباشر">
                <Select value={form.managerId} onValueChange={(v) => patch('managerId', v)}>
                  <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مدير مباشر</SelectItem>
                    {data.employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="نوع العقد">
                <Select value={form.contractType} onValueChange={(v) => patch('contractType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">دائم</SelectItem>
                    <SelectItem value="fixed-term">محدد المدة</SelectItem>
                    <SelectItem value="part-time">دوام جزئي</SelectItem>
                    <SelectItem value="contractor">مستقل / مقاول</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="تاريخ الالتحاق" required>
                <Input
                  type="date"
                  dir="ltr"
                  value={form.startDate}
                  onChange={(e) => patch('startDate', e.target.value)}
                  className={cn(errors.startDate && 'border-destructive')}
                />
                {errors.startDate && <p className="text-[11px] text-destructive">{errors.startDate}</p>}
              </Field>
              <Field label="الدور في النظام">
                <Select value={form.role} onValueChange={(v) => patch('role', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">موظف</SelectItem>
                    <SelectItem value="manager">مدير</SelectItem>
                    <SelectItem value="hr-manager">مدير موارد بشرية</SelectItem>
                    <SelectItem value="admin">مدير النظام</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          <Separator />

          {/* Compensation */}
          <div className="space-y-4">
            <SectionHeader icon={Banknote} title="الراتب والبدلات" description="الحزمة التعويضية الشهرية" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الراتب الأساسي (ر.س)" required>
                <Input
                  type="number"
                  dir="ltr"
                  min={0}
                  value={form.baseSalary}
                  onChange={(e) => patch('baseSalary', e.target.value)}
                  className={cn(errors.baseSalary && 'border-destructive')}
                  placeholder="10000"
                />
                {errors.baseSalary && <p className="text-[11px] text-destructive">{errors.baseSalary}</p>}
              </Field>
              <Field label="بدل السكن (ر.س)">
                <Input type="number" dir="ltr" min={0} value={form.housingAllowance} onChange={(e) => patch('housingAllowance', e.target.value)} placeholder="0" />
              </Field>
              <Field label="بدل المواصلات (ر.س)">
                <Input type="number" dir="ltr" min={0} value={form.transportAllowance} onChange={(e) => patch('transportAllowance', e.target.value)} placeholder="0" />
              </Field>
              <Field label="بدلات أخرى (ر.س)">
                <Input type="number" dir="ltr" min={0} value={form.otherAllowances} onChange={(e) => patch('otherAllowances', e.target.value)} placeholder="0" />
              </Field>
            </div>
            {(Number(form.baseSalary) > 0) && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">إجمالي الحزمة الشهرية</span>
                <span className="font-display text-lg font-bold text-primary" dir="ltr">{totalComp} ر.س</span>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="رقم الحساب البنكي" span2>
                <Input dir="ltr" value={form.bankAccount} onChange={(e) => patch('bankAccount', e.target.value)} placeholder="SA12 3400 5600 7800 9012" />
              </Field>
              <Field label="رقم الآيبان (IBAN)" span2>
                <Input dir="ltr" value={form.iban} onChange={(e) => patch('iban', e.target.value)} placeholder="SA1234567890123456789012" />
              </Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:justify-start sm:space-x-2 sm:space-x-reverse">
          <Button variant="outline" type="button" onClick={handleClose}>إلغاء</Button>
          <Button variant="luxe" type="button" onClick={handleSave} disabled={saved}>
            {saved ? '✓ تم الحفظ' : 'إضافة الموظف'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
