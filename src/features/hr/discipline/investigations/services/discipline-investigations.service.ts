import type {
  HRDisciplineInvestigationRecord,
  HRInvestigationRecommendation,
  HRInvestigationResult,
} from '@/features/hr/discipline/lib/types';
import {
  INVESTIGATION_RECOMMENDATION_LABELS,
  INVESTIGATION_RESULT_LABELS,
} from '@/features/hr/discipline/lib/types';
import { toIso } from '@/features/hr/lib/map-dto';
import {
  disciplineInvestigationsApi,
  type CreateDisciplineInvestigationDto,
  type DisciplineInvestigationResponseDto,
  type InvestigationDeductionTypeDto,
  type InvestigationRecommendationDto,
  type InvestigationResultDto,
  type UpdateDisciplineInvestigationDto,
} from '@/features/hr/discipline/lib/api/discipline-investigations';

const DEDUCTION_TYPE_LABELS: Record<InvestigationDeductionTypeDto, string> = {
  days: 'أيام',
  hours: 'ساعات',
  fixed_amount: 'مبلغ ثابت',
};

export function mapInvestigationResult(
  result: InvestigationResultDto,
): HRInvestigationResult {
  return result;
}

export function toInvestigationResultDto(
  result: HRInvestigationResult,
): InvestigationResultDto {
  return result;
}

export function toInvestigationRecommendationDto(
  recommendation: HRInvestigationRecommendation,
): InvestigationRecommendationDto {
  return recommendation;
}

function buildRecommendationText(dto: DisciplineInvestigationResponseDto): string {
  if (dto.recommendation === 'warning') {
    return INVESTIGATION_RECOMMENDATION_LABELS.warning;
  }
  if (dto.recommendation === 'deduction') {
    const label = dto.deductionType
      ? DEDUCTION_TYPE_LABELS[dto.deductionType]
      : INVESTIGATION_RECOMMENDATION_LABELS.deduction;
    const value = dto.deductionValue ? Number(dto.deductionValue) : null;
    return value ? `${label}: ${value}` : label;
  }
  return INVESTIGATION_RESULT_LABELS[mapInvestigationResult(dto.result)];
}

export function mapDisciplineInvestigationResponse(
  dto: DisciplineInvestigationResponseDto,
  employeeNameById: Record<string, string>,
): HRDisciplineInvestigationRecord {
  const employeeNameAr = employeeNameById[dto.subjectEmployeeId] ?? dto.subjectEmployeeId;
  const investigatorName = employeeNameById[dto.investigatorEmployeeId] ?? dto.investigatorEmployeeId;
  const recommendationType = (dto.recommendation ?? null) as HRInvestigationRecommendation | null;

  return {
    id: dto.id,
    caseId: dto.violationRecordId,
    caseNumber: dto.linkedViolationRecordNumber,
    employeeId: dto.subjectEmployeeId,
    employeeNameAr,
    investigatorName,
    date: dto.investigationDate,
    employeeStatement: dto.employeeStatement ?? '',
    witnessStatement: dto.witnessStatement ?? '',
    result: mapInvestigationResult(dto.result),
    recommendation: buildRecommendationText(dto),
    recommendationType,
    deductionType: dto.deductionType ?? null,
    deductionValue: dto.deductionValue != null ? Number(dto.deductionValue) : null,
    createdAt: toIso(dto.createdAt),
    updatedAt: toIso(dto.updatedAt),
  };
}

export async function createDisciplineInvestigation(
  payload: CreateDisciplineInvestigationDto,
) {
  return disciplineInvestigationsApi.create(payload);
}

export async function updateDisciplineInvestigation(
  id: string,
  payload: UpdateDisciplineInvestigationDto,
) {
  return disciplineInvestigationsApi.update(id, payload);
}

export async function deleteDisciplineInvestigation(id: string) {
  return disciplineInvestigationsApi.remove(id);
}
