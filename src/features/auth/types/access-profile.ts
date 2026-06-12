export type RoleAccess = {
  roleId: string;
  code: string;
  nameAr: string;
  nameEn: string;
};

export type BranchAccess = {
  branchId: string;
  isDefault?: boolean;
  roles?: RoleAccess[];
  permissions: string[];
  deniedPermissions: string[];
};

export type CompanyAccess = {
  companyId: string;
  isDefault?: boolean;
  roles?: RoleAccess[];
  permissions: string[];
  deniedPermissions: string[];
  branches: BranchAccess[];
};

export type AccessProfile = {
  userId: string;
  email?: string | null;
  phone?: string | null;
  defaultCompanyId: string | null;
  defaultBranchId: string | null;
  companies: CompanyAccess[];
};

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  avatarUrl?: string | null;
  userType?: string | null;
  positionAr?: string | null;
};

/** Primary role label for the active company (Arabic). */
export function getActiveRoleLabel(
  profile: AccessProfile | null,
  activeCompanyId: string | null,
): string | null {
  if (!profile || !activeCompanyId) return null;
  const company = profile.companies.find((c) => c.companyId === activeCompanyId);
  return company?.roles?.[0]?.nameAr ?? null;
}
