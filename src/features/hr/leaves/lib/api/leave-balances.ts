import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type EmployeeLeaveBalanceResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  usedDays: number;
  totalDays: number;
  remainingDays: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type LeaveBalanceListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  leaveTypeId?: string;
};

export type CreateLeaveBalanceDto = {
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  usedDays: number;
  totalDays: number;
  createdBy?: string;
};

export type UpdateLeaveBalanceDto = {
  usedDays?: number;
  totalDays?: number;
  updatedBy?: string;
};

export const leaveBalancesApi = {
  getAll(query?: LeaveBalanceListQuery) {
    return apiRequest<PaginatedResult<EmployeeLeaveBalanceResponseDto>>('/leaves/balances', { query });
  },
  getById(id: string) {
    return apiRequest<EmployeeLeaveBalanceResponseDto>(`/leaves/balances/${id}`);
  },
  create(payload: CreateLeaveBalanceDto) {
    return apiRequest<EmployeeLeaveBalanceResponseDto>('/leaves/balances', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateLeaveBalanceDto) {
    return apiRequest<EmployeeLeaveBalanceResponseDto>(`/leaves/balances/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/leaves/balances/${id}`, { method: 'DELETE' });
  },
};
