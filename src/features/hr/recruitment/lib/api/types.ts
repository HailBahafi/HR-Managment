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
  jobId: string;
  title: string;
  description: string;
  fields: RecruitmentFormField[];
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentJob {
  id: string;
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
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface ListRecruitmentApplicantsQuery {
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
  stages: RecruitmentPipelineStageConfig[];
}

export interface ListPublicRecruitmentJobsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PublicRecruitmentJob {
  job: RecruitmentJob;
  form: RecruitmentForm;
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
