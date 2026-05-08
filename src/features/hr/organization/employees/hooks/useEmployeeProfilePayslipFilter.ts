'use client';

import * as React from 'react';
import { PAYSLIP_MONTHS_AR, PAYSLIP_YEAR_OPTIONS } from '@/lib/payroll/employee-payslip-series';
import type { Payslip } from '@/types';

export function useEmployeeProfilePayslipFilter(employeePayslipSeries: Payslip[]) {
  const payslipDistinctYears = React.useMemo(
    () => new Set(employeePayslipSeries.map((p) => p.year)).size,
    [employeePayslipSeries],
  );

  const payslipPeriodOptions = React.useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: 'all', label: 'كل الكشوف' }];
    const yearsDesc = [...PAYSLIP_YEAR_OPTIONS].sort((a, b) => b - a);
    for (const y of yearsDesc) {
      opts.push({ value: `year:${y}`, label: `سنة ${y} — كل الأشهر` });
      for (let i = 11; i >= 0; i--) {
        const monthAr = PAYSLIP_MONTHS_AR[i];
        opts.push({
          value: `${y}-${String(i + 1).padStart(2, '0')}`,
          label: `${monthAr} ${y}`,
        });
      }
    }
    return opts;
  }, []);

  const [payslipPeriod, setPayslipPeriod] = React.useState<string>('all');

  const payslipsFiltered = React.useMemo(() => {
    if (payslipPeriod === 'all') return employeePayslipSeries;
    if (payslipPeriod.startsWith('year:')) {
      const y = parseInt(payslipPeriod.slice(5), 10);
      if (!Number.isFinite(y)) return employeePayslipSeries;
      return employeePayslipSeries.filter((p) => p.year === y);
    }
    const parts = payslipPeriod.split('-');
    const y = parseInt(parts[0] ?? '', 10);
    const m = parseInt(parts[1] ?? '', 10);
    if (!Number.isFinite(y) || !Number.isFinite(m)) return employeePayslipSeries;
    return employeePayslipSeries.filter((p) => {
      if (p.year !== y) return false;
      const idx = PAYSLIP_MONTHS_AR.indexOf(p.month as (typeof PAYSLIP_MONTHS_AR)[number]);
      return idx >= 0 && idx + 1 === m;
    });
  }, [employeePayslipSeries, payslipPeriod]);

  return {
    payslipDistinctYears,
    payslipPeriodOptions,
    payslipPeriod,
    setPayslipPeriod,
    payslipsFiltered,
  };
}
