import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type ApprovalTemplateApprover = {
  employeeId: string;
  mandatory: boolean;
};

export type ApprovalTemplateStage = {
  id: string;
  sortOrder: number;
  mode: 'sequential' | 'parallel' | 'optional' | 'any_one';
  approvers: ApprovalTemplateApprover[];
};

export type DisciplineApprovalTemplateResponseDto = {
  id: string;
  companyId: string;
  nameAr: string;
  description: string | null;
  isActive: boolean;
  stages: ApprovalTemplateStage[];
  linkedViolationTypeIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateDisciplineApprovalTemplateDto = {
  companyId: string;
  nameAr: string;
  description?: string | null;
  isActive?: boolean;
  stages?: ApprovalTemplateStage[];
  linkedViolationTypeIds?: string[];
  createdBy?: string | null;
};

export type UpdateDisciplineApprovalTemplateDto = {
  nameAr?: string;
  description?: string | null;
  isActive?: boolean;
  stages?: ApprovalTemplateStage[];
  linkedViolationTypeIds?: string[];
  updatedBy?: string | null;
};

export type DisciplineApprovalTemplateListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  isActive?: boolean;
};

export const disciplineApprovalTemplatesApi = {
  getAll(query?: DisciplineApprovalTemplateListQuery) {
    return apiRequest<PaginatedResult<DisciplineApprovalTemplateResponseDto>>(
      '/discipline/approval-templates',
      { query },
    );
  },
  getById(id: string) {
    return apiRequest<DisciplineApprovalTemplateResponseDto>(`/discipline/approval-templates/${id}`);
  },
  create(payload: CreateDisciplineApprovalTemplateDto) {
    return apiRequest<DisciplineApprovalTemplateResponseDto>('/discipline/approval-templates', {
      method: 'POST',
      body: payload,
    });
  },
  update(id: string, payload: UpdateDisciplineApprovalTemplateDto) {
    return apiRequest<DisciplineApprovalTemplateResponseDto>(`/discipline/approval-templates/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/discipline/approval-templates/${id}`, { method: 'DELETE' });
  },
};
