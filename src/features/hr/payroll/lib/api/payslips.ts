import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type PayslipResponseDto = {
  id: string;
  companyId: string;
  payrollPeriodId: string;
  periodYear: number | null;
  periodMonth: number | null;
  employeeId: string;
  employeeNameAr: string;
  contractId: string | null;
  contractNumber: string | null;
  baseSalary: string;
  allowancesTotal: string;
  additionsTotal: string;
  deductionsTotal: string;
  gosi: string;
  gross: string;
  net: string;
  currency: string;
  workingDays: number | null;
  presentDays: number | null;
  absentDays: number | null;
  lateDays: number | null;
  breakdown: Record<string, unknown> | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export const payslipsApi = {
  list: (params?: {
    companyId?: string;
    payrollPeriodId?: string;
    employeeId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    apiRequest<PaginatedResult<PayslipResponseDto>>('/payroll/payslips', {
      query: params as Record<string, string | number | boolean | null | undefined>,
    }),

  get: (id: string) =>
    apiRequest<PayslipResponseDto>(`/payroll/payslips/${id}`),
};
