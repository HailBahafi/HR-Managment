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

export function newBranchId(): string {
  return `br-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
