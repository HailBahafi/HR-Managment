import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type {
  CreateRecruitmentApplicantDto,
  CreateRecruitmentJobDto,
  CreateRecruitmentTenantDto,
  CreateRecruitmentUserDto,
  ListRecruitmentApplicantsQuery,
  ListRecruitmentJobsQuery,
  ListPublicRecruitmentJobsQuery,
  ListRecruitmentTenantsQuery,
  ListRecruitmentUsersQuery,
  MoveApplicantStageDto,
  PublicRecruitmentJob,
  RecruitmentApplicant,
  RecruitmentApplicantScore,
  RecruitmentForm,
  RecruitmentJob,
  RecruitmentJobDetail,
  RecruitmentJobStats,
  RecruitmentPipelineStage,
  RecruitmentPipelineStageConfig,
  RecruitmentTenant,
  RecruitmentUser,
  SubmitRecruitmentApplicationDto,
  UpdateRecruitmentApplicantDto,
  UpdateRecruitmentFormDto,
  UpdateRecruitmentJobDto,
  UpdateRecruitmentPipelineStagesDto,
  UpdateRecruitmentTenantDto,
  UpdateRecruitmentUserDto,
} from '@/features/hr/recruitment/lib/api/types';

type QueryRecord = Record<string, string | number | boolean | null | undefined>;

function asQuery(query: object): QueryRecord {
  return query as QueryRecord;
}

export const recruitmentTenantsApi = {
  create(dto: CreateRecruitmentTenantDto) {
    return apiRequest<RecruitmentTenant>('/recruitment/tenants', { method: 'POST', body: dto });
  },

  list(query?: ListRecruitmentTenantsQuery) {
    return apiRequest<PaginatedResult<RecruitmentTenant>>('/recruitment/tenants', {
      query: asQuery(query ?? {}),
    });
  },

  getBySlug(slug: string) {
    return apiRequest<RecruitmentTenant>(`/recruitment/tenants/by-slug/${slug}`);
  },

  getById(id: string) {
    return apiRequest<RecruitmentTenant>(`/recruitment/tenants/${id}`);
  },

  update(id: string, dto: UpdateRecruitmentTenantDto) {
    return apiRequest<RecruitmentTenant>(`/recruitment/tenants/${id}`, { method: 'PATCH', body: dto });
  },

  delete(id: string) {
    return apiRequest<void>(`/recruitment/tenants/${id}`, { method: 'DELETE' });
  },
};

export const recruitmentUsersApi = {
  create(dto: CreateRecruitmentUserDto) {
    return apiRequest<RecruitmentUser>('/recruitment/users', { method: 'POST', body: dto });
  },

  list(query: ListRecruitmentUsersQuery) {
    return apiRequest<PaginatedResult<RecruitmentUser>>('/recruitment/users', { query: asQuery(query) });
  },

  getById(id: string) {
    return apiRequest<RecruitmentUser>(`/recruitment/users/${id}`);
  },

  update(id: string, dto: UpdateRecruitmentUserDto) {
    return apiRequest<RecruitmentUser>(`/recruitment/users/${id}`, { method: 'PATCH', body: dto });
  },

  delete(id: string) {
    return apiRequest<void>(`/recruitment/users/${id}`, { method: 'DELETE' });
  },
};

