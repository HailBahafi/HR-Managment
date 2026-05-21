'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import { leaveRequestsApi, type LeaveRequestResponseDto } from '@/features/hr/leaves/lib/api/leave-requests';
import { leaveBalancesApi, type EmployeeLeaveBalanceResponseDto } from '@/features/hr/leaves/lib/api/leave-balances';
import { leaveTypesApi, type LeaveTypeResponseDto } from '@/features/hr/leaves/lib/api/leave-types';

export type { LeaveRequestResponseDto, EmployeeLeaveBalanceResponseDto, LeaveTypeResponseDto };

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

  const leaveBalanceDisplay = React.useMemo(() => {
    const year = new Date().getFullYear();
    const annual = leaveTypes.find((t) => t.code === 'annual' || t.nameAr.includes('سنوية'));
    const sick = leaveTypes.find((t) => t.code === 'sick' || t.nameAr.includes('مرضية'));

    const annualBal = annual ? leaveBalances.find((b) => b.leaveTypeId === annual.id) : null;
    const sickBal = sick ? leaveBalances.find((b) => b.leaveTypeId === sick.id) : null;

    const entitled = annual?.maxDaysPerRequest ?? annualBal?.totalDays ?? 21;
    const annualUsed = annualBal?.usedDays ?? 0;
    const sickUsed = sickBal?.usedDays ?? 0;
    const sickTotal = sickBal?.totalDays ?? 21;

    return {
      year,
      entitled,
      annual: {
        used: annualUsed,
        available: annualBal?.remainingDays ?? Math.max(0, entitled - annualUsed),
        yearEnd: annualBal?.remainingDays ?? Math.max(0, entitled - annualUsed),
      },
      sick: {
        used: sickUsed,
        available: sickBal?.remainingDays ?? Math.max(0, sickTotal - sickUsed),
        yearEnd: sickBal?.remainingDays ?? Math.max(0, sickTotal - sickUsed),
      },
    };
  }, [leaveBalances, leaveTypes]);

  return {
    leaveRequests,
    leaveBalances,
    leaveTypes,
    leaveBalanceDisplay,
    leaveRequestOpen,
    setLeaveRequestOpen,
  };
}
