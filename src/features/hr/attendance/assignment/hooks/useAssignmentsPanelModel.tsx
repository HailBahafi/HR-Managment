'use client';

import * as React from 'react';
import type { AssignmentTargetType } from '@/features/hr/attendance/lib/types';
import type { MultiSelectOption } from '@/components/ui/multi-select';
import { ASSIGNMENTS_ALL_DEPARTMENTS } from '@/features/hr/attendance/assignment/constants/assignments-panel';
import { shiftTemplatesApi, type ShiftTemplateResponseDto } from '@/features/hr/attendance/lib/api/shift-templates';
import { shiftAssignmentsApi, type GroupedByTemplateItem } from '@/features/hr/attendance/lib/api/shift-assignments';
import { employeesApi, type EmployeeResponseDto } from '@/features/hr/organization/employees/lib/api/employees';
import { useAuthStore } from '@/features/auth/lib/auth-store';

// Shape consumed by AssignmentsBatchCard
type BatchRow = {
  id: string;          // assignmentId
  batchId?: string;
  templateId: string;
  effectiveFrom: string;
  targetType: AssignmentTargetType;
  targetId: string;
  targetLabel: string; // employee name
  employeeCode: string;
  isActive: boolean;
};

type Batch = {
  batchId: string;       // shiftTemplate.id used as stable group key
  rows: BatchRow[];
  templateId: string | undefined;
  templateName: string;
  colorHex: string;
  effectiveFrom: string | undefined;
  totalAssignments: number;
  activeAssignments: number;
};

export function useAssignmentsPanelModel() {
  const companyId = useAuthStore((s) => s.activeCompanyId) ?? '';

  const [grouped, setGrouped] = React.useState<GroupedByTemplateItem[]>([]);
  const [shiftTemplates, setShiftTemplates] = React.useState<ShiftTemplateResponseDto[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeResponseDto[]>([]);

  const [open, setOpen] = React.useState(false);
  const [dialogContentEl, setDialogContentEl] = React.useState<HTMLElement | null>(null);
  const [templateId, setTemplateId] = React.useState('');
  const [effectiveFrom, setEffectiveFrom] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [targetType, setTargetType] = React.useState<AssignmentTargetType>('employee');
  const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = React.useState(ASSIGNMENTS_ALL_DEPARTMENTS);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const [editOpen, setEditOpen] = React.useState(false);
  const [editBatchId, setEditBatchId] = React.useState<string | null>(null);
  const [editEffectiveFrom, setEditEffectiveFrom] = React.useState('');
  const [editIsActive, setEditIsActive] = React.useState(true);

  const reloadAssignments = React.useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await shiftAssignmentsApi.getGroupedByTemplate({ companyId, limit: 200 });
      setGrouped(res.items);
    } catch { /* ignore */ }
  }, [companyId]);

  React.useEffect(() => {
    if (!companyId) return;
    void Promise.allSettled([
      shiftTemplatesApi.getAll({ limit: 200, companyId }),
      employeesApi.getAll({ limit: 500, companyId }),
    ]).then(([tmplRes, empRes]) => {
      if (tmplRes.status === 'fulfilled') setShiftTemplates(tmplRes.value.items);
      if (empRes.status === 'fulfilled') setEmployees(empRes.value.items);
    });
    void reloadAssignments();
  }, [companyId, reloadAssignments]);

  // Map grouped API response → Batch[] for the card grid
  const batches = React.useMemo<Batch[]>(() =>
    grouped.map((group) => ({
      batchId: group.shiftTemplate.id,
      templateId: group.shiftTemplate.id,
      templateName: group.shiftTemplate.nameAr,
      colorHex: group.shiftTemplate.colorHex,
      effectiveFrom: group.employees[0]?.effectiveFrom,
      totalAssignments: group.totalAssignments,
      activeAssignments: group.activeAssignments,
      rows: group.employees.map((emp) => ({
        id: emp.assignmentId,
        batchId: emp.batchId ?? undefined,
        templateId: group.shiftTemplate.id,
        effectiveFrom: emp.effectiveFrom,
        targetType: 'employee' as AssignmentTargetType,
        targetId: emp.employeeId,
        targetLabel: emp.employeeNameAr,
        employeeCode: emp.employeeCode,
        isActive: emp.isActive,
      })),
    })),
  [grouped]);

  const activeTemplates = React.useMemo(() => shiftTemplates.filter((t) => t.isActive), [shiftTemplates]);

  const openNew = React.useCallback(() => {
    setTemplateId(activeTemplates[0]?.id ?? '');
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setTargetType('employee');
    setEmployeeDepartmentFilter(ASSIGNMENTS_ALL_DEPARTMENTS);
    setSelectedIds(new Set());
    setOpen(true);
  }, [activeTemplates]);

  const submit = React.useCallback(async () => {
    if (!templateId || selectedIds.size === 0 || !companyId) return;
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
      await reloadAssignments();
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
    const batch = batches.find((b) => b.batchId === editBatchId);
    if (!batch) return;
    try {
      await Promise.all(
        batch.rows.map((row) =>
          shiftAssignmentsApi.update(row.id, {
            effectiveFrom: editEffectiveFrom,
            isActive: editIsActive,
          }),
        ),
      );
      await reloadAssignments();
    } catch { /* ignore */ }
    setEditOpen(false);
    setEditBatchId(null);
  }, [editBatchId, editEffectiveFrom, editIsActive, batches, reloadAssignments]);

  const removeAssignmentBatch = React.useCallback(async (batchId: string) => {
    const batch = batches.find((b) => b.batchId === batchId);
    if (!batch) return;
    try {
      await Promise.all(batch.rows.map((row) => shiftAssignmentsApi.remove(row.id)));
      await reloadAssignments();
    } catch { /* ignore */ }
  }, [batches, reloadAssignments]);

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
