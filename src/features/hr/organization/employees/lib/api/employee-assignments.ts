import { apiRequest } from '@/features/hr/lib/api/client';

export type EmployeeAssignmentStatusDto = 'active' | 'suspended' | 'ended';

export type EmployeeAssignmentResponseDto = {
  id: string;
  employeeId: string;
  companyId: string;
  branchId: string;
  departmentId: string | null;
  jobTitleId: string | null;
  isPrimary: boolean;
  status: EmployeeAssignmentStatusDto;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateEmployeeAssignmentDto = {
  companyId: string;
  branchId: string;
  departmentId?: string | null;
  jobTitleId?: string | null;
  isPrimary?: boolean;
  status?: EmployeeAssignmentStatusDto;
  startDate?: string | null;
  endDate?: string | null;
};

export const employeeAssignmentsApi = {
  getAll(employeeId: string) {
    return apiRequest<EmployeeAssignmentResponseDto[]>(`/hr/employees/${employeeId}/assignments`);
  },
  create(employeeId: string, payload: CreateEmployeeAssignmentDto) {
    return apiRequest<EmployeeAssignmentResponseDto>(`/hr/employees/${employeeId}/assignments`, {
      method: 'POST',
      body: payload,
    });
  },
};
