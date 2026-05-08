'use client';

import * as React from 'react';
import { useAttendanceStore } from '@/lib/attendance/store';
import type { AssignmentTargetType } from '@/lib/attendance/types';
import { data } from '@/lib/data';
import type { MultiSelectOption } from '@/components/ui/multi-select';
import { ASSIGNMENTS_ALL_DEPARTMENTS } from '@/features/hr/attendance/assignment/constants/assignments-panel';

export function useAssignmentsPanelModel() {
  const assignments = useAttendanceStore((s) => s.assignments);
  const shiftTemplates = useAttendanceStore((s) => s.shiftTemplates);
  const addAssignmentBatch = useAttendanceStore((s) => s.addAssignmentBatch);
  const removeAssignmentBatch = useAttendanceStore((s) => s.removeAssignmentBatch);

  const [open, setOpen] = React.useState(false);
  const [dialogContentEl, setDialogContentEl] = React.useState<HTMLElement | null>(null);
  const [templateId, setTemplateId] = React.useState('');
  const [effectiveFrom, setEffectiveFrom] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [targetType, setTargetType] = React.useState<AssignmentTargetType>('employee');
  const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = React.useState(ASSIGNMENTS_ALL_DEPARTMENTS);
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

  const openNew = React.useCallback(() => {
    setTemplateId(activeTemplates[0]?.id ?? '');
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setTargetType('employee');
    setEmployeeDepartmentFilter(ASSIGNMENTS_ALL_DEPARTMENTS);
    setSelectedIds(new Set());
    setOpen(true);
  }, [activeTemplates]);

  const submit = React.useCallback(() => {
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
  }, [templateId, selectedIds, targetType, effectiveFrom, addAssignmentBatch]);

  const multiOptions = React.useMemo((): MultiSelectOption[] => {
    if (targetType === 'employee') {
      const emps =
        employeeDepartmentFilter === ASSIGNMENTS_ALL_DEPARTMENTS
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
      (employeeDepartmentFilter === ASSIGNMENTS_ALL_DEPARTMENTS
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

  const onTargetTypeChange = React.useCallback((v: AssignmentTargetType) => {
    setTargetType(v);
    setSelectedIds(new Set());
    if (v !== 'employee') setEmployeeDepartmentFilter(ASSIGNMENTS_ALL_DEPARTMENTS);
  }, []);

  return {
    batches,
    shiftTemplates,
    removeAssignmentBatch,
    open,
    setOpen,
    dialogContentEl,
    setDialogContentEl,
    templateId,
    setTemplateId,
    effectiveFrom,
    setEffectiveFrom,
    targetType,
    onTargetTypeChange,
    employeeDepartmentFilter,
    setEmployeeDepartmentFilter,
    selectedIds,
    setSelectedIds,
    activeTemplates,
    multiOptions,
    openNew,
    submit,
  };
}

export type AssignmentsPanelModel = ReturnType<typeof useAssignmentsPanelModel>;
