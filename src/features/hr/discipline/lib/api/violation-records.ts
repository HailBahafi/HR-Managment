import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type ViolationRecordStatus = 'pending' | 'approved' | 'rejected' | 'needs_edit';

export type ViolationRecordResponseDto = {
  id: string;
  companyId: string;
  recordNumber: string;
  employeeId: string;
  violationTypeId: string;
  status: ViolationRecordStatus;
  violationDate: string;
  description: string;
  notes: string | null;
  attachmentsNote: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type UpdateViolationRecordDto = {
  violationDate?: string;
  description?: string;
  notes?: string | null;
  attachmentsNote?: string | null;
  updatedBy?: string | null;
};

export type DecideViolationRecordDto = {
  decision: 'approve' | 'reject';
  notes?: string | null;
  decidedBy?: string | null;
};

export type ViolationRecordListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  violationTypeId?: string;
  violationDateFrom?: string;
  violationDateTo?: string;
};

export type CreateViolationRecordDto = {
  companyId: string;
  employeeId: string;
  violationTypeId: string;
  violationDate: string;
  description: string;
  notes?: string | null;
  attachmentsNote?: string | null;
  createdBy?: string | null;
};

export const violationRecordsApi = {
  getAll(query?: ViolationRecordListQuery) {
    return apiRequest<PaginatedResult<ViolationRecordResponseDto>>('/discipline/violation-records', { query });
  },
  getById(id: string) {
    return apiRequest<ViolationRecordResponseDto>(`/discipline/violation-records/${id}`);
  },
  create(payload: CreateViolationRecordDto) {
    return apiRequest<ViolationRecordResponseDto>('/discipline/violation-records', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateViolationRecordDto) {
    return apiRequest<ViolationRecordResponseDto>(`/discipline/violation-records/${id}`, { method: 'PATCH', body: payload });
  },
  decide(id: string, payload: DecideViolationRecordDto) {
    return apiRequest<ViolationRecordResponseDto>(`/discipline/violation-records/${id}/decision`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/discipline/violation-records/${id}`, { method: 'DELETE' });
  },
};
