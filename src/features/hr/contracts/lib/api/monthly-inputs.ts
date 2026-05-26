import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type MonthlyInputKindDto =
  | 'bonus'
  | 'overtime'
  | 'allowance_extra'
  | 'absence_deduction'
  | 'lateness_deduction'
  | 'unpaid_leave_deduction'
  | 'discipline_deduction'
  | 'advance_installment'
  | 'loan_installment'
  | 'gosi_adjustment'
  | 'other_addition'
  | 'other_deduction';

export type MonthlyInputDirectionDto = 'addition' | 'deduction';

export type MonthlyInputResponseDto = {
  id: string;
  companyId: string;
  payrollPeriodId: string;
  periodYear: number;
  periodMonth: number;
  employeeId: string;
  employeeNameAr: string;
  inputKind: MonthlyInputKindDto;
  direction: MonthlyInputDirectionDto;
  amount: number;
  currency: string;
  note: string | null;
  sourceKind: string | null;
  sourceTable: string | null;
  sourceId: string | null;
  affectsSalary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateMonthlyInputDto = {
  companyId: string;
  payrollPeriodId: string;
  employeeId: string;
  inputKind: MonthlyInputKindDto;
  direction: MonthlyInputDirectionDto;
  amount: number;
  currency?: string;
  note?: string;
  sourceKind?: string;
  sourceTable?: string;
  sourceId?: string;
  affectsSalary?: boolean;
};

export type UpdateMonthlyInputDto = Partial<
  Omit<CreateMonthlyInputDto, 'companyId' | 'payrollPeriodId' | 'employeeId'>
>;

export const monthlyInputsApi = {
  list: (params?: {
    companyId?: string;
    payrollPeriodId?: string;
    employeeId?: string;
    sourceTable?: string;
    sourceId?: string;
    page?: number;
    limit?: number;
  }) =>
    apiRequest<PaginatedResult<MonthlyInputResponseDto>>('/payroll/monthly-inputs', {
      query: params,
    }),
  get: (id: string) =>
    apiRequest<MonthlyInputResponseDto>(`/payroll/monthly-inputs/${id}`),
  create: (body: CreateMonthlyInputDto) =>
    apiRequest<MonthlyInputResponseDto>('/payroll/monthly-inputs', { method: 'POST', body }),
  update: (id: string, body: UpdateMonthlyInputDto) =>
    apiRequest<MonthlyInputResponseDto>(`/payroll/monthly-inputs/${id}`, {
      method: 'PATCH',
      body,
    }),
  delete: (id: string) =>
    apiRequest<void>(`/payroll/monthly-inputs/${id}`, { method: 'DELETE' }),
};
