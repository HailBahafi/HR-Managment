import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type UserCompanyLink = {
  id: string;
  companyId: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserBranchLink = {
  id: string;
  branchId: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserResponseDto = {
  id: string;
  email: string;
  phone: string | null;
  fullNameAr: string | null;
  fullNameEn: string | null;
  avatarUrl: string | null;
  userType: string | null;
  defaultCompanyId: string | null;
  defaultBranchId: string | null;
  companies: UserCompanyLink[];
  branches: UserBranchLink[];
  isActive: boolean;
  isVerified: boolean;
  status: string;
  canSignIn: boolean;
  languageCode: string | null;
  timezone: string | null;
  lastLoginAt: string | null;
  notes: string | null;
  employeeId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserDto = {
  email: string;
  password: string;
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  phone?: string | null;
  userType?: string | null;
  isActive?: boolean;
  notes?: string | null;
  defaultCompanyId?: string | null;
  employeeId?: string | null;
};

export type UpdateUserDto = {
  email?: string;
  phone?: string | null;
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  userType?: string | null;
  isActive?: boolean;
  notes?: string | null;
  defaultCompanyId?: string | null;
  employeeId?: string | null;
};

export type UsersListQuery = {
  page?: number;
  limit?: number;
};

export const usersApi = {
  getAll(query?: UsersListQuery) {
    return apiRequest<PaginatedResult<UserResponseDto>>('/users', { query });
  },
  getById(id: string) {
    return apiRequest<UserResponseDto>(`/users/${id}`);
  },
  create(payload: CreateUserDto) {
    return apiRequest<UserResponseDto>('/users', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateUserDto) {
    return apiRequest<UserResponseDto>(`/users/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/users/${id}`, { method: 'DELETE' });
  },
};
