'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import { leaveRequestsApi, type LeaveRequestResponseDto } from '@/features/hr/leaves/lib/api/leave-requests';
import { leaveBalancesApi, type EmployeeLeaveBalanceResponseDto } from '@/features/hr/leaves/lib/api/leave-balances';
import { leaveTypesApi, type LeaveTypeResponseDto } from '@/features/hr/leaves/lib/api/leave-types';

export type { LeaveRequestResponseDto, EmployeeLeaveBalanceResponseDto, LeaveTypeResponseDto };

export type EmployeeLeaveBalanceCard = {
  leaveTypeId: string;
  title: string;
  year: number;
  entitled: number;
  used: number;
  available: number;
  yearEnd: number;
  accent: 'success' | 'primary';
};

const ACCENT_BY_CODE: Record<string, 'success' | 'primary'> = {
  annual: 'success',
  sick: 'primary',
};

export function useEmployeeProfileLeave(employee: Employee) {
  const [leaveRequests, setLeaveRequests] = React.useState<LeaveRequestResponseDto[]>([]);
  const [leaveBalances, setLeaveBalances] = React.useState<EmployeeLeaveBalanceResponseDto[]>([]);
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveTypeResponseDto[]>([]);
  const [leaveRequestOpen, setLeaveRequestOpen] = React.useState(false);

  React.useEffect(() => {
    if (!employee.id) return;
    void (async () => {
      try {
        const [reqRes, balRes] = await Promise.all([
          leaveRequestsApi.getAll({ employeeId: employee.id, limit: 100 }),
          leaveBalancesApi.getAll({ employeeId: employee.id, limit: 50 }),
        ]);
        setLeaveRequests(reqRes.items);
        setLeaveBalances(balRes.items);

        const typeIds = [...new Set([
          ...balRes.items.map((b) => b.leaveTypeId),
          ...reqRes.items.map((r) => r.leaveTypeId),
        ])];
        if (typeIds.length > 0) {
          const typesRes = await leaveTypesApi.getAll({ limit: 50 });
          setLeaveTypes(typesRes.items);
        }
      } catch {
        // silently ignore — sections show empty state
      }
    })();
  }, [employee.id]);

  const leaveBalanceCards = React.useMemo((): EmployeeLeaveBalanceCard[] => {
    const year = new Date().getFullYear();
    return leaveBalances.map((bal) => {
      const lt = leaveTypes.find((t) => t.id === bal.leaveTypeId);
      const code = lt?.code ?? '';
      return {
        leaveTypeId: bal.leaveTypeId,
        title: lt?.nameAr ?? 'إجازة',
        year,
        entitled: bal.totalDays,
        used: bal.usedDays,
        available: bal.remainingDays,
        yearEnd: bal.remainingDays,
        accent: ACCENT_BY_CODE[code] ?? 'primary',
      };
    });
  }, [leaveBalances, leaveTypes]);

  return {
    leaveRequests,
    leaveBalances,
    leaveTypes,
    leaveBalanceCards,
    leaveRequestOpen,
    setLeaveRequestOpen,
  };
}
