'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { data } from '@/features/hr/lib/data';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { AttendanceCheckInPoint, AttendanceCheckInPointLink } from '@/features/hr/attendance/lib/types';
import { CP_LINKS_ALL_DEPARTMENTS } from '@/features/hr/attendance/checkpoint-links/constants/checkpoint-links-panel';
import { employeeSearchHaystack } from '@/features/hr/attendance/checkpoint-links/utils/employee-search-haystack';
import { loadCheckInPoints } from '@/features/hr/attendance/checkpoints/services/check-in-points.service';
import {
  createCheckInPointLinkBatch,
  deleteCheckInPointLinkBatch,
  loadCheckInPointLinks,
} from '@/features/hr/attendance/checkpoint-links/services/check-in-point-links.service';

export function useCheckpointLinksPanelModel() {
  const [checkpointLinks, setCheckpointLinks] = React.useState<AttendanceCheckInPointLink[]>([]);
  const [checkpoints, setCheckpoints] = React.useState<AttendanceCheckInPoint[]>([]);
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

  const reload = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const [linksData, pointsData] = await Promise.all([loadCheckInPointLinks(), loadCheckInPoints()]);
      setCheckpointLinks(linksData.items);
      setCheckpoints(pointsData.items);
      setCompanyId(linksData.companyId ?? pointsData.companyId);
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
    const base =
      employeeDepartmentFilter === CP_LINKS_ALL_DEPARTMENTS
        ? data.employees
        : data.employees.filter((e) => e.departmentId === employeeDepartmentFilter);
    const q = eq.trim().toLowerCase();
    if (!q) return base;
    return base.filter((e) => employeeSearchHaystack(e).includes(q));
  }, [eq, employeeDepartmentFilter]);

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
    loading,
    listError,
    removeCheckpointLinkBatch,
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
