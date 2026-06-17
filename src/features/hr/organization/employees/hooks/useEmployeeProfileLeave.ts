'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  leaveRequestsNewApi,
  type ApiLeaveRequest,
  type LeaveRequestStatusNew,
} from '@/features/hr/requests/lib/api/correction-requests';
import {
  leaveBalancesApi,
  flattenLeaveBalanceGroups,
  type EmployeeLeaveBalanceResponseDto,
} from '@/features/hr/leaves/lib/api/leave-balances';
import type { LeaveTypeResponseDto } from '@/features/hr/leaves/lib/api/leave-types';
import { loadCompanyLeaveTypes } from '@/features/hr/leaves/lib/leave-types-utils';
import {
  leaveRequestTypesFromHistory,
  loadLeaveRequestTypes,
} from '@/features/hr/requests/lib/load-leave-request-types';
import type { ApiRequestType } from '@/features/hr/requests/lib/api/request-types';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

export type { ApiLeaveRequest as LeaveRequestResponseDto, EmployeeLeaveBalanceResponseDto, LeaveTypeResponseDto };

export type EmployeeLeaveBalanceCard = {
  leaveTypeId: string;
  title: string;
  code: string;
  year: number;
  entitled: number;
  used: number;
  available: number;
  yearEnd: number;
  accent: 'success' | 'primary';
  hasBalanceRow: boolean;
};

export type EmployeeLeaveSummary = {
  totalEntitled: number;
  totalUsed: number;
  totalAvailable: number;
  pendingCount: number;
  approvedCount: number;
  requestCount: number;
};

export type LeaveTypeFilter = 'all' | string;
export type LeaveStatusFilter = 'all' | LeaveRequestStatusNew;

const ACCENT_BY_CODE: Record<string, 'success' | 'primary'> = {
  annual: 'success',
  sick: 'primary',
};

const LEAVE_STATUS_LABELS: Record<LeaveRequestStatusNew, string> = {
  pending: 'قيد الانتظار',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
  cancelled: 'ملغاة',
};

