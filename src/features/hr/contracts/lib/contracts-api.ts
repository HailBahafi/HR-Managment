import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

// ─── Shared enums ────────────────────────────────────────────────────────────

export type ContractNature = 'indefinite' | 'fixed_term' | 'task_based' | 'temporary' | 'seasonal';
export type WorkArrangement = 'full_time' | 'part_time' | 'flexible';
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'archived';

// ─── Contract Templates ───────────────────────────────────────────────────────

export type ApiTemplateAllowanceLine = {
  id: string;
  allowanceTypeId: string;
  allowanceTypeCode: string;
  allowanceTypeNameAr: string;
  amount: string;
  sortOrder: number;
};

export type ApiContractTemplate = {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  defaultContractNature: ContractNature;
  defaultWorkArrangement: WorkArrangement;
  defaultProbationDays: number;
  defaultAnnualLeaveDays: number;
  suggestedBaseSalary: string;
  currency: string;
  durationMonths: number;
  allowancesHint: string;
  sortOrder: number;
  isActive: boolean;
  allowanceLines: ApiTemplateAllowanceLine[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type CreateContractTemplateDto = {
  companyId: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  defaultContractNature?: ContractNature;
  defaultWorkArrangement?: WorkArrangement;
  defaultProbationDays?: number;
  defaultAnnualLeaveDays?: number;
  suggestedBaseSalary?: number;
  currency?: string;
  durationMonths?: number;
  allowancesHint?: string;
  sortOrder?: number;
  isActive?: boolean;
  allowanceLines?: { allowanceTypeId: string; amount: number; sortOrder?: number }[];
  createdBy?: string;
};

export type UpdateContractTemplateDto = Partial<Omit<CreateContractTemplateDto, 'companyId' | 'createdBy'>> & {
  updatedBy?: string;
};

export const contractTemplatesApi = {
  list: (params?: {
    companyId?: string;
    isActive?: boolean;
    defaultContractNature?: string;
    defaultWorkArrangement?: string;
    page?: number;
    limit?: number;
  }) =>
    apiRequest<PaginatedResult<ApiContractTemplate>>('/payroll/contract-templates', {
      query: params as Record<string, string | number | boolean | null | undefined>,
    }),

  get: (id: string) =>
    apiRequest<ApiContractTemplate>(`/payroll/contract-templates/${id}`),

  create: (body: CreateContractTemplateDto) =>
    apiRequest<ApiContractTemplate>('/payroll/contract-templates', { method: 'POST', body }),

  update: (id: string, body: UpdateContractTemplateDto) =>
    apiRequest<ApiContractTemplate>(`/payroll/contract-templates/${id}`, { method: 'PATCH', body }),

  delete: (id: string) =>
    apiRequest<void>(`/payroll/contract-templates/${id}`, { method: 'DELETE' }),
};

// ─── Contract Articles ────────────────────────────────────────────────────────

export type ApiContractArticle = {
  id: string;
  companyId: string;
  code: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  isBasic: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type CreateContractArticleDto = {
  companyId: string;
  code: string;
  titleAr: string;
  titleEn?: string;
  bodyAr?: string;
  bodyEn?: string;
  isBasic?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  createdBy?: string;
};

export type UpdateContractArticleDto = Partial<Omit<CreateContractArticleDto, 'companyId' | 'createdBy'>> & {
  updatedBy?: string;
};

export const contractArticlesApi = {
  list: (params?: {
    companyId?: string;
    isBasic?: boolean;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) =>
    apiRequest<PaginatedResult<ApiContractArticle>>('/payroll/contract-articles', {
      query: params as Record<string, string | number | boolean | null | undefined>,
    }),

  get: (id: string) =>
    apiRequest<ApiContractArticle>(`/payroll/contract-articles/${id}`),

  create: (body: CreateContractArticleDto) =>
    apiRequest<ApiContractArticle>('/payroll/contract-articles', { method: 'POST', body }),

  update: (id: string, body: UpdateContractArticleDto) =>
    apiRequest<ApiContractArticle>(`/payroll/contract-articles/${id}`, { method: 'PATCH', body }),

  delete: (id: string) =>
    apiRequest<void>(`/payroll/contract-articles/${id}`, { method: 'DELETE' }),
};

// ─── Employee Contracts ───────────────────────────────────────────────────────

export type ApiContractAllowanceLine = {
  id: string;
  allowanceTypeId: string;
  allowanceTypeCode: string;
  allowanceTypeNameAr: string;
  amount: string;
  sortOrder: number;
};

export type ApiContractArticleRef = {
  id: string;
  contractArticleId: string;
  articleCode: string;
  titleAr: string;
  sortOrder: number;
};

export type ApiEmployeeContract = {
  id: string;
  companyId: string;
  branchId: string | null;
  branchNameAr: string;
  employeeId: string;
  employeeNameAr: string;
  contractNumber: string;
  contractTemplateId: string | null;
  contractTemplateCode: string;
  contractNature: ContractNature;
  workArrangement: WorkArrangement;
  startDate: string;
  endDate: string;
  probationDays: number;
  annualLeaveDays: number;
  baseSalary: string;
  currency: string;
  status: ContractStatus;
  allowancesNote: string | null;
  deductionsNote: string | null;
  amendsContractId: string | null;
  supersededByContractId: string | null;
  earlyTerminationReason: string | null;
  signedAt: string | null;
  terminatedAt: string | null;
  allowanceLines: ApiContractAllowanceLine[];
  articles: ApiContractArticleRef[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateEmployeeContractDto = {
  companyId: string;
  employeeId: string;
  branchId?: string;
  contractTemplateId?: string;
  applyTemplateDefaults?: boolean;
  includeBasicArticles?: boolean;
  contractNumber?: string;
  contractNature?: ContractNature;
  workArrangement?: WorkArrangement;
  startDate: string;
  endDate?: string;
  probationDays?: number;
  annualLeaveDays?: number;
  baseSalary: number;
  currency?: string;
  status?: ContractStatus;
  allowancesNote?: string;
  deductionsNote?: string;
  amendsContractId?: string;
  articleIds?: string[];
  allowanceLines?: { allowanceTypeId: string; amount: number; sortOrder?: number }[];
  createdBy?: string;
};

export type UpdateEmployeeContractDto = {
  branchId?: string | null;
  contractNature?: ContractNature;
  workArrangement?: WorkArrangement;
  startDate?: string;
  endDate?: string;
  probationDays?: number;
  annualLeaveDays?: number;
  baseSalary?: number;
  currency?: string;
  status?: ContractStatus;
  allowancesNote?: string | null;
  deductionsNote?: string | null;
  earlyTerminationReason?: string | null;
  articleIds?: string[];
  allowanceLines?: { allowanceTypeId: string; amount: number; sortOrder?: number }[];
  updatedBy?: string;
};

export const employeeContractsApi = {
  list: (params?: {
    companyId?: string;
    employeeId?: string;
    branchId?: string;
    contractTemplateId?: string;
    status?: string;
    contractNature?: string;
    workArrangement?: string;
    contractNumber?: string;
    page?: number;
    limit?: number;
  }) =>
    apiRequest<PaginatedResult<ApiEmployeeContract>>('/payroll/contracts', {
      query: params as Record<string, string | number | boolean | null | undefined>,
    }),

  get: (id: string) =>
    apiRequest<ApiEmployeeContract>(`/payroll/contracts/${id}`),

  create: (body: CreateEmployeeContractDto) =>
    apiRequest<ApiEmployeeContract>('/payroll/contracts', { method: 'POST', body }),

  update: (id: string, body: UpdateEmployeeContractDto) =>
    apiRequest<ApiEmployeeContract>(`/payroll/contracts/${id}`, { method: 'PATCH', body }),

  delete: (id: string) =>
    apiRequest<void>(`/payroll/contracts/${id}`, { method: 'DELETE' }),
};
