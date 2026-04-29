export type HRViolationDeductionKind = 'none' | 'amount' | 'hours' | 'day';
export type HRViolationCaseStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'executed' | 'closed';
export type HRDisciplineNoticeKind = 'verbal' | 'first' | 'second' | 'final';
export type HRInvestigationResult = 'upheld' | 'cancelled' | 'to_warning' | 'to_deduction';
export type HRPenaltyType = 'reprimand' | 'warning' | 'monetary' | 'suspension' | 'termination_recommendation';
export type HRAppealChannel = 'manager' | 'hr' | 'committee';
export type HRAppealStatus = 'submitted' | 'in_review' | 'accepted' | 'rejected' | 'closed';
export type HRDeductionStatus = 'ready' | 'posted' | 'calculated' | 'cancelled';
export type HRApproverRole = 'manager' | 'hr' | 'executive';

export interface HRViolationTypeRecord {
  id: string; code: string; nameAr: string; nameEn: string;
  sortOrder: number; isActive: boolean;
  hasDeduction: boolean; deductionKind: HRViolationDeductionKind; deductionValue: number;
  needsWarning: boolean; needsInvestigation: boolean; needsApproval: boolean;
  approvalTemplateId: string | null; updatedAt: string;
}

export interface HRViolationCaseRecord {
  id: string; caseNumber: string;
  employeeId: string; employeeNameAr: string; employeeNameEn: string;
  date: string; description: string; notes: string; attachmentsNote: string;
  violationTypeId: string; typeCode: string; typeNameAr: string;
  typeHasDeduction: boolean; typeDeductionKind: HRViolationDeductionKind; typeDeductionValue: number;
  typeNeedsWarning: boolean; typeNeedsInvestigation: boolean; typeNeedsApproval: boolean;
  approvalTemplateId: string | null;
  status: HRViolationCaseStatus;
  requiredApprovers: HRApproverRole[];
  currentApprovalIndex: number;
  approvalLog: { role: HRApproverRole; action: 'approved' | 'rejected' | 'edit_requested'; note?: string; at: string }[];
  postedToPayroll: boolean;
  createdAt: string; updatedAt: string;
}

export interface HRDisciplineNoticeRecord {
  id: string; employeeId: string; employeeNameAr: string;
  kind: HRDisciplineNoticeKind; reasonAr: string; date: string;
  linkedCaseId: string; attachmentsNote: string; createdAt: string;
}

export interface HRDisciplineInvestigationRecord {
  id: string; caseId: string; caseNumber: string;
  employeeId: string; employeeNameAr: string;
  investigatorName: string; date: string;
  employeeStatement: string; witnessStatement: string;
  result: HRInvestigationResult; recommendation: string;
  createdAt: string; updatedAt: string;
}

export interface HRDisciplinePenaltyRecord {
  id: string; employeeId: string; employeeNameAr: string;
  caseId: string; caseNumber: string;
  penaltyType: HRPenaltyType; decisionDate: string; notes: string; createdAt: string;
}

export interface HRDisciplinePayrollDeductionRecord {
  id: string; caseId: string; caseNumber: string;
  employeeId: string; employeeNameAr: string;
  reasonAr: string; deductionKind: HRViolationDeductionKind;
  amount: number; month: string;
  status: HRDeductionStatus; createdAt: string; updatedAt: string;
}

export interface HRDisciplineAppealRecord {
  id: string; caseId: string; caseNumber: string;
  employeeId: string; employeeNameAr: string;
  date: string; channel: HRAppealChannel; status: HRAppealStatus;
  grounds: string; responseNote: string; createdAt: string; updatedAt: string;
}

