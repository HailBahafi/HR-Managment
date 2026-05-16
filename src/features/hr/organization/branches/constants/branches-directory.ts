import type { BranchResponseDto } from '@/features/hr/organization/lib/api/branches';

export type BranchRow = {
  id: string;
  name: string;
  city: string;
  manager: string;
  employeesCount: number;
};

export type BranchDraftForm = {
  name: string;
  city: string;
};

export const BRANCH_EMPTY_FORM: BranchDraftForm = { name: '', city: '' };

export function mapBranchResponse(branch: BranchResponseDto): BranchRow {
  return {
    id: branch.id,
    name: branch.nameAr,
    city: branch.city ?? '',
    manager: branch.managerName ?? '',
    employeesCount: 0,
  };
}

export function newBranchId(): string {
  return `br-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
