'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { AttendanceCheckInPoint } from '@/features/hr/attendance/lib/types';
import { mapCheckInPointResponse } from '@/features/hr/attendance/checkpoints/services/check-in-points.service';
import { checkInPointsApi } from '@/features/hr/attendance/lib/api/check-in-points';
import { createCheckInPointLinkBatch } from '@/features/hr/attendance/checkpoint-links/services/check-in-point-links.service';
import { checkInPointLinksApi, type GroupedByPointItem } from '@/features/hr/attendance/lib/api/check-in-point-links';
import { employeesApi, type EmployeeResponseDto } from '@/features/hr/organization/employees/lib/api/employees';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';

export function useCheckpointLinksPanelModel() {
  const companyId = useDefaultCompanyId() ?? '';

  const [grouped, setGrouped] = React.useState<GroupedByPointItem[]>([]);
  const [checkpoints, setCheckpoints] = React.useState<AttendanceCheckInPoint[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeResponseDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const [open, setOpen] = React.useState(false);
  const [eff, setEff] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [empSel, setEmpSel] = React.useState<Set<string>>(new Set());
  const [cpSel, setCpSel] = React.useState<Set<string>>(new Set());
  const [eq, setEq] = React.useState('');
  const [cq, setCq] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editBatchId, setEditBatchId] = React.useState<string | null>(null);
  const [editEff, setEditEff] = React.useState('');
  const [editLinkActive, setEditLinkActive] = React.useState(true);

  const reload = React.useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setListError(null);
    try {
      const [groupedRes, pointsRes, empRes] = await Promise.all([
        checkInPointLinksApi.getGroupedByPoint({ companyId, limit: 200 }),
        checkInPointsApi.getAll({ limit: 200, companyId }),
        employeesApi.getAll({ limit: 500, companyId }),
      ]);
      setGrouped(groupedRes.items);
      setCheckpoints(pointsRes.items.map(mapCheckInPointResponse));
      setEmployees(empRes.items);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'check-in-point-links.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => { void reload(); }, [reload]);

  // Map grouped response → batches consumed by the card grid
  // Each check-in point = one batch; checkInPoint.id is the stable group key
  const batches = React.useMemo(() =>
    grouped.map((group) => ({
      batchId: group.checkInPoint.id,
      checkInPointId: group.checkInPoint.id,
      checkInPointName: group.checkInPoint.nameAr,
      eff: group.employees[0]?.effectiveFrom ?? undefined,
      rows: group.employees.map((emp) => ({
        id: emp.linkId,
        batchId: emp.batchId ?? undefined,
        checkInPointId: group.checkInPoint.id,
        employeeId: emp.employeeId,
        employeeName: emp.employeeNameAr,
        employeeCode: emp.employeeCode,
        effectiveFrom: emp.effectiveFrom ?? undefined,
        linkActive: emp.linkActive,
      })),
      totalLinks: group.totalLinks,
      activeLinks: group.activeLinks,
    })),
  [grouped]);

  const toggle = React.useCallback((set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    set((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  const openEditDialog = React.useCallback((batchId: string) => {
    const batch = batches.find((b) => b.batchId === batchId);
    if (!batch) return;
    setEditBatchId(batchId);
    setEditEff(batch.eff ?? new Date().toISOString().slice(0, 10));
    setEditLinkActive(batch.rows[0]?.linkActive ?? true);
    setEditOpen(true);
  }, [batches]);

  const submitEdit = React.useCallback(async () => {
    if (!editBatchId) return;
    const batch = batches.find((b) => b.batchId === editBatchId);
    if (!batch) return;
    try {
      await Promise.all(
        batch.rows.map((row) =>
          checkInPointLinksApi.update(row.id, {
            effectiveFrom: editEff || null,
            linkActive: editLinkActive,
          }),
        ),
      );
      toast.success('تم تحديث الدفعة');
      setEditOpen(false);
      setEditBatchId(null);
      await reload();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'check-in-point-links.update');
      toast.error(displayMessage);
    }
  }, [editBatchId, editEff, editLinkActive, batches, reload]);

  const openBatchDialog = React.useCallback(() => {
    setEff(new Date().toISOString().slice(0, 10));
    setEmpSel(new Set());
    setCpSel(new Set());
    setEq('');
    setCq('');
    setOpen(true);
  }, []);

  const submit = React.useCallback(async () => {
    if (empSel.size === 0 || cpSel.size === 0) return;
    if (!companyId) { toast.error('تعذر تحديد الشركة'); return; }
    const pairs: { employeeId: string; checkInPointId: string }[] = [];
    for (const empId of empSel) {
      for (const c of cpSel) {
        pairs.push({ employeeId: empId, checkInPointId: c });
      }
    }
    try {
      await createCheckInPointLinkBatch({ companyId, effectiveFrom: eff, pairs });
      toast.success('تم إنشاء دفعة الربط');
      setOpen(false);
      setEmpSel(new Set());
      setCpSel(new Set());
      await reload();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'check-in-point-links.create');
      toast.error(displayMessage);
    }
  }, [companyId, cpSel, eff, empSel, reload]);

  const removeCheckpointLinkBatch = React.useCallback(async (batchId: string) => {
    const batch = batches.find((b) => b.batchId === batchId);
    if (!batch || batch.rows.length === 0) return;
    try {
      await Promise.all(batch.rows.map((row) => checkInPointLinksApi.remove(row.id)));
      toast.success('تم حذف الدفعة');
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'check-in-point-links.delete');
      toast.error(displayMessage);
    }
  }, [batches, reload]);

  const employeesFiltered = React.useMemo(() => {
    const q = eq.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.nameAr, e.employeeCode, e.email, e.phone, e.position]
        .filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [employees, eq]);

  React.useEffect(() => {
    const allowed = new Set(employeesFiltered.map((e) => e.id));
    setEmpSel((prev) => {
      const next = new Set([...prev].filter((id) => allowed.has(id)));
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) return prev;
      return next;
    });
  }, [employeesFiltered]);

  const cps = React.useMemo(() => {
    const q = cq.trim().toLowerCase();
    if (!q) return checkpoints;
    return checkpoints.filter((c) =>
      [c.nameAr, String(c.latitude), String(c.longitude)].join(' ').toLowerCase().includes(q),
    );
  }, [checkpoints, cq]);

  return {
    batches,
    checkpoints,
    employees,
    loading,
    listError,
    removeCheckpointLinkBatch,
    openEditDialog,
    submitEdit,
    editOpen,
    setEditOpen,
    editEff,
    setEditEff,
    editLinkActive,
    setEditLinkActive,
    open,
    setOpen,
    eff,
    setEff,
    empSel,
    setEmpSel,
    cpSel,
    setCpSel,
    eq,
    setEq,
    cq,
    setCq,
    employeesFiltered,
    cps,
    toggle,
    openBatchDialog,
    submit,
    deleteTarget,
    setDeleteTarget,
  };
}

export type CheckpointLinksPanelModel = ReturnType<typeof useCheckpointLinksPanelModel>;
