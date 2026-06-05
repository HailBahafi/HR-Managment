import type { ContractTemplateDto } from '@/features/hr/contracts/contract-templates/types/contract-template';
import type { EmploymentContractFormValues } from '@/features/hr/contracts/employment/utils/employment-contract-form';
import type { HRContractNature, HRWorkArrangement } from '@/features/hr/contracts/lib/contracts-store';

function toContractNature(value: string): HRContractNature {
  if (value === 'indefinite' || value === 'fixed_term' || value === 'project_based') {
    return value;
  }
  if (value === 'task_based') return 'project_based';
  return 'fixed_term';
}

function toWorkArrangement(value: string): HRWorkArrangement {
  const valid: HRWorkArrangement[] = ['full_time', 'part_time', 'remote', 'hybrid'];
  if (valid.includes(value as HRWorkArrangement)) return value as HRWorkArrangement;
  return 'full_time';
}

export function computeTemplateEndDate(
  nature: HRContractNature,
  durationMonths: number | null,
  startDate: string,
): string | undefined {
  if (nature !== 'fixed_term' || !durationMonths || !startDate.trim()) return undefined;
  return addMonthsToDate(startDate.trim(), durationMonths);
}

function addMonthsToDate(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setMonth(date.getMonth() + months);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** يطبّق قالب العقد على حقول نموذج عقد العمل */
export function applyContractTemplateToForm(
  template: ContractTemplateDto,
  options?: { essentialArticleIds?: string[]; startDate?: string },
): Partial<EmploymentContractFormValues> {
  const nature = toContractNature(template.defaultContractNature);
  const templateArticleIds = (template.articles ?? []).map((a) => a.articleId);
  const essential = options?.essentialArticleIds ?? [];
  const articleIds =
    templateArticleIds.length > 0
      ? [...new Set([...essential, ...templateArticleIds])]
      : [...essential];

  const start = options?.startDate?.trim();
  const endDate = computeTemplateEndDate(nature, template.durationMonths, start ?? '') ?? '';

  return {
    templateId: template.id,
    contractType: nature,
    workArrangement: toWorkArrangement(template.defaultWorkArrangement),
    probationDays:
      template.defaultProbationDays != null ? String(template.defaultProbationDays) : '',
    annualLeaveDays:
      template.defaultAnnualLeaveDays != null ? String(template.defaultAnnualLeaveDays) : '',
    baseSalary: template.suggestedBaseSalary
      ? String(parseFloat(template.suggestedBaseSalary) || 0)
      : '',
    currency: template.currency || 'SAR',
    allowancesNote: template.allowancesHint ?? '',
    allowanceLines:
      (template.allowanceLines?.length ?? 0) > 0
        ? template.allowanceLines.map((l) => ({
            allowanceTypeId: l.allowanceTypeId,
            amount: String(parseFloat(l.amount) || 0),
          }))
        : [{ allowanceTypeId: '', amount: '' }],
    articleIds,
    ...(endDate ? { endDate } : {}),
  };
}
