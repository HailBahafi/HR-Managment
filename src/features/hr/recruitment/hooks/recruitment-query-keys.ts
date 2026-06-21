export const recruitmentKeys = {
  all: ['recruitment'] as const,
  tenantId: () => [...recruitmentKeys.all, 'tenant-id'] as const,
  tenants: (search?: string) => [...recruitmentKeys.all, 'tenants', search ?? ''] as const,
  tenant: (id: string) => [...recruitmentKeys.all, 'tenant', id] as const,
  users: (tenantId: string, filters?: Record<string, unknown>) =>
    [...recruitmentKeys.all, 'users', tenantId, filters ?? {}] as const,
  user: (id: string) => [...recruitmentKeys.all, 'user', id] as const,
  jobs: (tenantId: string, search?: string, isActive?: boolean) =>
    [...recruitmentKeys.all, 'jobs', tenantId, search ?? '', isActive ?? 'all'] as const,
  job: (id: string) => [...recruitmentKeys.all, 'job', id] as const,
  jobForm: (jobId: string) => [...recruitmentKeys.all, 'job-form', jobId] as const,
  jobStats: (id: string) => [...recruitmentKeys.all, 'job-stats', id] as const,
  jobPipeline: (id: string) => [...recruitmentKeys.all, 'job-pipeline', id] as const,
  applicants: (tenantId: string, filters: Record<string, unknown>) =>
    [...recruitmentKeys.all, 'applicants', tenantId, filters] as const,
  applicant: (id: string) => [...recruitmentKeys.all, 'applicant', id] as const,
  pipelineStages: (tenantId: string) => [...recruitmentKeys.all, 'pipeline-stages', tenantId] as const,
  publicJob: (slug: string) => [...recruitmentKeys.all, 'public-job', slug] as const,
  publicJobs: (tenantSlug: string, search?: string) =>
    [...recruitmentKeys.all, 'public-jobs', tenantSlug, search ?? ''] as const,
};
