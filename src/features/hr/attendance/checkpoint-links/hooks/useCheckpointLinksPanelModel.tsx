'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { AttendanceCheckInPoint, AttendanceCheckInPointLink } from '@/features/hr/attendance/lib/types';
import { CP_LINKS_ALL_DEPARTMENTS } from '@/features/hr/attendance/checkpoint-links/constants/checkpoint-links-panel';
import { mapCheckInPointResponse } from '@/features/hr/attendance/checkpoints/services/check-in-points.service';
import { checkInPointsApi } from '@/features/hr/attendance/lib/api/check-in-points';
import {
  createCheckInPointLinkBatch,
  deleteCheckInPointLinkBatch,
  loadCheckInPointLinks,
} from '@/features/hr/attendance/checkpoint-links/services/check-in-point-links.service';
import { checkInPointLinksApi } from '@/features/hr/attendance/lib/api/check-in-point-links';
import { employeesApi, type EmployeeResponseDto } from '@/features/hr/organization/employees/lib/api/employees';

export function useCheckpointLinksPanelModel() {
  const [checkpointLinks, setCheckpointLinks] = React.useState<AttendanceCheckInPointLink[]>([]);
  const [checkpoints, setCheckpoints] = React.useState<AttendanceCheckInPoint[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeResponseDto[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [eff, setEff] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [empSel, setEmpSel] = React.useState<Set<string>>(new Set());
  const [cpSel, setCpSel] = React.useState<Set<string>>(new Set());
  const [eq, setEq] = React.useState('');
  const [cq, setCq] = React.useState('');
  const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = React.useState(CP_LINKS_ALL_DEPARTMENTS);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);

  // Edit state
  const [editOpen, setEditOpen] = React.useState(false);
  const [editBatchId, setEditBatchId] = React.useState<string | null>(null);
  const [editEff, setEditEff] = React.useState('');
  const [editLinkActive, setEditLinkActive] = React.useState(true);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const [linksData, pointsData, empRes] = await Promise.all([
        loadCheckInPointLinks(),
        checkInPointsApi.getAll({ limit: 200 }).then((r) => ({ items: r.items.map(mapCheckInPointResponse) })),
        employeesApi.getAll({ limit: 500 }),
      ]);
      setCheckpointLinks(linksData.items);
      setCheckpoints(pointsData.items);
      setEmployees(empRes.items);
      setCompanyId(linksData.companyId ?? null);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'check-in-point-links.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const batches = React.useMemo(() => {
    const m = new Map<string, AttendanceCheckInPointLink[]>();
    for (const l of checkpointLinks) {
      const k = l.batchId ?? l.id;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(l);
    }
    return [...m.entries()].map(([batchId, rows]) => ({
      batchId,
      rows,
      eff: rows[0]?.effectiveFrom,
    }));
  }, [checkpointLinks]);

  const toggle = React.useCallback((set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    set((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
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
    const rows = checkpointLinks.filter((l) => (l.batchId ?? l.id) === editBatchId);
    try {
      await Promise.all(
        rows.map((l) =>
          checkInPointLinksApi.update(l.id, {
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
  }, [editBatchId, editEff, editLinkActive, checkpointLinks, reload]);

  const openBatchDialog = React.useCallback(() => {
    setEff(new Date().toISOString().slice(0, 10));
    setEmpSel(new Set());
    setCpSel(new Set());
    setEq('');
    setCq('');
    setEmployeeDepartmentFilter(CP_LINKS_ALL_DEPARTMENTS);
    setOpen(true);
  }, []);

  const submit = React.useCallback(async () => {
    if (empSel.size === 0 || cpSel.size === 0) return;
    if (!companyId) {
      toast.error('تعذر تحديد الشركة');
      return;
    }
    const pairs: { employeeId: string; checkInPointId: string }[] = [];
    for (const e of empSel) {
      for (const c of cpSel) {
        pairs.push({ employeeId: e, checkInPointId: c });
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

  const removeCheckpointLinkBatch = React.useCallback(
    async (batchId: string) => {
      const rows = checkpointLinks.filter((l) => (l.batchId ?? l.id) === batchId);
      if (rows.length === 0) return;
      try {
        await deleteCheckInPointLinkBatch(rows);
        toast.success('تم حذف الدفعة');
        setDeleteTarget(null);
        await reload();
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'check-in-point-links.delete');
        toast.error(displayMessage);
      }
    },
    [checkpointLinks, reload],
  );

  const employeesFiltered = React.useMemo(() => {
    const base = employees;
    const q = eq.trim().toLowerCase();
    if (!q) return base;
    return base.filter((e) =>
      [e.nameAr, e.employeeCode, e.email, e.phone, e.position]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
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
    return checkpoints.filter((c) => {
      const blob = [c.nameAr, String(c.latitude), String(c.longitude)].join(' ').toLowerCase();
      return blob.includes(q);
    });
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
    employeeDepartmentFilter,
    setEmployeeDepartmentFilter,
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
