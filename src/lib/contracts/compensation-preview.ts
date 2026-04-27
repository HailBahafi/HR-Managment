import type { HRPayrollPeriodRecord, HRPayrollMonthlyInput } from './payroll-periods-store';
import type { HRContractRecord } from './contracts-store';
import type { HRAllowanceTypeRecord } from './allowance-types-store';

export function formatLatinNumber(n: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

function round2(n: number) { return Math.round(n * 100) / 100; }

export type PayrollLineCompensationPreview = {
  lineId: string;
  employeeId: string;
  namePrimary: string;
  baseSalary: number;
  allowancesMonthlyTotal: number;
  allowanceLines: { labelAr: string; amount: number }[];
  entitlementOvertimeSar: number;
  entitlementOvertimeHours: number;
  entitlementBonusSar: number;
  dedAbsenceDays: number;
  dedAbsenceSar: number;
  dedLateSar: number;
  dedLateMinutes: number;
  dedPenaltiesSar: number;
  dedAdminSar: number;
  lineNetSar: number;
};

export type CompensationColumnVisibility = {
  colOvertime: boolean;
  colBonus: boolean;
  colDedAbsence: boolean;
  colDedLate: boolean;
  colDedPenalties: boolean;
  colDedAdmin: boolean;
};

export function lineNetFromVisibleColumns(
  row: PayrollLineCompensationPreview,
  v: CompensationColumnVisibility,
): number {
  let t = row.baseSalary + row.allowancesMonthlyTotal;
  if (v.colOvertime) t += row.entitlementOvertimeSar;
  if (v.colBonus) t += row.entitlementBonusSar;
  if (v.colDedAbsence) t -= row.dedAbsenceSar;
  if (v.colDedLate) t -= row.dedLateSar;
  if (v.colDedPenalties) t -= row.dedPenaltiesSar;
  if (v.colDedAdmin) t -= row.dedAdminSar;
  return round2(t);
}

export function buildCompensationPreviews(
  period: HRPayrollPeriodRecord,
  getContract: (id: string) => HRContractRecord | undefined,
  getAlloType: (id: string) => HRAllowanceTypeRecord | undefined,
): PayrollLineCompensationPreview[] {
  const lines = [...(period.employmentLines ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const monthlyInputs = period.employmentLineMonthlyInputs ?? {};

  const rows: PayrollLineCompensationPreview[] = lines.map(line => {
    const contract = getContract(line.contractId);
    const allowanceLines = (contract?.allowanceLines ?? []).map(al => {
      const at = getAlloType(al.allowanceTypeId);
      return { labelAr: at?.nameAr ?? al.allowanceTypeId, amount: al.amount };
    });
    const allowancesMonthlyTotal = round2(allowanceLines.reduce((s, a) => s + a.amount, 0));

    const lineInputs: HRPayrollMonthlyInput[] = monthlyInputs[line.id] ?? [];
    const sum = (kind: HRPayrollMonthlyInput['kind']) =>
      lineInputs.filter(x => x.kind === kind).reduce((s, x) => s + x.value, 0);

    const entitlementOvertimeSar = round2(sum('overtime_hours'));
    const entitlementBonusSar = round2(sum('allowance_amount'));
    const dedAbsenceDays = round2(sum('absence_days'));
    const dedAbsenceSar = round2(sum('absence_days') * (line.baseSalarySnapshot / 30));
    const dedLateSar = round2(sum('late_minutes'));
    const dedLateMinutes = round2(sum('late_minutes'));
    const dedPenaltiesSar = round2(sum('deduction_amount'));
    const dedAdminSar     = round2(sum('other'));
    const lineNetSar = round2(line.baseSalarySnapshot + allowancesMonthlyTotal + entitlementOvertimeSar + entitlementBonusSar - dedAbsenceSar - dedLateSar - dedPenaltiesSar - dedAdminSar);

    return {
      lineId: line.id,
      employeeId: line.employeeId,
      namePrimary: line.employeeNameAr,
      baseSalary: line.baseSalarySnapshot,
      allowancesMonthlyTotal,
      allowanceLines,
      entitlementOvertimeSar,
      entitlementOvertimeHours: round2(sum('overtime_hours')),
      entitlementBonusSar,
      dedAbsenceDays,
      dedAbsenceSar,
      dedLateSar,
      dedLateMinutes,
      dedPenaltiesSar,
      dedAdminSar,
      lineNetSar,
    };
  });

  /* Use real monthly inputs + contract snapshots only (no PRNG overlay). */
  return rows;
}
