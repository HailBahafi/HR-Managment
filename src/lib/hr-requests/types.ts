// ─── Constants ────────────────────────────────────────────────────────────────

export const HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID = '__ALL_DEPARTMENTS__';
export const HR_COMPANY_ROOT_ID = '__ROOT__';

// ─── Departments ──────────────────────────────────────────────────────────────

export interface HRDepartmentEntity {
  id: string;
  parentId?: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

// ─── Form fields ──────────────────────────────────────────────────────────────

export type HRRequestFieldKind =
  | 'text' | 'textarea' | 'number' | 'date' | 'time' | 'datetime'
  | 'checkbox' | 'checkbox_group' | 'radio_group' | 'email';

export interface HRRequestFieldOption {
  id: string;
  labelAr: string;
}

export interface HRRequestFieldDefinition {
  id: string;
  labelAr: string;
  labelEn?: string;
  kind: HRRequestFieldKind;
  required?: boolean;
  placeholder?: string;
  options?: HRRequestFieldOption[];
  sortOrder: number;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export interface HRRequestTemplateEntity {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  isUniversalDefault?: boolean;
  formFields: HRRequestFieldDefinition[];
}

// ─── Approval stages ──────────────────────────────────────────────────────────

export type HRApprovalStageMode = 'sequential' | 'parallel' | 'optional' | 'any_one';

export interface HRApprovalParallelRule {
  kind: 'all' | 'count';
  required?: number;
}

export interface HRApprovalStage {
  id: string;
  sortOrder: number;
  mode: HRApprovalStageMode;
  approverEmployeeIds: string[];
  parallelRule?: HRApprovalParallelRule;
  optionalTimeoutHours?: number;
}

export function validateApprovalStages(stages: HRApprovalStage[]): string | null {
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i]!;
    if (s.approverEmployeeIds.length === 0) {
      return `المرحلة ${i + 1}: يجب تحديد معتمد واحد على الأقل`;
    }
    if (s.mode === 'parallel' && s.parallelRule?.kind === 'count') {
      const req = s.parallelRule.required ?? 0;
      if (req < 1 || req > s.approverEmployeeIds.length) {
        return `المرحلة ${i + 1}: عدد الموافقات المطلوبة يجب أن يكون بين 1 و ${s.approverEmployeeIds.length}`;
      }
    }
  }
  return null;
}

// ─── Request subtypes ─────────────────────────────────────────────────────────

export interface HRRequestSubtype {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

// ─── Request types ────────────────────────────────────────────────────────────

export interface HRRequestTypeEntity {
  id: string;
  departmentId: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  subtypes: HRRequestSubtype[];
  templateId: string | null;
  approvalStages?: HRApprovalStage[];
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export interface HRRequestSubmissionRecord {
  id: string;
  createdAt: string;
  employeeId: string;
  employeeNameAr: string;
  employeeNameEn: string;
  requestTypeId: string;
  requestTypeNameAr: string;
  requestTypeNameEn: string;
  departmentId: string;
  departmentNameAr: string;
  departmentNameEn: string;
  templateId: string | null;
  fieldValues: Record<string, unknown>;
}

// ─── Approval assignment templates ────────────────────────────────────────────

export interface HRApprovalTemplateStage {
  id: string;
  sortOrder: number;
  mode: HRApprovalStageMode;
  approvers: { employeeId: string; mandatory: boolean }[];
  parallelRule?: HRApprovalParallelRule;
  optionalTimeoutHours?: number;
}

export interface HRApprovalAssignmentTemplate {
  id: string;
  nameAr: string;
  description?: string;
  isActive: boolean;
  stages: HRApprovalTemplateStage[];
  createdAt: string;
  updatedAt: string;
}

export function templateStagesToCore(stages: HRApprovalTemplateStage[]): HRApprovalStage[] {
  return stages.map((s, i) => ({
    id: s.id,
    sortOrder: i + 1,
    mode: s.mode,
    approverEmployeeIds: s.approvers.map((a) => a.employeeId),
    parallelRule: s.parallelRule,
    optionalTimeoutHours: s.optionalTimeoutHours,
  }));
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export const HR_REQUESTS_GENERAL_PATH = '/hr/requests/general';
export const HR_REQUESTS_TYPES_PATH = '/hr/requests/request-types';
export const HR_REQUESTS_FORM_TEMPLATES_PATH = '/hr/requests/form-templates';
export const HR_REQUESTS_APPROVAL_ASSIGNMENT_PATH = '/hr/requests/approval-assignment';

export function hrRequestPath(departmentSlug: string, requestTypeSlug: string) {
  return `/hr/requests/${departmentSlug}/${requestTypeSlug}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function slugify(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[\s؀-ۿ]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}
