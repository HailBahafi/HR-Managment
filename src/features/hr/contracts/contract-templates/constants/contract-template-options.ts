import type { ContractNature, WorkArrangement } from '@/features/hr/contracts/contract-templates/types/contract-template';

/** قيم مطابقة لـ backend: WorkArrangement enum */
export const TEMPLATE_WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
  remote: 'عن بُعد',
  hybrid: 'هجين (مختلط)',
};

/** قيم مطابقة لـ backend: ContractNature enum */
export const TEMPLATE_CONTRACT_NATURE_LABELS: Record<ContractNature, string> = {
  indefinite: 'غير محدد المدة',
  fixed_term: 'محدد المدة',
  project_based: 'عقد إنجاز / مشروع',
};
