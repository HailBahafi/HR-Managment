import type { RequestApprovalTemplateResponseDto } from '@/features/hr/requests/lib/api/approval-templates';
import type { RequestApprovalMode } from '@/features/hr/requests/lib/api/approval-templates';
import type {
  RequestApproverEntryStatus,
  RequestApproverStateEntry,
  RequestApproverStatesCarrier,
  RequestApproverStatesSnapshot,
} from '@/features/hr/requests/lib/api/request-approver-states-types';
import {
  applyApproverDecision,
  approvalModeLabelAr,
  approverStatusLabelAr,
  buildApproverStatesFromAssignment,
  canEmployeeActOnApproval,
  getApproverActionContext,
  hasApprovalRejection,
  isEmployeeAmongApprovers,
  isEmployeeInApproverStates,
  isFullyApproved,
  normalizeApproverStates,
} from '@/shared/approval';
import { AR_APPROVAL_WORKFLOW_MESSAGES } from '@/shared/i18n/ar';

const REQUEST_MESSAGES = AR_APPROVAL_WORKFLOW_MESSAGES.request;

export function requestApproverStatusLabelAr(status: RequestApproverEntryStatus): string {
  return approverStatusLabelAr(status);
}

export function requestApprovalModeLabelAr(mode: RequestApprovalMode): string {
  return approvalModeLabelAr(mode);
}

export function isEmployeeAmongRequestApprovers(
  assignment: RequestApprovalTemplateResponseDto,
  employeeId: string,
): boolean {
  return isEmployeeAmongApprovers(assignment, employeeId);
}

export function normalizeRequestApproverStates(
  dto: RequestApproverStatesCarrier | null | undefined,
): RequestApproverStatesSnapshot | null {
  return normalizeApproverStates(dto) as RequestApproverStatesSnapshot | null;
}

export function buildRequestApproverStatesFromAssignment(
  assignment: RequestApprovalTemplateResponseDto,
): RequestApproverStatesSnapshot {
  return buildApproverStatesFromAssignment(assignment) as RequestApproverStatesSnapshot;
}

export function isRequestFullyApproved(states: RequestApproverStatesSnapshot): boolean {
  return isFullyApproved(states);
}

function hasRequestApprovalRejection(states: RequestApproverStatesSnapshot): boolean {
  return hasApprovalRejection(states);
}

export { hasRequestApprovalRejection };

export function getRequestApproverActionContext(
  states: RequestApproverStatesSnapshot,
  employeeId: string,
): { canAct: boolean; reasonAr: string | null } {
  return getApproverActionContext(states, employeeId, REQUEST_MESSAGES);
}

export function applyRequestApproverDecision(
  states: RequestApproverStatesSnapshot,
  employeeId: string,
  decision: 'approve' | 'reject',
  meta: { decidedBy: string | null; notes: string | null },
): RequestApproverStatesSnapshot {
  return applyApproverDecision(states, employeeId, decision, meta) as RequestApproverStatesSnapshot;
}

/** Payload لقرار موافقة/رفض طلب (حضور، إجازة، سلفة) */
export function buildRequestDecisionPayload(
  states: RequestApproverStatesSnapshot,
  employeeId: string,
  decision: 'approve' | 'reject',
  options: {
    decisionNotesAr?: string | null;
    updatedBy?: string | null;
  },
) {
  const notes = options.decisionNotesAr?.trim() || null;
  const updatedStates = applyRequestApproverDecision(states, employeeId, decision, {
    decidedBy: options.updatedBy ?? null,
    notes,
  });

  return {
    decision,
    approverStates: updatedStates,
    approverEmployeeId: employeeId,
    decidedByEmployeeId: employeeId,
    decisionNotesAr: notes ?? undefined,
    updatedBy: options.updatedBy ?? undefined,
  };
}

/** Payload قرار موافقة/رفض سلفة — يطابق API الرواتب */
export function buildEmployeeAdvanceDecisionPayload(
  states: RequestApproverStatesSnapshot,
  employeeId: string,
  decision: 'approve' | 'reject',
  options: {
    notes?: string | null;
    decidedBy?: string | null;
  },
) {
  const notes = options.notes?.trim() || undefined;
  const updatedStates = applyRequestApproverDecision(states, employeeId, decision, {
    decidedBy: options.decidedBy ?? null,
    notes: notes ?? null,
  });

  return {
    decision,
    approverStates: updatedStates,
    approverEmployeeId: employeeId,
    notes,
    decidedBy: options.decidedBy ?? undefined,
  };
}

/** @deprecated استخدم buildRequestDecisionPayload */
export const buildRequestCorrectionDecisionPayload = buildRequestDecisionPayload;

export function canEmployeeActOnRequestApproval(
  states: RequestApproverStatesSnapshot | null | undefined,
  employeeId: string | null | undefined,
): boolean {
  return canEmployeeActOnApproval(states, employeeId, REQUEST_MESSAGES);
}

export function isEmployeeInRequestApproverStates(
  states: RequestApproverStatesSnapshot | null | undefined,
  employeeId: string | null | undefined,
): boolean {
  return isEmployeeInApproverStates(states, employeeId);
}

export type { RequestApproverStateEntry };
