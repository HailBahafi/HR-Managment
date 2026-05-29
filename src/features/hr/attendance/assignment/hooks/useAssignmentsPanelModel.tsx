'use client';

import * as React from 'react';
import type { AssignmentTargetType } from '@/features/hr/attendance/lib/types';
import type { MultiSelectOption } from '@/components/ui/multi-select';
import { ASSIGNMENTS_ALL_DEPARTMENTS } from '@/features/hr/attendance/assignment/constants/assignments-panel';
import { shiftTemplatesApi, type ShiftTemplateResponseDto } from '@/features/hr/attendance/lib/api/shift-templates';
import { shiftAssignmentsApi, type ShiftAssignmentResponseDto } from '@/features/hr/attendance/lib/api/shift-assignments';
import { employeesApi, type EmployeeResponseDto } from '@/features/hr/organization/employees/lib/api/employees';
import { companiesApi } from '@/features/hr/lib/api/companies';

type LocalAssignment = {
  id: string;
  batchId?: string;
  templateId: string;
  effectiveFrom: string;
  targetType: AssignmentTargetType;
  targetId: string;
  targetLabel: string;
};

export function useAssignmentsPanelModel() {
  const [assignments, setAssignments] = React.useState<LocalAssignment[]>([]);
  const [shiftTemplates, setShiftTemplates] = React.useState<ShiftTemplateResponseDto[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeResponseDto[]>([]);
  const [companyId, setCompanyId] = React.useState('');

  const [open, setOpen] = React.useState(false);
  const [dialogContentEl, setDialogContentEl] = React.useState<HTMLElement | null>(null);
  const [templateId, setTemplateId] = React.useState('');
  const [effectiveFrom, setEffectiveFrom] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [targetType, setTargetType] = React.useState<AssignmentTargetType>('employee');
  const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = React.useState(ASSIGNMENTS_ALL_DEPARTMENTS);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Edit state
  const [editOpen, setEditOpen] = React.useState(false);
  const [editBatchId, setEditBatchId] = React.useState<string | null>(null);
  const [editEffectiveFrom, setEditEffectiveFrom] = React.useState('');
  const [editIsActive, setEditIsActive] = React.useState(true);

  const reloadAssignments = React.useCallback(async (cid: string) => {
    try {
      const res = await shiftAssignmentsApi.getAll({ limit: 500 });
      setAssignments(
        res.items.map((a: ShiftAssignmentResponseDto) => ({
          id: a.id,
          batchId: a.batchId ?? undefined,
          templateId: a.shiftTemplateId,
          effectiveFrom: a.effectiveFrom,
          targetType: 'employee' as AssignmentTargetType,
          targetId: a.employeeId,
          targetLabel: a.employeeId,
        })),
      );
    } catch { /* ignore */ }
  }, []);

  React.useEffect(() => {
    void (async () => {
      try {
        const [cRes, tmplRes, empRes] = await Promise.all([
          companiesApi.getAll({ limit: 1 }),
          shiftTemplatesApi.getAll({ limit: 200 }),
          employeesApi.getAll({ limit: 500 }),
        ]);
        const cid = cRes.items[0]?.id ?? '';
        setCompanyId(cid);
        setShiftTemplates(tmplRes.items);
        setEmployees(empRes.items);
        await reloadAssignments(cid);
      } catch { /* ignore */ }
    })();
  }, [reloadAssignments]);

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

  const submit = React.useCallback(async () => {
    if (!templateId || selectedIds.size === 0) return;
    try {
      await Promise.all(
        [...selectedIds].map((empId) =>
          shiftAssignmentsApi.create({
            companyId,
            shiftTemplateId: templateId,
            employeeId: empId,
            effectiveFrom,
            openShiftHours: null,
            isActive: true,
          }),
        ),
      );
      await reloadAssignments(companyId);
    } catch { /* ignore */ }
    setOpen(false);
  }, [templateId, selectedIds, companyId, effectiveFrom, reloadAssignments]);

  const openEdit = React.useCallback((batchId: string) => {
    const batch = batches.find((b) => b.batchId === batchId);
    if (!batch) return;
    setEditBatchId(batchId);
    setEditEffectiveFrom(batch.effectiveFrom ?? new Date().toISOString().slice(0, 10));
    setEditIsActive(true);
    setEditOpen(true);
  }, [batches]);

  const submitEdit = React.useCallback(async () => {
    if (!editBatchId) return;
    const toUpdate = assignments.filter((a) => (a.batchId ?? a.id) === editBatchId);
    try {
      await Promise.all(
        toUpdate.map((a) =>
          shiftAssignmentsApi.update(a.id, {
            effectiveFrom: editEffectiveFrom,
            isActive: editIsActive,
          }),
        ),
      );
      await reloadAssignments(companyId);
    } catch { /* ignore */ }
    setEditOpen(false);
    setEditBatchId(null);
  }, [editBatchId, editEffectiveFrom, editIsActive, assignments, companyId, reloadAssignments]);

  const removeAssignmentBatch = React.useCallback(async (batchId: string) => {
    const toRemove = assignments.filter((a) => (a.batchId ?? a.id) === batchId);
    try {
      await Promise.all(toRemove.map((a) => shiftAssignmentsApi.remove(a.id)));
      await reloadAssignments(companyId);
    } catch { /* ignore */ }
  }, [assignments, companyId, reloadAssignments]);

  const multiOptions = React.useMemo((): MultiSelectOption[] => {
    if (targetType === 'employee') {
      return employees.map((e) => ({
        value: e.id,
        label: e.nameAr,
        subtitle: e.employeeCode,
      }));
    }
    return [];
  }, [targetType, employees]);

  React.useEffect(() => {
    if (targetType !== 'employee') return;
    const allowedIds = new Set(employees.map((e) => e.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => allowedIds.has(id)));
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) return prev;
      return next;
    });
  }, [targetType, employees]);

  const onTargetTypeChange = React.useCallback((v: AssignmentTargetType) => {
    setTargetType(v);
    setSelectedIds(new Set());
    if (v !== 'employee') setEmployeeDepartmentFilter(ASSIGNMENTS_ALL_DEPARTMENTS);
  }, []);

  return {
    batches,
    shiftTemplates,
    removeAssignmentBatch,
    openEdit,
    submitEdit,
    editOpen,
    setEditOpen,
    editEffectiveFrom,
    setEditEffectiveFrom,
    editIsActive,
    setEditIsActive,
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
