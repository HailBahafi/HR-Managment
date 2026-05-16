import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type EmployeeResponseDto = {
  id: string;
  employeeCode: string;
  nameAr: string;
  nameEn: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  managerId: string | null;
  contractType: string | null;
  contractStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
};

export const employeesApi = {
  getAll(query?: EmployeeListQuery) {
    return apiRequest<PaginatedResult<EmployeeResponseDto>>('/hr/employees', { query });
  },
  getById(id: string) {
    return apiRequest<EmployeeResponseDto>(`/hr/employees/${id}`);
  },
};
