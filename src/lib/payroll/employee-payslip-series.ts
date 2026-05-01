import type { Employee, Payslip } from '@/types';

/** Fields required to synthesize payslip lines (matches employee JSON + `Employee`). */
export type PayslipSeriesEmployee = Pick<
  Employee,
  'id' | 'baseSalary' | 'housingAllowance' | 'transportAllowance' | 'otherAllowances' | 'gosi'
>;

/** Arabic Gregorian month names (calendar order). */
export const PAYSLIP_MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
] as const;

const START_YEAR = 2020;
const END_YEAR = 2026;

function mix(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function intFromSeed(seed: number, min: number, max: number): number {
  return min + Math.floor(mix(seed) * (max - min + 1));
}

/** Build monthly payslips from 2020-01 through 2026-12; JSON rows override matching month/year. */
export function buildEmployeePayslipSeries(
  employee: PayslipSeriesEmployee,
  overrides: readonly Payslip[],
): Payslip[] {
  const baseRef = Math.max(employee.baseSalary || 0, 1);
  const gosiRatio = employee.gosi / baseRef;
  const overrideMap = new Map<string, Payslip>();
  for (const p of overrides) {
    if (p.employeeId !== employee.id) continue;
    overrideMap.set(`${p.year}|${p.month}`, p);
  }

  const out: Payslip[] = [];

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const yearEscalation = 1 + (year - START_YEAR) * 0.022;
    for (let monthIndex = 1; monthIndex <= 12; monthIndex++) {
      const monthAr = PAYSLIP_MONTHS_AR[monthIndex - 1];
      const key = `${year}|${monthAr}`;
      const existing = overrideMap.get(key);
      if (existing) {
        out.push({ ...existing });
        continue;
      }

      const seed = (year * 31 + monthIndex * 17 + employee.id.charCodeAt(1) * 13 + employee.id.charCodeAt(0) * 7) | 0;
      const workingDays = intFromSeed(seed + 1, 20, 23);
      const absentDays = mix(seed + 2) > 0.92 ? 1 : mix(seed + 3) > 0.97 ? 2 : 0;
      const lateDays = intFromSeed(seed + 4, 0, mix(seed + 5) > 0.85 ? 4 : 2);
      const presentDays = Math.max(0, workingDays - absentDays);
      const overtime = intFromSeed(seed + 6, 0, mix(seed + 7) > 0.7 ? 1200 : 400);

      const baseSalary = Math.round(employee.baseSalary * yearEscalation * (1 + (mix(seed + 8) - 0.5) * 0.04));
      const housing = Math.round(employee.housingAllowance * yearEscalation);
      const transport = Math.round(employee.transportAllowance * yearEscalation);
      const otherAllowances = Math.round(employee.otherAllowances * yearEscalation);
      const gosi = Math.round(baseSalary * gosiRatio);

      const absenceDeduction = absentDays > 0 ? Math.round((baseSalary / workingDays) * absentDays * 1.1) : 0;
      const latenessDeduction = lateDays > 0 ? Math.round(lateDays * (35 + intFromSeed(seed + 9, 0, 40))) : 0;
      const loanDeduction = mix(seed + 10) > 0.88 ? intFromSeed(seed + 11, 500, 2200) : 0;
      const otherDeductions = mix(seed + 12) > 0.94 ? intFromSeed(seed + 13, 100, 450) : 0;

      const gross = baseSalary + housing + transport + otherAllowances + overtime;
      const net = gross - gosi - absenceDeduction - latenessDeduction - loanDeduction - otherDeductions;

      out.push({
        id: `ps-gen-${employee.id}-${year}-${String(monthIndex).padStart(2, '0')}`,
        employeeId: employee.id,
        month: monthAr,
        year,
        baseSalary,
        housing,
        transport,
        otherAllowances,
        overtime,
        gosi,
        absenceDeduction,
        latenessDeduction,
        loanDeduction,
        otherDeductions,
        gross,
        net: Math.max(0, net),
        workingDays,
        presentDays,
        absentDays,
        lateDays,
      });
    }
  }

  const monthOrder = (m: string) => {
    const i = PAYSLIP_MONTHS_AR.indexOf(m as (typeof PAYSLIP_MONTHS_AR)[number]);
    return i >= 0 ? i : 0;
  };
  out.sort((a, b) => b.year - a.year || monthOrder(b.month) - monthOrder(a.month));
  return out;
}

export const PAYSLIP_YEAR_OPTIONS = Array.from(
  { length: END_YEAR - START_YEAR + 1 },
  (_, i) => START_YEAR + i,
);
