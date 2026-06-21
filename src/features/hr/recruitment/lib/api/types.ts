export type RecruitmentJobType = 'full-time' | 'part-time' | 'contract' | 'internship';

export type RecruitmentPipelineStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'technical'
  | 'offer'
  | 'hired'
  | 'rejected';

export type RecruitmentFormFieldType = 'text' | 'number' | 'select' | 'file';

export interface RecruitmentFormField {
  id: string;
  type: RecruitmentFormFieldType;
  label: string;
  required: boolean;
  options?: string[];
  sortOrder: number;
}

export interface RecruitmentForm {
  id: string;
  tenantId: string;
  jobId: string;
  title: string;
  description: string;
  fields: RecruitmentFormField[];
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentJob {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  department: string;
  location: string;
  type: RecruitmentJobType;
  isActive: boolean;
  formId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentJobDetail extends RecruitmentJob {
  form: RecruitmentForm;
}

export interface RecruitmentApplicantScore {
  ruleScore: number;
  aiScore: number;
  finalScore: number;
  reasoning: string;
  scoredAt?: string;
}

export interface RecruitmentApplicant {
  id: string;
  tenantId: string;
  jobId: string;
  formId: string;
  answers: Record<string, string | undefined>;
  cvFileName: string | null;
  cvFilePath: string | null;
  pipelineStage: RecruitmentPipelineStage;
  score: RecruitmentApplicantScore | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentPipelineStageConfig {
  stage: RecruitmentPipelineStage;
  label: string;
  color: string;
  sortOrder: number;
}

export interface RecruitmentJobStats {
  jobId: string;
  totalApplicants: number;
  hiredCount: number;
  stageCounts: Record<RecruitmentPipelineStage, number>;
}

export interface RecruitmentFormFieldInput {
  id?: string;
  type: RecruitmentFormFieldType;
  label: string;
  required: boolean;
  options?: string[];
  sortOrder?: number;
}

export interface RecruitmentFormInput {
  title: string;
  description?: string;
  fields: RecruitmentFormFieldInput[];
}

export interface CreateRecruitmentJobDto {
  tenantId: string;
  title: string;
  description?: string;
  department: string;
  location?: string;
  type: RecruitmentJobType;
  isActive?: boolean;
  form: RecruitmentFormInput;
}

export interface UpdateRecruitmentJobDto {
  title?: string;
  description?: string;
  department?: string;
  location?: string;
  type?: RecruitmentJobType;
  isActive?: boolean;
  form?: RecruitmentFormInput;
}

export interface UpdateRecruitmentFormDto {
  title?: string;
  description?: string;
  fields?: RecruitmentFormFieldInput[];
}

export interface ListRecruitmentJobsQuery {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface ListRecruitmentApplicantsQuery {
  tenantId: string;
  page?: number;
  limit?: number;
  jobId?: string;
  pipelineStage?: RecruitmentPipelineStage;
  minScore?: number;
  search?: string;
}

export interface SubmitRecruitmentApplicationDto {
  answers: Record<string, string>;
  cvFileName?: string | null;
  cvFileBase64?: string | null;
}

export interface MoveApplicantStageDto {
  pipelineStage: RecruitmentPipelineStage;
}

export interface UpdateRecruitmentPipelineStagesDto {
  tenantId: string;
  stages: RecruitmentPipelineStageConfig[];
}

export interface ListPublicRecruitmentJobsQuery {
  tenantSlug?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PublicRecruitmentJob {
  job: RecruitmentJob;
  form: RecruitmentForm;
}

export type RecruitmentAtsRole = 'admin' | 'recruiter' | 'viewer';

export interface RecruitmentTenant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: string;
}

export interface RecruitmentUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: RecruitmentAtsRole;
  createdAt: string;
}

export interface ListRecruitmentTenantsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateRecruitmentTenantDto {
  name: string;
  slug?: string;
  logo?: string | null;
}

export interface UpdateRecruitmentTenantDto {
  name?: string;
  slug?: string;
  logo?: string | null;
}

export interface ListRecruitmentUsersQuery {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  role?: RecruitmentAtsRole;
}

export interface CreateRecruitmentUserDto {
  tenantId: string;
  name: string;
  email: string;
  role?: RecruitmentAtsRole;
}

export interface UpdateRecruitmentUserDto {
  name?: string;
  email?: string;
  role?: RecruitmentAtsRole;
}

export interface CreateRecruitmentApplicantDto {
  jobId: string;
  answers: Record<string, string>;
  pipelineStage?: RecruitmentPipelineStage;
  cvFileName?: string | null;
  cvFilePath?: string | null;
}

export interface UpdateRecruitmentApplicantDto {
  answers?: Record<string, string>;
  pipelineStage?: RecruitmentPipelineStage;
  cvFileName?: string | null;
  cvFilePath?: string | null;
}
