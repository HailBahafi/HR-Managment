'use client';

import * as React from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { CreateEmployeeAssignmentDto, EmployeeAssignmentStatusDto } from '@/features/hr/organization/employees/lib/api/employee-assignments';
import {
  EMPLOYEE_ASSIGNMENT_STATUS_LABELS,
  EMPLOYEE_ASSIGNMENT_STATUS_ORDER,
} from '@/features/hr/organization/employees/constants/employee-assignment-labels';
import { branchesApi, type BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import { departmentsApi, type DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import { jobTitlesApi, type JobTitleResponseDto } from '@/features/hr/organization/lib/api/jobTitles';
import type { EmployeeProfileAssignmentsModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileAssignments';
import type { Employee } from '@/features/hr/organization/employees/types';

type AssignmentForm = {
  companyId: string;
  branchId: string;
  departmentId: string;
  jobTitleId: string;
  isPrimary: boolean;
  status: EmployeeAssignmentStatusDto;
  startDate: string;
  endDate: string;
};

const EMPTY_FORM: AssignmentForm = {
  companyId: '',
  branchId: '',
  departmentId: '',
  jobTitleId: '',
  isPrimary: false,
  status: 'active',
  startDate: '',
  endDate: '',
};

type Props = {
  employee: Employee;
  model: EmployeeProfileAssignmentsModel;
};

export function EmployeeAssignmentDialog({ employee, model }: Props) {
  const {
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    savingAssignment,
    submitAssignment,
    assignmentCompanyContext,
  } = model;

  const [form, setForm] = React.useState<AssignmentForm>(EMPTY_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>([]);
  const [jobTitles, setJobTitles] = React.useState<JobTitleResponseDto[]>([]);
  const [loadingRefs, setLoadingRefs] = React.useState(false);

  const patch = <K extends keyof AssignmentForm>(key: K, value: AssignmentForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadScopedOptions = React.useCallback(async (companyId: string) => {
    const [br, dp, jt] = await Promise.all([
      branchesApi.getAll({ companyId, limit: 200 }),
      departmentsApi.getAll({ companyId, limit: 200 }),
      jobTitlesApi.getAll({ companyId, limit: 200 }),
    ]);
    setBranches(br.items);
    setDepartments(dp.items);
    setJobTitles(jt.items.filter((j) => j.isActive));
  }, []);

  React.useEffect(() => {
    if (!assignmentDialogOpen) return;
    setForm(EMPTY_FORM);
    setFormError(null);

    const companyId = assignmentCompanyContext?.companyId;
    if (!companyId) {
      setFormError('تعذر تحديد الشركة — اختر الشركة النشطة من الشريط العلوي أو أضف إسناداً رئيسياً أولاً.');
      setBranches([]);
      setDepartments([]);
      setJobTitles([]);
      return;
    }

    setLoadingRefs(true);
    setForm((prev) => ({ ...prev, companyId }));
    void loadScopedOptions(companyId)
      .catch((e) => setFormError(handleApiError(e).displayMessage))
      .finally(() => setLoadingRefs(false));
  }, [assignmentDialogOpen, assignmentCompanyContext?.companyId, loadScopedOptions]);

  const filteredDepartments = React.useMemo(() => {
    if (!form.branchId) return departments;
    return departments.filter((d) => d.branchId === form.branchId);
  }, [departments, form.branchId]);

  const validate = (): boolean => {
    if (!form.companyId) {
      setFormError('تعذر تحديد الشركة من بروفايل الموظف');
      return false;
    }
    if (!form.branchId) {
      setFormError('اختر الفرع');
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload: CreateEmployeeAssignmentDto = {
      companyId: form.companyId,
      branchId: form.branchId,
      departmentId: form.departmentId || null,
      jobTitleId: form.jobTitleId || null,
      isPrimary: form.isPrimary,
      status: form.status,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };
    try {
      await submitAssignment(payload);
      setForm(EMPTY_FORM);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-arabic-display">إسناد موظف</DialogTitle>
          <DialogDescription>
            ربط{' '}
            <span className="font-medium text-foreground">{employee?.name ?? '—'}</span>
            {' '}
            بفرع وقسم ومسمى وظيفي ضمن شركته الحالية.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {formError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label>الشركة</Label>
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2.5 text-sm">
              <span className="font-medium">
                {assignmentCompanyContext?.companyLabel ?? '—'}
              </span>
              {assignmentCompanyContext?.companyId ? (
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground" dir="ltr">
                  {assignmentCompanyContext.companyId}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>الفرع *</Label>
            <Select
              value={form.branchId}
              onValueChange={(v) => {
                patch('branchId', v);
                patch('departmentId', '');
              }}
              disabled={!form.companyId || loadingRefs}
            >
              <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.nameAr ?? b.nameEn ?? b.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>القسم</Label>
            <Select
              value={form.departmentId || 'none'}
              onValueChange={(v) => patch('departmentId', v === 'none' ? '' : v)}
              disabled={!form.companyId || loadingRefs}
            >
              <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— بدون قسم —</SelectItem>
                {filteredDepartments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.nameAr ?? d.nameEn ?? d.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>المسمى الوظيفي</Label>
            <Select
              value={form.jobTitleId || 'none'}
              onValueChange={(v) => patch('jobTitleId', v === 'none' ? '' : v)}
              disabled={!form.companyId || loadingRefs}
            >
              <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— بدون مسمى —</SelectItem>
                {jobTitles.map((j) => (
                  <SelectItem key={j.id} value={j.id}>{j.nameAr ?? j.nameEn ?? j.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select
                value={form.status}
                onValueChange={(v) => patch('status', v as EmployeeAssignmentStatusDto)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_ASSIGNMENT_STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>{EMPLOYEE_ASSIGNMENT_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex cursor-pointer items-end gap-2 pb-2 text-sm">
              <Checkbox
                checked={form.isPrimary}
                onCheckedChange={(v) => patch('isPrimary', v === true)}
              />
              إسناد رئيسي
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>تاريخ البداية</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => patch('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ النهاية</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => patch('endDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button
            type="button"
            className="gap-2"
            disabled={savingAssignment || loadingRefs || !form.companyId}
            onClick={() => void handleSubmit()}
          >
            {savingAssignment ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            حفظ الإسناد
          </Button>
          <Button type="button" variant="ghost" onClick={() => setAssignmentDialogOpen(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
