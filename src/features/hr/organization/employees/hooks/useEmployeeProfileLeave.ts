'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';

const LEAVE_YEARLY_ENTITLEMENT = 21;

export function useEmployeeProfileLeave(employee: Employee) {
  const leaveBalanceDisplay = React.useMemo(() => {
    const year = new Date().getFullYear();
    const entitled = LEAVE_YEARLY_ENTITLEMENT;
    const isE1 = employee.id === 'e1';
    const annualUsed = isE1 ? 13 : 1;
    const sickUsed = isE1 ? 5 : 0;
    const annualAvail = Math.max(0, entitled - annualUsed);
    const sickAvail = Math.max(0, entitled - sickUsed);
    return {
      year,
      entitled,
      annual: { used: annualUsed, available: annualAvail, yearEnd: annualAvail },
      sick: { used: sickUsed, available: sickAvail, yearEnd: sickAvail },
    };
  }, [employee.id]);

  const [leaveRequestOpen, setLeaveRequestOpen] = React.useState(false);

  return { leaveBalanceDisplay, leaveRequestOpen, setLeaveRequestOpen };
}
