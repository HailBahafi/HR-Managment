import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type PayrollPeriodStatusDto = 'draft' | 'open' | 'locked' | 'closed' | 'cancelled';

export type PayrollPeriodResponseDto = {
  id: string;
  companyId: string;
  periodYear: number;
  periodMonth: number;
  startDate: string;
  endDate: string;
  payrollDate: string;
  status: PayrollPeriodStatusDto;
  notes: string | null;
  lockedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePayrollPeriodDto = {
  companyId: string;
  periodYear: number;
  periodMonth: number;
  startDate: string;
  endDate: string;
  payrollDate: string;
  status?: PayrollPeriodStatusDto;
  notes?: string;
};

export type UpdatePayrollPeriodDto = Partial<Omit<CreatePayrollPeriodDto, 'companyId'>>;

export const payrollPeriodsApi = {
  list: (params?: { companyId?: string; status?: string; periodYear?: number; periodMonth?: number; page?: number; limit?: number }) =>
    apiRequest<PaginatedResult<PayrollPeriodResponseDto>>('/payroll/payroll-periods', { query: params }),
  get: (id: string) =>
    apiRequest<PayrollPeriodResponseDto>(`/payroll/payroll-periods/${id}`),
  create: (body: CreatePayrollPeriodDto) =>
    apiRequest<PayrollPeriodResponseDto>('/payroll/payroll-periods', { method: 'POST', body }),
  update: (id: string, body: UpdatePayrollPeriodDto) =>
    apiRequest<PayrollPeriodResponseDto>(`/payroll/payroll-periods/${id}`, { method: 'PATCH', body }),
  delete: (id: string) =>
    apiRequest<void>(`/payroll/payroll-periods/${id}`, { method: 'DELETE' }),
};
