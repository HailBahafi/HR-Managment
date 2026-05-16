import type { HRRequestSubmissionRecord, HRRequestTemplateEntity } from '@/features/hr/requests/lib/types';
import { deriveSubmissionApprovalSummary } from '@/features/hr/requests/lib/types';
import { REQUEST_APPROVAL_TAB_ORDER } from '@/features/hr/requests/general/constants/general-requests-ui';

export function submissionCreatedYmd(s: HRRequestSubmissionRecord): string {
  const raw = s.createdAt;
  if (typeof raw === 'string' && raw.length >= 10) return raw.slice(0, 10);
  try {
    return new Date(raw as string).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export function submissionApprovalTab(
  s: HRRequestSubmissionRecord,
): (typeof REQUEST_APPROVAL_TAB_ORDER)[number] {
  const ap = s.approvalSnapshot;
  if (!ap?.stages?.length) return 'no_approval';
  const sum = deriveSubmissionApprovalSummary(ap);
  if (!sum) return 'no_approval';
  return sum.overall;
}

export function formatFieldSummary(
  record: HRRequestSubmissionRecord,
  template: HRRequestTemplateEntity | undefined,
): string {
  if (!template) return '—';
  const sorted = [...template.formFields].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 2);
  return (
    sorted
      .map((f) => {
        const v = record.fieldValues[f.id];
        if (v === undefined || v === null || v === '') return null;
        if (typeof v === 'boolean') return `${f.labelAr}: ${v ? 'نعم' : 'لا'}`;
        if (typeof v === 'object') return `${f.labelAr}: ${JSON.stringify(v).slice(0, 30)}`;
        return `${f.labelAr}: ${String(v).slice(0, 40)}`;
      })
      .filter(Boolean)
      .join(' · ') || '—'
  );
}
