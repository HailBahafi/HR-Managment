'use client';

import * as React from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SingleDatePicker } from '@/components/ui/single-date-picker';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { useAttendanceStore } from '@/lib/attendance/store';
import type { AssignmentTargetType } from '@/lib/attendance/types';
import { data } from '@/lib/data';

const ALL_DEPARTMENTS = 'all';

export function AssignmentsPanel() {
  const assignments = useAttendanceStore((s) => s.assignments);
  const shiftTemplates = useAttendanceStore((s) => s.shiftTemplates);
  const addAssignmentBatch = useAttendanceStore((s) => s.addAssignmentBatch);
  const removeAssignmentBatch = useAttendanceStore((s) => s.removeAssignmentBatch);

  const [open, setOpen] = React.useState(false);
  const [dialogContentEl, setDialogContentEl] = React.useState<HTMLElement | null>(null);
  const [templateId, setTemplateId] = React.useState('');
  const [effectiveFrom, setEffectiveFrom] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [targetType, setTargetType] = React.useState<AssignmentTargetType>('employee');
  /** When assigning to employees: restrict list to this department (`all` = no filter). */
  const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = React.useState(ALL_DEPARTMENTS);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const batches = React.useMemo(() => {
    const m = new Map<string, typeof assignments>();
    for (const a of assignments) {
      const k = a.batchId ?? a.id;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(a);
    }
    return [...m.entries()].map(([batchId, rows]) => ({
      batchId,
      rows,
      templateId: rows[0]?.templateId,
      effectiveFrom: rows[0]?.effectiveFrom,
    }));
  }, [assignments]);

  const activeTemplates = shiftTemplates.filter((t) => t.isActive);

  const openNew = () => {
    setTemplateId(activeTemplates[0]?.id ?? '');
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setTargetType('employee');
    setEmployeeDepartmentFilter(ALL_DEPARTMENTS);
    setSelectedIds(new Set());
    setOpen(true);
  };

  const submit = () => {
    if (!templateId || selectedIds.size === 0) return;
    const items = [...selectedIds].map((id) => {
      if (targetType === 'employee') {
        const e = data.employees.find((x) => x.id === id)!;
        return { targetType: 'employee' as const, targetId: id, targetLabel: e.name };
      }
      if (targetType === 'department') {
        const d = data.departments.find((x) => x.id === id)!;
        return { targetType: 'department' as const, targetId: id, targetLabel: d.name };
      }
      const b = data.branches.find((x) => x.id === id)!;
      return { targetType: 'location' as const, targetId: id, targetLabel: b.name };
    });
    addAssignmentBatch({ templateId, effectiveFrom, items });
    setOpen(false);
  };

  const multiOptions = React.useMemo((): MultiSelectOption[] => {
    if (targetType === 'employee') {
      const emps =
        employeeDepartmentFilter === ALL_DEPARTMENTS
          ? data.employees
          : data.employees.filter((e) => e.departmentId === employeeDepartmentFilter);
      return emps.map((e) => {
        const dept = data.departments.find((d) => d.id === e.departmentId);
        return {
          value: e.id,
          label: e.name,
          subtitle: [e.employeeCode, dept?.name].filter(Boolean).join(' · '),
        };
      });
    }
    if (targetType === 'department') {
      return data.departments.map((d) => ({ value: d.id, label: d.name }));
    }
    return data.branches.map((b) => ({ value: b.id, label: b.name }));
  }, [targetType, employeeDepartmentFilter]);

  React.useEffect(() => {
    if (targetType !== 'employee') return;
    const allowedIds = new Set(
      (employeeDepartmentFilter === ALL_DEPARTMENTS
        ? data.employees
        : data.employees.filter((e) => e.departmentId === employeeDepartmentFilter)
      ).map((e) => e.id),
    );
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => allowedIds.has(id)));
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) return prev;
      return next;
    });
  }, [targetType, employeeDepartmentFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">تعيين قوالب الشفت لموظفين أو أقسام أو فروع مع تجميع دفعات.</p>
        <Button variant="luxe" className="gap-2" type="button" onClick={openNew}>
          <Plus className="h-4 w-4" />
          تعيين دفعة
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-right">الدفعة</th>
                <th className="px-4 py-3 text-right">القالب</th>
                <th className="px-4 py-3 text-right">ساري من</th>
                <th className="px-4 py-3 text-right">عدد العناصر</th>
                <th className="w-24 px-4 py-3 text-right">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(({ batchId, rows, templateId: tid, effectiveFrom: ef }) => {
                const tpl = shiftTemplates.find((t) => t.id === tid);
                return (
                  <tr key={batchId} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground" dir="ltr">
                      {batchId.slice(0, 18)}…
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {tpl && <span className="h-2 w-2 rounded-full" style={{ background: tpl.colorHex }} />}
                        <span className="font-medium">{tpl?.nameAr ?? tid}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                      {ef}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="subtle" className="gap-1">
                        <Users className="h-3 w-3" />
                        <span className="number-ar">{rows.length}</span>
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        type="button"
                        aria-label="حذف الدفعة"
                        onClick={() => {
                          if (window.confirm('حذف كل عناصر هذه الدفعة؟')) removeAssignmentBatch(batchId);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          ref={setDialogContentEl}
          className="flex max-h-[min(90vh,640px)] flex-col gap-0 overflow-hidden border-border p-0 sm:max-w-lg"
        >
          <div className="shrink-0 space-y-2 border-b border-border px-6 pb-4 pt-6">
            <DialogHeader className="space-y-2 text-right">
              <DialogTitle className="font-display text-lg">تعيين دفعة جديدة</DialogTitle>
              <DialogDescription>اختر القالب وتاريخ السريان ثم حدد الأهداف.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              <Label>القالب</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="قالب" />
                </SelectTrigger>
                <SelectContent>
                  {activeTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ساري من</Label>
              <SingleDatePicker value={effectiveFrom} onChange={setEffectiveFrom} />
            </div>
            <div className="space-y-2">
              <Label>نوع الهدف</Label>
              <Select
                value={targetType}
                onValueChange={(v) => {
                  const next = v as AssignmentTargetType;
                  setTargetType(next);
                  setSelectedIds(new Set());
                  if (next !== 'employee') setEmployeeDepartmentFilter(ALL_DEPARTMENTS);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">موظف</SelectItem>
                  <SelectItem value="department">قسم</SelectItem>
                  <SelectItem value="location">فرع</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {targetType === 'employee' ? (
              <div className="space-y-2">
                <Label>تصفية حسب القسم</Label>
                <Select value={employeeDepartmentFilter} onValueChange={setEmployeeDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل الأقسام" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_DEPARTMENTS}>كل الأقسام</SelectItem>
                    {data.departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <MultiSelect
              label="الأهداف"
              options={multiOptions}
              value={[...selectedIds]}
              onChange={(ids) => setSelectedIds(new Set(ids))}
              placeholder={
                targetType === 'employee'
                  ? 'اختر موظفين…'
                  : targetType === 'department'
                    ? 'اختر أقسام…'
                    : 'اختر فروع…'
              }
              searchPlaceholder={
                targetType === 'employee'
                  ? 'بحث بالاسم أو الرمز أو القسم…'
                  : 'بحث بالاسم…'
              }
              emptyMessage="لا توجد عناصر مطابقة"
              selectAllLabel="تحديد الكل"
              deselectAllLabel="إلغاء التحديد"
              listMaxHeight="min(220px,36vh)"
              popoverPortalContainer={dialogContentEl}
            />
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:justify-start sm:space-x-2 sm:space-x-reverse">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button variant="luxe" type="button" onClick={submit} disabled={!templateId || selectedIds.size === 0}>
              تأكيد التعيين
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