export const recruitmentApi = {
  listJobs(query: ListRecruitmentJobsQuery) {
    return apiRequest<PaginatedResult<RecruitmentJob>>('/recruitment/jobs', { query: asQuery(query) });
  },

  getJob(id: string) {
    return apiRequest<RecruitmentJobDetail>(`/recruitment/jobs/${id}`);
  },

  getJobBySlug(slug: string) {
    return apiRequest<RecruitmentJobDetail>(`/recruitment/jobs/by-slug/${slug}`);
  },

  createJob(dto: CreateRecruitmentJobDto) {
    return apiRequest<RecruitmentJobDetail>('/recruitment/jobs', { method: 'POST', body: dto });
  },

  updateJob(id: string, dto: UpdateRecruitmentJobDto) {
    return apiRequest<RecruitmentJobDetail>(`/recruitment/jobs/${id}`, { method: 'PATCH', body: dto });
  },

  deleteJob(id: string) {
    return apiRequest<void>(`/recruitment/jobs/${id}`, { method: 'DELETE' });
  },

  toggleJobActive(id: string) {
    return apiRequest<RecruitmentJobDetail>(`/recruitment/jobs/${id}/toggle-active`, { method: 'PATCH' });
  },

  getFormByJobId(jobId: string) {
    return apiRequest<RecruitmentForm>(`/recruitment/jobs/${jobId}/form`);
  },

  updateFormByJobId(jobId: string, dto: UpdateRecruitmentFormDto) {
    return apiRequest<RecruitmentForm>(`/recruitment/jobs/${jobId}/form`, { method: 'PATCH', body: dto });
  },

  getJobApplicants(jobId: string) {
    return apiRequest<RecruitmentApplicant[]>(`/recruitment/jobs/${jobId}/applicants`);
  },

  getJobStats(jobId: string) {
    return apiRequest<RecruitmentJobStats>(`/recruitment/jobs/${jobId}/stats`);
  },

  getJobPipeline(jobId: string) {
    return apiRequest<Record<RecruitmentPipelineStage, RecruitmentApplicant[]>>(
      `/recruitment/jobs/${jobId}/pipeline`,
    );
  },

  listApplicants(query: ListRecruitmentApplicantsQuery) {
    return apiRequest<PaginatedResult<RecruitmentApplicant>>('/recruitment/applicants', {
      query: asQuery(query),
    });
  },

  createApplicant(dto: CreateRecruitmentApplicantDto) {
    return apiRequest<RecruitmentApplicant>('/recruitment/applicants', { method: 'POST', body: dto });
  },

  getApplicant(id: string) {
    return apiRequest<RecruitmentApplicant>(`/recruitment/applicants/${id}`);
  },

  updateApplicant(id: string, dto: UpdateRecruitmentApplicantDto) {
    return apiRequest<RecruitmentApplicant>(`/recruitment/applicants/${id}`, { method: 'PATCH', body: dto });
  },

  deleteApplicant(id: string) {
    return apiRequest<void>(`/recruitment/applicants/${id}`, { method: 'DELETE' });
  },

  moveApplicantStage(id: string, dto: MoveApplicantStageDto) {
    return apiRequest<RecruitmentApplicant>(`/recruitment/applicants/${id}/stage`, {
      method: 'PATCH',
      body: dto,
    });
  },

  scoreApplicant(id: string) {
    return apiRequest<RecruitmentApplicantScore>(`/recruitment/applicants/${id}/score`, {
      method: 'POST',
    });
  },

  listPipelineStages(tenantId: string) {
    return apiRequest<RecruitmentPipelineStageConfig[]>('/recruitment/pipeline-stages', {
      query: { tenantId },
    });
  },

  updatePipelineStages(dto: UpdateRecruitmentPipelineStagesDto) {
    return apiRequest<RecruitmentPipelineStageConfig[]>('/recruitment/pipeline-stages', {
      method: 'PUT',
      body: dto,
    });
  },
};

export const publicRecruitmentApi = {
  listActiveJobs(query?: ListPublicRecruitmentJobsQuery) {
    return apiRequest<PaginatedResult<RecruitmentJob>>('/public/recruitment/jobs', {
      query: asQuery(query ?? {}),
    });
  },

  getPublicJob(slug: string) {
    return apiRequest<PublicRecruitmentJob>(`/public/recruitment/jobs/${slug}`);
  },

  submitApplication(slug: string, dto: SubmitRecruitmentApplicationDto) {
    return apiRequest<RecruitmentApplicant>(`/public/recruitment/jobs/${slug}/apply`, {
      method: 'POST',
      body: dto,
    });
  },
};
