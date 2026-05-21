import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type InvestigationResultDto = 'proven' | 'not_proven';
export type InvestigationRecommendationDto = 'warning' | 'deduction';
export type InvestigationDeductionTypeDto = 'days' | 'hours' | 'fixed_amount';

export type DisciplineInvestigationResponseDto = {
  id: string;
  companyId: string;
  violationRecordId: string;
  linkedViolationRecordNumber: string;
  subjectEmployeeId: string;
  investigatorEmployeeId: string;
  investigationDate: string;
  employeeStatement: string | null;
  witnessStatement: string | null;
  result: InvestigationResultDto;
  recommendation: InvestigationRecommendationDto | null;
  deductionType: InvestigationDeductionTypeDto | null;
  deductionValue: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateDisciplineInvestigationDto = {
  companyId: string;
  violationRecordId?: string;
  linkedViolationRecordNumber?: string;
  investigatorEmployeeId: string;
  investigationDate: string;
  employeeStatement?: string | null;
  witnessStatement?: string | null;
  result: InvestigationResultDto;
  recommendation?: InvestigationRecommendationDto | null;
  deductionType?: InvestigationDeductionTypeDto;
  deductionValue?: number;
  createdBy?: string | null;
};

export type UpdateDisciplineInvestigationDto = {
  investigatorEmployeeId?: string;
  investigationDate?: string;
  employeeStatement?: string | null;
  witnessStatement?: string | null;
  result?: InvestigationResultDto;
  recommendation?: InvestigationRecommendationDto | null;
  deductionType?: InvestigationDeductionTypeDto | null;
  deductionValue?: number | null;
  updatedBy?: string | null;
};

export type DisciplineInvestigationListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  violationRecordId?: string;
  subjectEmployeeId?: string;
  investigatorEmployeeId?: string;
  result?: InvestigationResultDto;
};

export const disciplineInvestigationsApi = {
  getAll(query?: DisciplineInvestigationListQuery) {
    return apiRequest<PaginatedResult<DisciplineInvestigationResponseDto>>('/discipline/investigations', { query });
  },
  getById(id: string) {
    return apiRequest<DisciplineInvestigationResponseDto>(`/discipline/investigations/${id}`);
  },
  create(payload: CreateDisciplineInvestigationDto) {
    return apiRequest<DisciplineInvestigationResponseDto>('/discipline/investigations', {
      method: 'POST',
      body: payload,
    });
  },
  update(id: string, payload: UpdateDisciplineInvestigationDto) {
    return apiRequest<DisciplineInvestigationResponseDto>(`/discipline/investigations/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/discipline/investigations/${id}`, { method: 'DELETE' });
  },
};
