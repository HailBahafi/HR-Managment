export const HR_CONTRACTS_BASE = '/hr/contracts' as const;

export function hrContractsSectionHref(segment: string): string {
  return `${HR_CONTRACTS_BASE}/${segment}`;
}

export function hrContractsPeriodCompensationHref(periodId: string): string {
  return `${HR_CONTRACTS_BASE}/period/${encodeURIComponent(periodId)}/compensation`;
}

export const hrContractsRoutes = {
  root: HR_CONTRACTS_BASE,
  employment: hrContractsSectionHref('employment'),
  articles: hrContractsSectionHref('articles'),
  employeeAdvances: hrContractsSectionHref('employee-advances'),
  payrollPeriods: hrContractsSectionHref('payroll-periods'),
  monthlyInputs: hrContractsSectionHref('monthly-inputs'),
  payrollSalaryApprovals: hrContractsSectionHref('payroll-salary-approvals'),
  reports: hrContractsSectionHref('reports'),
  allowanceTypes: hrContractsSectionHref('allowance-types'),
  contractTemplates: hrContractsSectionHref('contract-templates'),
} as const;

export function hrContractsPayrollSalaryApprovalsQueryHref(periodId: string): string {
  return `${hrContractsRoutes.payrollSalaryApprovals}?period=${encodeURIComponent(periodId)}`;
}
