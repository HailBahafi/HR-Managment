import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type AllowanceTypeResponseDto = {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  calculationType: 'fixed_amount' | 'percent_of_basic';
  typicalAmount: string | null;
  typicalPercent: string | null;
  currency: string;
  isTaxable: boolean;
  isIncludedInGosi: boolean;
  sortOrder: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAllowanceTypeDto = {
  companyId: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  calculationType?: 'fixed_amount' | 'percent_of_basic';
  typicalAmount?: number;
  typicalPercent?: number;
  currency?: string;
  isTaxable?: boolean;
  isIncludedInGosi?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  notes?: string;
};

export type UpdateAllowanceTypeDto = Omit<Partial<CreateAllowanceTypeDto>, 'companyId'>;

export const allowanceTypesApi = {
  list: (params?: { companyId?: string; isActive?: boolean; page?: number; limit?: number }) =>
    apiRequest<PaginatedResult<AllowanceTypeResponseDto>>('/payroll/allowance-types', { query: params }),
  get: (id: string) =>
    apiRequest<AllowanceTypeResponseDto>(`/payroll/allowance-types/${id}`),
  create: (body: CreateAllowanceTypeDto) =>
    apiRequest<AllowanceTypeResponseDto>('/payroll/allowance-types', { method: 'POST', body }),
  update: (id: string, body: UpdateAllowanceTypeDto) =>
    apiRequest<AllowanceTypeResponseDto>(`/payroll/allowance-types/${id}`, { method: 'PATCH', body }),
  delete: (id: string) =>
    apiRequest<void>(`/payroll/allowance-types/${id}`, { method: 'DELETE' }),
};
