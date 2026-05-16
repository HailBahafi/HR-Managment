'use client';

import { Eye, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HRRequestSubmissionRecord, HRRequestTemplateEntity } from '@/features/hr/requests/lib/types';
import { deriveSubmissionApprovalSummary, getPerStageApprovalUi } from '@/features/hr/requests/lib/types';
import { cn, formatDateShort } from '@/shared/utils';
import { formatFieldSummary } from '@/features/hr/requests/general/utils/general-request-submission-helpers';

export type GeneralRequestSubmissionCardProps = {
  record: HRRequestSubmissionRecord;
  template: HRRequestTemplateEntity | undefined;
  actingReviewerId: string;
  onOpenView: (r: HRRequestSubmissionRecord) => void;
  onDelete: (id: string) => void;
  onApprovalStage: (submissionId: string, stageIndex: number, state: 'approved' | 'rejected') => void;
};

export function GeneralRequestSubmissionCard({
  record: r,
  template: tpl,
  actingReviewerId,
  onOpenView,
  onDelete,
  onApprovalStage,
}: GeneralRequestSubmissionCardProps) {
  const initial = r.employeeNameAr.charAt(0);
  const apSum = deriveSubmissionApprovalSummary(r.approvalSnapshot);
  const perStageUi = getPerStageApprovalUi(r.approvalSnapshot, actingReviewerId || undefined);
  const actionRows = perStageUi.filter((p) => p.showActionRow);
  const summary = formatFieldSummary(r, tpl);

  return (
    <div
      className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col cursor-pointer"
      onClick={() => onOpenView(r)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{r.employeeNameAr}</p>
            <p className="text-[10px] text-muted-foreground truncate">{r.departmentNameAr}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
          {r.requestTypeNameAr}
        </span>
        {summary !== '—' && (
          <span className="text-[11px] text-muted-foreground line-clamp-1">{summary}</span>
        )}
      </div>
      {apSum && (
        <div className="rounded-lg border border-border/60 bg-muted/25 px-2.5 py-2 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'text-[10px] font-semibold',
                apSum.overall === 'approved' && 'text-success',
                apSum.overall === 'rejected' && 'text-destructive',
                apSum.overall === 'in_progress' && 'text-primary',
              )}
            >
              {apSum.labelAr}
            </span>
            {apSum.totalStages > 0 && (
              <span
                className="shrink-0 text-[10px] text-muted-foreground tabular-nums"
                title="مراحل معتمدة / إجمالي المراحل"
              >
                {apSum.approvedStagesCount}/{apSum.totalStages}
              </span>
            )}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-[width]',
                apSum.overall === 'approved' && 'bg-success',
                apSum.overall === 'rejected' && 'bg-destructive',
                apSum.overall === 'in_progress' && 'bg-primary',
              )}
              style={{
                width:
                  apSum.totalStages > 0
                    ? `${Math.min(
                        100,
                        apSum.overall === 'rejected'
                          ? 100
                          : Math.round((apSum.approvedStagesCount / apSum.totalStages) * 100),
                      )}%`
                    : '0%',
              }}
            />
          </div>
          {apSum.detailAr ? (
            <p className="text-[10px] text-muted-foreground line-clamp-3 leading-snug">{apSum.detailAr}</p>
          ) : null}
        </div>
      )}
      {actionRows.length > 0 && (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          {actionRows.map((row) => (
            <div key={row.stageIndex} className="space-y-1">
              {r.approvalSnapshot && r.approvalSnapshot.stages.length >= 2 && (
                <p className="text-[10px] font-medium text-muted-foreground">
                  الموافقة {row.stageIndex + 1} من {r.approvalSnapshot.stages.length}
                </p>
              )}
              {row.state === 'approved' && (
                <p className="text-[10px] text-success">تمت الموافقة على هذه المرحلة</p>
              )}
              {row.state === 'rejected' && (
                <p className="text-[10px] text-destructive">مرفوضة هذه المرحلة</p>
              )}
              {row.state === 'pending' && row.disabledHintAr && !row.canAct && (
                <p className="text-[10px] text-muted-foreground leading-snug">{row.disabledHintAr}</p>
              )}
              {row.state === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!row.canAct}
                    className="h-8 flex-1 gap-1 border-success/40 text-success hover:bg-success/10 disabled:opacity-40"
                    onClick={() => row.canAct && onApprovalStage(r.id, row.stageIndex, 'approved')}
                  >
                    <Check className="h-3.5 w-3.5" /> موافقة
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!row.canAct}
                    className="h-8 flex-1 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                    onClick={() => row.canAct && onApprovalStage(r.id, row.stageIndex, 'rejected')}
                  >
                    <X className="h-3.5 w-3.5" /> رفض
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">{formatDateShort(r.createdAt)}</p>
      <div className="mt-auto flex gap-1 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" className="gap-1.5 flex-1" onClick={() => onOpenView(r)}>
          <Eye className="h-3.5 w-3.5" /> عرض
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={() => onDelete(r.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
