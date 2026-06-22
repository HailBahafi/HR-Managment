import type { UnifiedLeaveRecord } from '@/features/hr/leaves/unified-management/types';
import { canEmployeeActOnRequestApproval } from '@/features/hr/requests/lib/request-approver-states';

export function canActOnLeave(
  leave: UnifiedLeaveRecord,
  employeeId?: string | null,
): boolean {
  return leave.status === 'pending' && canEmployeeActOnRequestApproval(leave.approverStates, employeeId);
}

export function getApprovalStage(
  leave: UnifiedLeaveRecord,
): 'fully_approved' | 'awaiting_first' | 'awaiting_second' | 'awaiting_third' | 'other' {
  if (leave.status === 'approved') return 'fully_approved';
  if (leave.status !== 'pending') return 'other';

  const approvers = leave.approverStates?.approvers;
  if (!approvers?.length) return 'awaiting_first';

  const sorted = [...approvers].sort((a, b) => a.sortOrder - b.sortOrder);
  const pendingIdx = sorted.findIndex((a) => a.status === 'pending');
  if (pendingIdx < 0) return 'other';
  if (pendingIdx === 0) return 'awaiting_first';
  if (pendingIdx === 1) return 'awaiting_second';
  if (pendingIdx === 2) return 'awaiting_third';
  return 'other';
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'سنوية', sick: 'مرضية', unpaid: 'بدون راتب', maternity: 'أمومة', emergency: 'طارئة',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار', approved: 'موافق عليه', rejected: 'مرفوض', cancelled: 'ملغاة',
};
