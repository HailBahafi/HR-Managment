'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { mapRecruitmentApplicant, mapRecruitmentForm, mapRecruitmentJob, mapRecruitmentJobDetail } from '@/features/hr/recruitment/lib/api/mappers';
import { normalizeRecruitmentPaginated } from '@/features/hr/recruitment/lib/api/normalize-paginated';
import { recruitmentKeys } from '@/features/hr/recruitment/hooks/recruitment-query-keys';
import { useRecruitmentTenantId } from '@/features/hr/recruitment/hooks/useRecruitmentTenantId';
import type {
  CreateRecruitmentApplicantDto,
  CreateRecruitmentJobDto,
  CreateRecruitmentTenantDto,
  CreateRecruitmentUserDto,
  ListRecruitmentApplicantsQuery,
  ListRecruitmentTenantsQuery,
  ListRecruitmentUsersQuery,
  MoveApplicantStageDto,
  UpdateRecruitmentApplicantDto,
  UpdateRecruitmentJobDto,
  UpdateRecruitmentPipelineStagesDto,
  UpdateRecruitmentTenantDto,
  UpdateRecruitmentUserDto,
  RecruitmentJob,
  RecruitmentApplicant,
} from '@/features/hr/recruitment/lib/api/types';
import {
  recruitmentApi,
  recruitmentTenantsApi,
  recruitmentUsersApi,
} from '@/features/hr/recruitment/lib/api/recruitment';
import type { AtsForm, AtsPipelineStage } from '@/features/hr/recruitment/lib/ats/types';

export function useRecruitmentJobsList(search?: string) {
  const tenantId = useRecruitmentTenantId();
  return useQuery({
    queryKey: recruitmentKeys.jobs(tenantId ?? '', search),
    queryFn: async () => {
      const raw = await recruitmentApi.listJobs({ tenantId: tenantId!, limit: 200, search });
      const res = normalizeRecruitmentPaginated<RecruitmentJob>(raw);
      return {
        jobs: res.items.map((item) => mapRecruitmentJob(item)),
        pagination: res.pagination,
      };
    },
    enabled: !!tenantId,
  });
}

