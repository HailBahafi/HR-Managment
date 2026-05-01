'use client';

import * as React from 'react';
import { Plus, Trash2, Users, Building2, MapPin, CalendarDays, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <div className="flex items-center justify-end">
        <Button variant="luxe" className="gap-2" type="button" onClick={openNew}>
          <Plus className="h-4 w-4" />
          ربط قالب جديد
        </Button>
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد دفعات تعيين بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {batches.map(({ batchId, rows, templateId: tid, effectiveFrom: ef }) => {
            const tpl = shiftTemplates.find((t) => t.id === tid);
            const targetType = rows[0]?.targetType;
            const TypeIcon = targetType === 'department' ? Building2 : targetType === 'location' ? MapPin : Users;
            const typeLabel = targetType === 'department' ? 'أقسام' : targetType === 'location' ? 'فروع' : 'موظفين';
            const names = rows.map((r) => r.targetLabel).filter(Boolean);
            const visibleNames = names.slice(0, 3);
            const remaining = names.length - visibleNames.length;
            return (
              <div
                key={batchId}
                className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{rows.length} {typeLabel}</span>
                    </div>
                  </div>

                  {/* Template name */}
                  <h3 className="font-display text-base font-bold leading-snug mb-0.5 group-hover:text-primary transition-colors truncate">
                    {tpl?.nameAr ?? 'قالب محذوف'}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-3">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    <span dir="ltr">{ef}</span>
                  </div>

                  {/* Target names */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {visibleNames.map((name, i) => (
                      <span key={i} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground max-w-[140px] truncate">
                        {name}
                      </span>
                    ))}
                    {remaining > 0 && (
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        +{remaining} آخرين
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-end border-t border-border/60 pt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => { if (window.confirm('حذف كل عناصر هذه الدفعة؟')) removeAssignmentBatch(batchId); }}
                    >
                      <Trash2 className="h-3 w-3" /> حذف الربط
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          ref={setDialogContentEl}
          className="flex max-h-[min(90vh,640px)] flex-col gap-0 overflow-hidden border-border p-0 sm:max-w-lg"
        >
          <div className="shrink-0 space-y-2 border-b border-border px-6 pb-4 pt-6">
            <DialogHeader className="space-y-2 text-right">
              <DialogTitle className="font-display text-lg">ربط قالب بالموظفين</DialogTitle>
              <DialogDescription>اختر قالب الحضور وتاريخ التطبيق، ثم حدد الموظفين أو الأقسام المراد ربطهم.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              <Label>قالب الحضور</Label>
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
              <Label htmlFor="assignment-effective-from">تاريخ التطبيق</Label>
              <Input
                id="assignment-effective-from"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>تطبيق على</Label>
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
                  <SelectItem value="employee">موظفين</SelectItem>
                  <SelectItem value="department">أقسام</SelectItem>
                  <SelectItem value="location">فروع</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {targetType === 'employee' ? (
              <div className="space-y-2">
                <Label>تصفية الموظفين حسب القسم</Label>
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
                  ? 'بحث بالاسم أو القسم…'
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
              تأكيد الربط
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
