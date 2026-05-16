export type BranchAccess = {
  branchId: string;
  permissions: string[];
  deniedPermissions: string[];
};

export type CompanyAccess = {
  companyId: string;
  permissions: string[];
  deniedPermissions: string[];
  branches: BranchAccess[];
};

export type AccessProfile = {
  userId: string;
  defaultCompanyId: string | null;
  defaultBranchId: string | null;
  companies: CompanyAccess[];
};

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
};