/** Fetches application forms for jobs (list endpoint returns jobs without embedded form). */
export function useRecruitmentJobFormsMap(jobIds: string[]) {
  const stableIds = [...new Set(jobIds.filter(Boolean))].sort();
  const results = useQueries({
    queries: stableIds.map((jobId) => ({
      queryKey: recruitmentKeys.jobForm(jobId),
      queryFn: async () => mapRecruitmentForm(await recruitmentApi.getFormByJobId(jobId)),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const forms = results.map((r) => r.data).filter((f): f is AtsForm => !!f);
  const formById = new Map(forms.map((f) => [f.id, f]));
  const formByJobId = new Map(forms.map((f) => [f.jobId, f]));

  return {
    forms,
    formById,
    formByJobId,
    isLoading: results.some((r) => r.isLoading),
  };
}

export function useRecruitmentApplicantsList(query: Omit<ListRecruitmentApplicantsQuery, 'tenantId'>) {
  const tenantId = useRecruitmentTenantId();
  const filters = { ...query };
  return useQuery({
    queryKey: recruitmentKeys.applicants(tenantId ?? '', filters),
    queryFn: async () => {
      const raw = await recruitmentApi.listApplicants({ tenantId: tenantId!, limit: 500, ...query });
      const res = normalizeRecruitmentPaginated<RecruitmentApplicant>(raw);
      return res.items.map(mapRecruitmentApplicant);
    },
    enabled: !!tenantId,
  });
}

export function useRecruitmentJobDetail(jobId: string | undefined) {
  return useQuery({
    queryKey: recruitmentKeys.job(jobId ?? ''),
    queryFn: async () => mapRecruitmentJobDetail(await recruitmentApi.getJob(jobId!)),
    enabled: !!jobId,
  });
}

export function useRecruitmentJobStats(jobId: string | undefined) {
  return useQuery({
    queryKey: recruitmentKeys.jobStats(jobId ?? ''),
    queryFn: () => recruitmentApi.getJobStats(jobId!),
    enabled: !!jobId,
  });
}

export function useRecruitmentApplicant(applicantId: string | undefined) {
  return useQuery({
    queryKey: recruitmentKeys.applicant(applicantId ?? ''),
    queryFn: async () => mapRecruitmentApplicant(await recruitmentApi.getApplicant(applicantId!)),
    enabled: !!applicantId,
  });
}

export function useRecruitmentJobPipeline(jobId: string | undefined) {
  return useQuery({
    queryKey: recruitmentKeys.jobPipeline(jobId ?? ''),
    queryFn: async () => {
      const pipeline = await recruitmentApi.getJobPipeline(jobId!);
      const mapped: Record<string, ReturnType<typeof mapRecruitmentApplicant>[]> = {};
      for (const [stage, apps] of Object.entries(pipeline)) {
        mapped[stage] = apps.map(mapRecruitmentApplicant);
      }
      return mapped as Record<AtsPipelineStage, ReturnType<typeof mapRecruitmentApplicant>[]>;
    },
    enabled: !!jobId,
  });
}

export function useRecruitmentPipelineStages() {
  const tenantId = useRecruitmentTenantId();
  return useQuery({
    queryKey: recruitmentKeys.pipelineStages(tenantId ?? ''),
    queryFn: () => recruitmentApi.listPipelineStages(tenantId!),
    enabled: !!tenantId,
  });
}

export function useRecruitmentTenantsList(query?: ListRecruitmentTenantsQuery) {
  return useQuery({
    queryKey: recruitmentKeys.tenants(query?.search),
    queryFn: async () => {
      const raw = await recruitmentTenantsApi.list({ limit: 200, ...query });
      return normalizeRecruitmentPaginated(raw).items;
    },
  });
}

export function useRecruitmentTenant(tenantId: string | undefined) {
  return useQuery({
    queryKey: recruitmentKeys.tenant(tenantId ?? ''),
    queryFn: () => recruitmentTenantsApi.getById(tenantId!),
    enabled: !!tenantId,
  });
}

export function useRecruitmentUsersList(query: Omit<ListRecruitmentUsersQuery, 'tenantId'>) {
  const tenantId = useRecruitmentTenantId();
  const filters = { ...query };
  return useQuery({
    queryKey: recruitmentKeys.users(tenantId ?? '', filters),
    queryFn: async () => {
      const raw = await recruitmentUsersApi.list({ tenantId: tenantId!, limit: 200, ...query });
      return normalizeRecruitmentPaginated(raw).items;
    },
    enabled: !!tenantId,
  });
}

export function useRecruitmentUser(userId: string | undefined) {
  return useQuery({
    queryKey: recruitmentKeys.user(userId ?? ''),
    queryFn: () => recruitmentUsersApi.getById(userId!),
    enabled: !!userId,
  });
}

export function useRecruitmentMutations() {
  const queryClient = useQueryClient();
  const tenantId = useRecruitmentTenantId();

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: recruitmentKeys.all });
  };

  const createJob = useMutation({
    mutationFn: (dto: CreateRecruitmentJobDto) => recruitmentApi.createJob(dto),
    onSuccess: invalidateAll,
  });

  const updateJob = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRecruitmentJobDto }) =>
      recruitmentApi.updateJob(id, dto),
    onSuccess: invalidateAll,
  });

  const deleteJob = useMutation({
    mutationFn: (id: string) => recruitmentApi.deleteJob(id),
    onSuccess: invalidateAll,
  });

  const toggleJobActive = useMutation({
    mutationFn: (id: string) => recruitmentApi.toggleJobActive(id),
    onSuccess: invalidateAll,
  });

  const moveApplicantStage = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: MoveApplicantStageDto }) =>
      recruitmentApi.moveApplicantStage(id, dto),
    onSuccess: invalidateAll,
  });

  const deleteApplicant = useMutation({
    mutationFn: (id: string) => recruitmentApi.deleteApplicant(id),
    onSuccess: invalidateAll,
  });

  const scoreApplicant = useMutation({
    mutationFn: (id: string) => recruitmentApi.scoreApplicant(id),
    onSuccess: invalidateAll,
  });

  const createApplicant = useMutation({
    mutationFn: (dto: CreateRecruitmentApplicantDto) => recruitmentApi.createApplicant(dto),
    onSuccess: invalidateAll,
  });

  const updateApplicant = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRecruitmentApplicantDto }) =>
      recruitmentApi.updateApplicant(id, dto),
    onSuccess: invalidateAll,
  });

  const updatePipelineStages = useMutation({
    mutationFn: (dto: UpdateRecruitmentPipelineStagesDto) => recruitmentApi.updatePipelineStages(dto),
    onSuccess: invalidateAll,
  });

  const createTenant = useMutation({
    mutationFn: (dto: CreateRecruitmentTenantDto) => recruitmentTenantsApi.create(dto),
    onSuccess: invalidateAll,
  });

  const updateTenant = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRecruitmentTenantDto }) =>
      recruitmentTenantsApi.update(id, dto),
    onSuccess: invalidateAll,
  });

  const deleteTenant = useMutation({
    mutationFn: (id: string) => recruitmentTenantsApi.delete(id),
    onSuccess: invalidateAll,
  });

  const createUser = useMutation({
    mutationFn: (dto: CreateRecruitmentUserDto) => recruitmentUsersApi.create(dto),
    onSuccess: invalidateAll,
  });

  const updateUser = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRecruitmentUserDto }) =>
      recruitmentUsersApi.update(id, dto),
    onSuccess: invalidateAll,
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => recruitmentUsersApi.delete(id),
    onSuccess: invalidateAll,
  });

  return {
    createJob,
    updateJob,
    deleteJob,
    toggleJobActive,
    createApplicant,
    updateApplicant,
    moveApplicantStage,
    deleteApplicant,
    scoreApplicant,
    updatePipelineStages,
    createTenant,
    updateTenant,
    deleteTenant,
    createUser,
    updateUser,
    deleteUser,
    tenantId,
  };
}
