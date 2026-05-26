import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type RoleResponseDto = {
  id: string;
  name: string;
  description: string | null;
  companyId: string | null;
  applicationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RoleListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
};

export const rolesApi = {
  getAll(query?: RoleListQuery) {
    return apiRequest<PaginatedResult<RoleResponseDto>>('/roles', { query });
  },
  getById(id: string) {
    return apiRequest<RoleResponseDto>(`/roles/${id}`);
  },
};
