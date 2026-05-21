import {
  jobTitlesApi,
  type CreateJobTitleDto,
  type JobTitleResponseDto,
  type UpdateJobTitleDto,
} from '@/features/hr/organization/lib/api/jobTitles';
import { departmentsApi } from '@/features/hr/organization/lib/api/departments';
import { resolveOrganizationScope, type OrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import type { DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';

export type JobTitleTemplateRecord = {
  id: string;
  titleAr: string;
  descriptionAr?: string;
  defaultDepartmentId?: string | null;
  sortOrder: number;
  updatedAt: string;
};

export type JobTitlesDirectoryData = {
  templates: JobTitleTemplateRecord[];
  departments: DepartmentResponseDto[];
  scope: OrganizationScope;
};

function mapTemplate(row: JobTitleResponseDto, index: number): JobTitleTemplateRecord {
  return {
    id: row.id,
    titleAr: row.nameAr,
    descriptionAr: row.description ?? undefined,
    defaultDepartmentId: null,
    sortOrder: index + 1,
    updatedAt: row.updatedAt,
  };
}

export async function loadJobTitlesDirectory(): Promise<JobTitlesDirectoryData> {
  const [jobs, deps, scope] = await Promise.all([
    jobTitlesApi.getAll(),
    departmentsApi.getAll(),
    resolveOrganizationScope(),
  ]);
  return {
    templates: jobs.items.map(mapTemplate),
    departments: deps.items,
    scope: {
      companyId: scope.companyId ?? jobs.items[0]?.companyId ?? deps.items[0]?.companyId ?? null,
      branchId: scope.branchId,
    },
  };
}

export async function createJobTitle(payload: CreateJobTitleDto) {
  return jobTitlesApi.create(payload);
}

export async function updateJobTitle(id: string, payload: UpdateJobTitleDto) {
  return jobTitlesApi.update(id, payload);
}

export async function deleteJobTitle(id: string) {
  return jobTitlesApi.remove(id);
}
