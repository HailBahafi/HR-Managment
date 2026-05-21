import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type ShiftAssignmentResponseDto = {
  id: string;
  companyId: string;
  shiftTemplateId: string;
  shiftTemplateNameAr: string;
  shiftTemplateColorHex: string;
  employeeId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  openShiftHours: number | null;
  batchId: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type ShiftAssignmentListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  shiftTemplateId?: string;
  isActive?: boolean;
  batchId?: string;
};

export type CreateShiftAssignmentDto = {
  companyId: string;
  shiftTemplateId: string;
  employeeId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  openShiftHours?: number | null;
  isActive?: boolean;
  notes?: string | null;
};

export type UpdateShiftAssignmentDto = Partial<Omit<CreateShiftAssignmentDto, 'companyId' | 'shiftTemplateId' | 'employeeId'>>;

export const shiftAssignmentsApi = {
  getAll(query?: ShiftAssignmentListQuery) {
    return apiRequest<PaginatedResult<ShiftAssignmentResponseDto>>('/attendance/shift-assignments', { query });
  },
  getById(id: string) {
    return apiRequest<ShiftAssignmentResponseDto>(`/attendance/shift-assignments/${id}`);
  },
  create(payload: CreateShiftAssignmentDto) {
    return apiRequest<ShiftAssignmentResponseDto>('/attendance/shift-assignments', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateShiftAssignmentDto) {
    return apiRequest<ShiftAssignmentResponseDto>(`/attendance/shift-assignments/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/attendance/shift-assignments/${id}`, { method: 'DELETE' });
  },
};
