export const REQUEST_APPROVAL_TAB_ORDER = ['in_progress', 'approved', 'rejected', 'no_approval'] as const;

export const REQUEST_APPROVAL_TAB_LABELS: Record<string, string> = {
  in_progress: 'قيد الموافقة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  no_approval: 'بدون مسار موافقات',
};

export const ACTING_REVIEWER_STORAGE = 'hr-requests-acting-reviewer-id';
