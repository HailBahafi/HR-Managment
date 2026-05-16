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

export type EmployeeLeaveBalanceListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  leaveTypeId?: string;
};

export const employeeLeaveBalancesApi = {
  getAll(query?: EmployeeLeaveBalanceListQuery) {
    return apiRequest<PaginatedResult<EmployeeLeaveBalanceResponseDto>>('/leaves/balances', { query });
  },
};
