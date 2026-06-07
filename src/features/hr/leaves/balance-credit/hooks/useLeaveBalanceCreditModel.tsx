'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { intervalOverlapsYmdRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import type {
  BalanceCreditEmployeeOption,
  BalanceCreditFilterOption,
  LeaveBalanceCreditRequest,
} from '@/features/hr/leaves/balance-credit/types';
import {
  approveBalanceCreditRequest,
  createBalanceCreditRequest,
  loadBalanceCreditDirectory,
  type LoadBalanceCreditParams,
  rejectBalanceCreditRequest,
} from '@/features/hr/leaves/balance-credit/services/balance-credit.service';
import type { BalanceCreditStatus } from '@/features/hr/leaves/balance-credit/lib/api/balance-credits';

export type BalanceCreditFetchParams = {
  employeeId?: string;
  status?: BalanceCreditStatus;
};

function creditRequestInDateRange(r: LeaveBalanceCreditRequest, from: string, to: string): boolean {
  const ymd = r.createdAt.slice(0, 10);
  return intervalOverlapsYmdRange(ymd, ymd, from, to);
}

export function useLeaveBalanceCreditModel() {
  const [creditRequests, setCreditRequests] = React.useState<LeaveBalanceCreditRequest[]>([]);
  const [employeeOptions, setEmployeeOptions] = React.useState<BalanceCreditEmployeeOption[]>([]);
  const [employeeById, setEmployeeById] = React.useState<Map<string, BalanceCreditEmployeeOption>>(
    () => new Map(),
  );
  const [branchInlineOptions, setBranchInlineOptions] = React.useState<BalanceCreditFilterOption[]>([
    { value: 'all', label: 'جميع الفروع' },
  ]);
  const [deptInlineOptions, setDeptInlineOptions] = React.useState<BalanceCreditFilterOption[]>([
    { value: 'all', label: 'جميع الأقسام' },
  ]);
  const [leaveTypes, setLeaveTypes] = React.useState<{ id: string; nameAr: string }[]>([]);
  const [defaultLeaveTypeId, setDefaultLeaveTypeId] = React.useState<string | null>(null);
  const [defaultLeaveTypeNameAr, setDefaultLeaveTypeNameAr] = React.useState('—');
  const [balancesByEmployeeType, setBalancesByEmployeeType] = React.useState<
    Record<string, Record<string, { used: number; total: number }>>
  >({});
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [companyId, setCompanyId] = React.useState<string | null>(null);

  const [branchId, setBranchId] = React.useState('all');
  const [departmentId, setDepartmentId] = React.useState('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [dateBounds, setDateBounds] = React.useState<{ from: string; to: string }>({ from: '', to: '' });

  const [addOpen, setAddOpen] = React.useState(false);
  const [employeeId, setEmployeeId] = React.useState('');
  const [leaveTypeId, setLeaveTypeId] = React.useState('');
  const [daysAddedRaw, setDaysAddedRaw] = React.useState('');
  const [reasonAr, setReasonAr] = React.useState('');

  const reload = React.useCallback(async (params?: LoadBalanceCreditParams) => {
    setLoading(true);
    setListError(null);
    try {
      const directory = await loadBalanceCreditDirectory(params);
      setCreditRequests(directory.creditRequests);
      setLeaveTypes(directory.leaveTypes.map((t) => ({ id: t.id, nameAr: t.nameAr })));
      setDefaultLeaveTypeId(directory.defaultLeaveTypeId);
      setDefaultLeaveTypeNameAr(directory.defaultLeaveTypeNameAr);
      setBalancesByEmployeeType(directory.balancesByEmployeeType);
      setCompanyId(directory.companyId);
      setEmployeeOptions(directory.employeeOptions);
      setEmployeeById(directory.employeeById);
      setBranchInlineOptions(directory.branchOptions);
      setDeptInlineOptions(directory.departmentOptions);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'balance-credits.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);
  // Re-fetch from backend when employee or status filter changes
  React.useEffect(() => {
    const params: LoadBalanceCreditParams = {};
    if (selectedEmpIds.size === 1) {
      params.employeeId = [...selectedEmpIds][0];
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter as BalanceCreditStatus;
    }
    void reload(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmpIds, statusFilter]);

  const empPickerList = React.useMemo(
    () => employeeOptions.map((e) => ({ id: e.id, name: e.name })),
    [employeeOptions],
  );

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  const baseFiltered = React.useMemo(() => {
    return creditRequests.filter((r) => {
      const emp = employeeById.get(r.employeeId);
      if (selectedEmpIds.size > 0 && !selectedEmpIds.has(r.employeeId)) return false;
      if (branchId !== 'all' && emp?.branchId && emp.branchId !== branchId) return false;
      if (departmentId !== 'all' && emp?.departmentId && emp.departmentId !== departmentId) return false;
      if (!creditRequestInDateRange(r, dateBounds.from, dateBounds.to)) return false;
      return true;
    });
  }, [creditRequests, selectedEmpIds, branchId, departmentId, dateBounds.from, dateBounds.to, employeeById]);

  const statusCounts = React.useMemo(
    () => ({
      all: baseFiltered.length,
      pending: baseFiltered.filter((r) => r.status === 'pending').length,
      approved: baseFiltered.filter((r) => r.status === 'approved').length,
      rejected: baseFiltered.filter((r) => r.status === 'rejected').length,
    }),
    [baseFiltered],
  );

  // Status filter is handled by backend; local list is already filtered
  const filtered = baseFiltered;

  const sortedRequests = React.useMemo(
    () => [...filtered].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [filtered],
  );

  const resetAddForm = React.useCallback(() => {
    setEmployeeId('');
    setLeaveTypeId(defaultLeaveTypeId ?? '');
    setDaysAddedRaw('');
    setReasonAr('');
  }, [defaultLeaveTypeId]);

  const openAddForEmployee = React.useCallback((id: string) => {
    setEmployeeId(id);
    setLeaveTypeId(defaultLeaveTypeId ?? '');
    setDaysAddedRaw('');
    setReasonAr('');
    setAddOpen(true);
  }, [defaultLeaveTypeId]);

  const handleDialogSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!employeeId) {
        toast.error('اختر الموظف.');
        return;
      }
      if (!companyId || !leaveTypeId) {
        toast.error('تعذر تحديد الشركة أو نوع الإجازة.');
        return;
      }
      const days = Number.parseInt(daysAddedRaw.trim(), 10);
      if (!Number.isFinite(days) || days < 1) {
        toast.error('عدد الأيام يجب أن يكون 1 على الأقل.');
        return;
      }
      try {
        await createBalanceCreditRequest({
          companyId,
          employeeId,
          leaveTypeId,
          daysAdded: days,
          reasonAr: reasonAr.trim() || null,
          status: 'pending',
        });
        toast.success('تم تسجيل الطلب — في الانتظار للموافقة.');
        resetAddForm();
        setAddOpen(false);
        await reload();
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'balance-credits.create');
        toast.error(displayMessage);
      }
    },
    [companyId, daysAddedRaw, employeeId, leaveTypeId, reasonAr, reload, resetAddForm],
  );

  const approveCreditRequest = React.useCallback(
    async (id: string) => {
      try {
        await approveBalanceCreditRequest(id);
        toast.success('تمت الموافقة على الطلب وتحديث الرصيد.');
        await reload();
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'balance-credits.approve');
        toast.error(displayMessage);
      }
    },
    [reload],
  );

  const rejectCreditRequest = React.useCallback(
    async (id: string) => {
      try {
        await rejectBalanceCreditRequest(id);
        toast.message('تم رفض الطلب.');
        await reload();
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'balance-credits.reject');
        toast.error(displayMessage);
      }
    },
    [reload],
  );

  const selectedBalance = employeeId && leaveTypeId
    ? balancesByEmployeeType[employeeId]?.[leaveTypeId] ?? null
    : null;

  const selectedLeaveTypeNameAr = React.useMemo(
    () => leaveTypes.find((t) => t.id === leaveTypeId)?.nameAr ?? defaultLeaveTypeNameAr,
    [leaveTypes, leaveTypeId, defaultLeaveTypeNameAr],
  );

  return {
    loading,
    listError,
    creditRequests,
    sortedRequests,
    leaveTypes,
    defaultLeaveTypeNameAr,
    selectedBalance,
    selectedLeaveTypeNameAr,
    branchId,
    setBranchId,
    departmentId,
    setDepartmentId,
    selectedEmpIds,
    setSelectedEmpIds,
    statusFilter,
    setStatusFilter,
    dateBounds,
    setDateBounds,
    branchInlineOptions,
    deptInlineOptions,
    empPickerList,
    selectedEmpKey,
    statusCounts,
    addOpen,
    setAddOpen,
    employeeId,
    setEmployeeId,
    leaveTypeId,
    setLeaveTypeId,
    daysAddedRaw,
    setDaysAddedRaw,
    reasonAr,
    setReasonAr,
    resetAddForm,
    openAddForEmployee,
    handleDialogSubmit,
    approveCreditRequest,
    rejectCreditRequest,
  };
}

