import { create } from 'zustand';
import type { HRContractNature, HRWorkArrangement } from './contracts-store';

export type HRContractTemplateRecord = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  defaultContractNature: HRContractNature;
  defaultWorkArrangement: HRWorkArrangement;
  defaultProbationDays: number | null;
  suggestedBaseSalary: number;
  currency: string;
  durationMonths: number | null;
  allowanceTypeIds: string[];
  allowancesHint: string;
  sortOrder: number;
  isActive: boolean;
};

const SEED: HRContractTemplateRecord[] = [
  { id: 'hct-exec', nameAr: 'تنفيذي — دوام كامل', nameEn: 'Executive full-time', descriptionAr: 'راتب أساسي مرتفع، بدل سكن وانتقال.', defaultContractNature: 'fixed_term', defaultWorkArrangement: 'full_time', defaultProbationDays: 90, suggestedBaseSalary: 18000, currency: 'SAR', durationMonths: 24, allowanceTypeIds: ['halt-housing', 'halt-transport', 'halt-phone'], allowancesHint: '', sortOrder: 10, isActive: true },
  { id: 'hct-standard', nameAr: 'موظف إداري قياسي', nameEn: 'Standard office', descriptionAr: 'دوام كامل، فترة تجربة ٦٠ يوماً.', defaultContractNature: 'fixed_term', defaultWorkArrangement: 'full_time', defaultProbationDays: 60, suggestedBaseSalary: 7000, currency: 'SAR', durationMonths: 12, allowanceTypeIds: ['halt-transport', 'halt-phone'], allowancesHint: '', sortOrder: 20, isActive: true },
  { id: 'hct-part', nameAr: 'دوام جزئي', nameEn: 'Part-time', descriptionAr: 'ساعات محدّدة، بدل مواصلات أخف.', defaultContractNature: 'fixed_term', defaultWorkArrangement: 'part_time', defaultProbationDays: 30, suggestedBaseSalary: 3500, currency: 'SAR', durationMonths: 6, allowanceTypeIds: ['halt-transport'], allowancesHint: '', sortOrder: 30, isActive: true },
  { id: 'hct-field', nameAr: 'مبيعات / ميداني', nameEn: 'Sales / field', descriptionAr: 'بدل ميداني ووقود.', defaultContractNature: 'fixed_term', defaultWorkArrangement: 'full_time', defaultProbationDays: 60, suggestedBaseSalary: 5500, currency: 'SAR', durationMonths: 12, allowanceTypeIds: ['halt-field', 'halt-transport', 'halt-gas'], allowancesHint: '', sortOrder: 40, isActive: true },
  { id: 'hct-temp', nameAr: 'عقد مؤقت / موسمي', nameEn: 'Temporary / seasonal', descriptionAr: 'مدة قصيرة.', defaultContractNature: 'temporary', defaultWorkArrangement: 'full_time', defaultProbationDays: null, suggestedBaseSalary: 4000, currency: 'SAR', durationMonths: 3, allowanceTypeIds: ['halt-food', 'halt-transport'], allowancesHint: '', sortOrder: 50, isActive: true },
  { id: 'hct-intern', nameAr: 'متدرب', nameEn: 'Intern / trainee', descriptionAr: 'راتب رمزي، حد أدنى من البدلات.', defaultContractNature: 'temporary', defaultWorkArrangement: 'full_time', defaultProbationDays: 14, suggestedBaseSalary: 2500, currency: 'SAR', durationMonths: 6, allowanceTypeIds: ['halt-transport'], allowancesHint: '', sortOrder: 60, isActive: true },
];

interface State { templates: HRContractTemplateRecord[]; }
export const useHRContractTemplatesStore = create<State>()(() => ({ templates: SEED }));