// Nav
export const hrDisciplineSections = [
  { slug: 'violation-types',      titleAr: 'أنواع المخالفات',      titleEn: 'Violation Types' },
  { slug: 'approval-assignment',  titleAr: 'إسناد الموافقات',        titleEn: 'Approval Assignment' },
  { slug: 'violation-cases',      titleAr: 'تسجيل  المخالفات',      titleEn: 'Violation Cases' },
  { slug: 'notices',              titleAr: 'الإنذارات والتحذيرات', titleEn: 'Notices' },
  { slug: 'investigations',       titleAr: 'التحقيقات',            titleEn: 'Investigations' },
  { slug: 'penalties',            titleAr: 'العقوبات',             titleEn: 'Penalties' },
  { slug: 'deductions',           titleAr: 'كشف الخصومات',          titleEn: 'Payroll Deductions' },
  { slug: 'appeals',              titleAr: 'التظلمات',             titleEn: 'Appeals' },
] as const;

export type HRDisciplineSection = (typeof hrDisciplineSections)[number]['slug'];
export function isDisciplineSection(s: string): s is HRDisciplineSection {
  return hrDisciplineSections.some(x => x.slug === s);
}

export const hrDisciplineNavGroups: { labelAr: string; items: { slug: HRDisciplineSection; labelAr: string }[] }[] = [
  {
    labelAr: 'الإعدادات', items: [
      { slug: 'violation-types',     labelAr: 'أنواع المخالفات' },
      { slug: 'approval-assignment', labelAr: 'إسناد الموافقات' },
    ],
  },
  {
    labelAr: 'مسار القضية', items: [
      { slug: 'violation-cases',  labelAr: 'تسجيل المخالفات' },
      { slug: 'notices',          labelAr: 'الإنذارات' },
      { slug: 'investigations',   labelAr: 'التحقيقات' },
      { slug: 'penalties',        labelAr: 'العقوبات' },
      { slug: 'deductions',       labelAr: 'كشف الخصومات' },
      { slug: 'appeals',          labelAr: 'التظلمات' },
    ],
  },
];

// Label maps
export const NOTICE_KIND_LABELS: Record<HRDisciplineNoticeKind, string> = {
  verbal: 'شفهي', first: 'إنذار أول', second: 'إنذار ثانٍ', final: 'إنذار نهائي',
};
export const INVESTIGATION_RESULT_LABELS: Record<HRInvestigationResult, string> = {
  upheld: 'ثبتت المخالفة', cancelled: 'لم تثبت', to_warning: 'توجيه إنذار', to_deduction: 'استقطاع',
};
export const PENALTY_TYPE_LABELS: Record<HRPenaltyType, string> = {
  reprimand: 'توبيخ', warning: 'إنذار رسمي', monetary: 'غرامة مالية',
  suspension: 'إيقاف عن العمل', termination_recommendation: 'توصية بالإنهاء',
};
export const APPEAL_CHANNEL_LABELS: Record<HRAppealChannel, string> = {
  manager: 'المدير المباشر', hr: 'الموارد البشرية', committee: 'لجنة تظلمات',
};
export const APPEAL_STATUS_LABELS: Record<HRAppealStatus, string> = {
  submitted: 'مُقدَّم', in_review: 'قيد المراجعة', accepted: 'مقبول', rejected: 'مرفوض', closed: 'مغلق',
};
export const CASE_STATUS_LABELS: Record<HRViolationCaseStatus, string> = {
  draft: 'مسودة', submitted: 'مُقدَّم', under_review: 'قيد الاعتماد',
  approved: 'معتمد', rejected: 'مرفوض', executed: 'منفَّذ', closed: 'مغلق',
};
export const CASE_STATUS_COLORS: Record<HRViolationCaseStatus, string> = {
  draft: 'text-muted-foreground border-border bg-muted/30',
  submitted: 'text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/30',
  under_review: 'text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/30',
  approved: 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30',
  rejected: 'text-red-700 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950/30',
  executed: 'text-purple-700 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950/30',
  closed: 'text-muted-foreground border-border bg-muted/30',
};
export const DEDUCTION_KIND_LABELS: Record<HRViolationDeductionKind, string> = {
  none: 'لا يوجد', amount: 'مبلغ ثابت', hours: 'بالساعات', day: 'بالأيام',
};
export const DEDUCTION_STATUS_LABELS: Record<HRDeductionStatus, string> = {
  ready: 'جاهز', posted: 'مُدرَج', calculated: 'محسوب', cancelled: 'ملغى',
};
