'use client';

import * as React from 'react';
import { User, Briefcase, Banknote, Phone } from 'lucide-react';
import { toast } from 'sonner';
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
import { cn, formatNumber } from '@/shared/utils';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { employeeAssignmentsApi } from '@/features/hr/organization/employees/lib/api/employee-assignments';
import { branchesApi, type BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import { departmentsApi, type DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import { companiesApi } from '@/features/hr/organization/lib/api/companies';

interface NewEmployeeForm {
  nameAr: string;
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
  nameAr: '', email: '', phone: '',
  nationalId: '', nationality: 'سعودي', gender: 'male', birthDate: '', maritalStatus: 'single',
  position: '', departmentId: '', branchId: '', managerId: 'none',
  contractType: 'permanent', startDate: '',
  baseSalary: '', housingAllowance: '', transportAllowance: '', otherAllowances: '',
  bankAccount: '', iban: '',
  address: '', emergencyContact: '',
  role: 'employee',
};

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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export function NewEmployeeDrawer({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = React.useState<NewEmployeeForm>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Partial<Record<keyof NewEmployeeForm, string>>>({});
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const companies = await companiesApi.getAll({ limit: 1 });
        const cid = companies.items[0]?.id ?? null;
        setCompanyId(cid);
        if (cid) {
          const [br, dp] = await Promise.all([
            branchesApi.getAll({ companyId: cid, limit: 200 }),
            departmentsApi.getAll({ companyId: cid, limit: 200 }),
          ]);
          setBranches(br.items);
          setDepartments(dp.items);
        }
      } catch {
        // silently ignore — user can still type ids
      }
    })();
  }, [open]);

  const patch = <K extends keyof NewEmployeeForm>(k: K, v: NewEmployeeForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.nameAr.trim()) e.nameAr = 'مطلوب';
    if (!form.startDate) e.startDate = 'مطلوب';
    if (!form.branchId) e.branchId = 'مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!companyId) {
      setSaveError('لم يتم العثور على شركة. تأكد من إعداد بيانات الشركة أولاً.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const emp = await employeesApi.create({
        employeeCode: `EMP-${Date.now()}`,
        nameAr: form.nameAr.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        nationalId: form.nationalId.trim() || null,
        nationality: form.nationality.trim() || null,
        gender: form.gender || null,
        birthDate: form.birthDate || null,
        maritalStatus: form.maritalStatus || null,
        position: form.position.trim() || null,
        managerId: form.managerId !== 'none' ? form.managerId : null,
        contractType: form.contractType || null,
        startDate: form.startDate || null,
        baseSalary: form.baseSalary || null,
        housingAllowance: form.housingAllowance || null,
        transportAllowance: form.transportAllowance || null,
        otherAllowances: form.otherAllowances || null,
        bankAccount: form.bankAccount.trim() || null,
        iban: form.iban.trim() || null,
        address: form.address.trim() || null,
        role: form.role || null,
      });

      await employeeAssignmentsApi.create(emp.id, {
        companyId,
        branchId: form.branchId,
        departmentId: form.departmentId || null,
        isPrimary: true,
        status: 'active',
        startDate: form.startDate || null,
      });

      toast.success('تم إضافة الموظف بنجاح');
      onCreated?.();
      onOpenChange(false);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employees.create');
      setSaveError(displayMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setSaveError(null);
  };

  const totalComp = formatNumber(
    (Number(form.baseSalary) || 0) +
      (Number(form.housingAllowance) || 0) +
      (Number(form.transportAllowance) || 0) +
      (Number(form.otherAllowances) || 0),
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden border-border p-0">
        <div className="shrink-0 border-b border-border px-6 py-5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">إضافة موظف جديد</DialogTitle>
            <DialogDescription>أدخل بيانات الموظف الجديد. الحقول المميزة بـ * إلزامية.</DialogDescription>
          </DialogHeader>
        </div>

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
              <Field label="رقم الهوية / الإقامة">
                <Input dir="ltr" value={form.nationalId} onChange={(e) => patch('nationalId', e.target.value)} placeholder="1098765432" />
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
              <Field label="البريد الإلكتروني">
                <Input dir="ltr" type="email" value={form.email} onChange={(e) => patch('email', e.target.value)} placeholder="name@company.sa" />
              </Field>
              <Field label="رقم الجوال">
                <Input dir="ltr" value={form.phone} onChange={(e) => patch('phone', e.target.value)} placeholder="+966 50 123 4567" />
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
              <Field label="المسمى الوظيفي" span2>
                <Input value={form.position} onChange={(e) => patch('position', e.target.value)} placeholder="مدير تطوير الأعمال" />
              </Field>
              <Field label="القسم">
                <Select value={form.departmentId || '_none'} onValueChange={(v) => patch('departmentId', v === '_none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— بدون قسم —</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="الفرع" required>
                <Select value={form.branchId || '_none'} onValueChange={(v) => patch('branchId', v === '_none' ? '' : v)}>
                  <SelectTrigger className={cn(errors.branchId && 'border-destructive')}>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— اختر الفرع —</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branchId && <p className="text-[11px] text-destructive">{errors.branchId}</p>}
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
              <Field label="الراتب الأساسي (ر.س)">
                <Input type="number" dir="ltr" min={0} value={form.baseSalary} onChange={(e) => patch('baseSalary', e.target.value)} placeholder="10000" />
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
            {Number(form.baseSalary) > 0 && (
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

          {saveError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {saveError}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:justify-start sm:space-x-2 sm:space-x-reverse">
          <Button variant="outline" type="button" onClick={handleClose} disabled={saving}>إلغاء</Button>
          <Button variant="luxe" type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'جاري الحفظ…' : 'إضافة الموظف'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