export function useEmployeeProfileLeave(employee: Employee, enabled = true) {
  const companyId = getDefaultCompanyId() ?? '';

  const [leaveRequests, setLeaveRequests] = React.useState<ApiLeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = React.useState<EmployeeLeaveBalanceResponseDto[]>([]);
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveTypeResponseDto[]>([]);
  const [leaveRequestTypes, setLeaveRequestTypes] = React.useState<ApiRequestType[]>([]);
  const [leaveRequestOpen, setLeaveRequestOpen] = React.useState(false);
  const [presetLeaveTypeId, setPresetLeaveTypeId] = React.useState<string | null>(null);
  const [leavesLoading, setLeavesLoading] = React.useState(false);
  const [leavesError, setLeavesError] = React.useState<string | null>(null);
  const [leaveTypeFilter, setLeaveTypeFilter] = React.useState<LeaveTypeFilter>('all');
  const [leaveStatusFilter, setLeaveStatusFilter] = React.useState<LeaveStatusFilter>('all');

  const reloadLeaves = React.useCallback(async () => {
    if (!employee.id || !enabled) return;
    setLeavesLoading(true);
    setLeavesError(null);
    try {
      const scopedCompanyId = companyId || undefined;
      const [reqRes, balRes, typesBundle, catalogRequestTypes] = await Promise.all([
        leaveRequestsNewApi.list({
          employeeId: employee.id,
          companyId: scopedCompanyId,
          limit: 200,
        }),
        leaveBalancesApi.getAll({
          employeeId: employee.id,
          companyId: scopedCompanyId,
          limit: 50,
        }),
        loadCompanyLeaveTypes({ companyId: scopedCompanyId, limit: 200 }),
        scopedCompanyId ? loadLeaveRequestTypes(scopedCompanyId) : Promise.resolve([] as ApiRequestType[]),
      ]);

      setLeaveRequests(reqRes.items);
      setLeaveBalances(flattenLeaveBalanceGroups(balRes.items));
      setLeaveTypes(typesBundle.items);
      setLeaveRequestTypes(
        catalogRequestTypes.length > 0
          ? catalogRequestTypes
          : leaveRequestTypesFromHistory(reqRes.items),
      );
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employee-profile.leaves');
      setLeavesError(displayMessage);
      setLeaveRequests([]);
      setLeaveBalances([]);
    } finally {
      setLeavesLoading(false);
    }
  }, [companyId, employee.id, enabled]);

  React.useEffect(() => {
    void reloadLeaves();
  }, [reloadLeaves]);

  const leaveBalanceCards = React.useMemo((): EmployeeLeaveBalanceCard[] => {
    const year = new Date().getFullYear();
    const balanceByType = new Map(leaveBalances.map((b) => [b.leaveTypeId, b]));
    const typeIds = new Set([
      ...leaveTypes.map((t) => t.id),
      ...leaveBalances.map((b) => b.leaveTypeId),
    ]);

    return [...typeIds].map((leaveTypeId) => {
      const lt = leaveTypes.find((t) => t.id === leaveTypeId);
      const bal = balanceByType.get(leaveTypeId);
      const code = lt?.code ?? '';
      return {
        leaveTypeId,
        title: lt?.nameAr ?? 'إجازة',
        code,
        year,
        entitled: bal?.totalDays ?? 0,
        used: bal?.usedDays ?? 0,
        available: bal?.remainingDays ?? 0,
        yearEnd: bal?.remainingDays ?? 0,
        accent: ACCENT_BY_CODE[code] ?? 'primary',
        hasBalanceRow: Boolean(bal),
      };
    }).sort((a, b) => a.title.localeCompare(b.title, 'ar'));
  }, [leaveBalances, leaveTypes]);

  const leaveSummary = React.useMemo((): EmployeeLeaveSummary => {
    const pendingCount = leaveRequests.filter((r) => r.status === 'pending').length;
    const approvedCount = leaveRequests.filter((r) => r.status === 'approved').length;
    return {
      totalEntitled: leaveBalanceCards.reduce((s, c) => s + c.entitled, 0),
      totalUsed: leaveBalanceCards.reduce((s, c) => s + c.used, 0),
      totalAvailable: leaveBalanceCards.reduce((s, c) => s + c.available, 0),
      pendingCount,
      approvedCount,
      requestCount: leaveRequests.length,
    };
  }, [leaveBalanceCards, leaveRequests]);

  const filteredLeaveRequests = React.useMemo(() => {
    return leaveRequests.filter((req) => {
      if (leaveTypeFilter !== 'all' && req.leaveTypeId !== leaveTypeFilter) return false;
      if (leaveStatusFilter !== 'all' && req.status !== leaveStatusFilter) return false;
      return true;
    });
  }, [leaveRequests, leaveTypeFilter, leaveStatusFilter]);

  const openLeaveRequest = React.useCallback((leaveTypeId?: string) => {
    setPresetLeaveTypeId(leaveTypeId ?? null);
    setLeaveRequestOpen(true);
  }, []);

  const leaveTypeFilterOptions = React.useMemo(
    () => [
      { value: 'all' as const, label: 'كل أنواع الإجازة' },
      ...leaveTypes.map((t) => ({ value: t.id, label: t.nameAr })),
    ],
    [leaveTypes],
  );

  const leaveStatusFilterOptions = React.useMemo(
    () => [
      { value: 'all' as const, label: 'كل الحالات' },
      ...(Object.entries(LEAVE_STATUS_LABELS) as [LeaveRequestStatusNew, string][]).map(([value, label]) => ({
        value,
        label,
      })),
    ],
    [],
  );

  return {
    companyId,
    leaveRequests,
    filteredLeaveRequests,
    leaveBalances,
    leaveTypes,
    leaveRequestTypes,
    leaveBalanceCards,
    leaveSummary,
    leaveTypeFilter,
    setLeaveTypeFilter,
    leaveStatusFilter,
    setLeaveStatusFilter,
    leaveTypeFilterOptions,
    leaveStatusFilterOptions,
    leaveStatusLabels: LEAVE_STATUS_LABELS,
    leaveRequestOpen,
    setLeaveRequestOpen,
    presetLeaveTypeId,
    openLeaveRequest,
    leavesLoading,
    leavesError,
    reloadLeaves,
  };
}
