import type { PermissionRoleColorToken } from '@/features/hr/permissions/constants/role-colors';

export type PermissionRole = {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: string[];
  color: PermissionRoleColorToken;
};
