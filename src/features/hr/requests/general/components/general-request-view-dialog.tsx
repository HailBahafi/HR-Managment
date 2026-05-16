'use client';

import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { HRRequestSubmissionRecord, HRRequestTemplateEntity } from '@/features/hr/requests/lib/types';
import {
  approvalStageModeLabelAr,
  approvalStageStateLabelAr,
  getPerStageApprovalUi,
} from '@/features/hr/requests/lib/types';
import { cn } from '@/shared/utils';

export type GeneralRequestViewDialogProps = {
  record: HRRequestSubmissionRecord | null;
  template: HRRequestTemplateEntity | undefined;
  actingReviewerId: string;
  onOpenChange: (open: boolean) => void;
  onApprovalStage: (submissionId: string, stageIndex: number, state: 'approved' | 'rejected') => void;
};

export function GeneralRequestViewDialog({
  record: viewRecord,
  template: viewTemplate,
  actingReviewerId,
  onOpenChange,
  onApprovalStage,
}: GeneralRequestViewDialogProps) {
  return (
    <Dialog open={!!viewRecord} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border-border p-0">
        <div className="shrink-0 border-b border-border px-6 py-5">
          <DialogHeader>
            <DialogTitle>{viewRecord?.requestTypeNameAr}</DialogTitle>
            <DialogDescription>
              {viewRecord?.employeeNameAr} · {viewRecord?.departmentNameAr}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {viewRecord?.approvalSnapshot && viewRecord.approvalSnapshot.stages.length > 0 && (() => {
            const vPer = getPerStageApprovalUi(viewRecord.approvalSnapshot, actingReviewerId || undefined);
            return (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">مسار الموافقات</p>
                <p className="text-[11px] text-muted-foreground">
                  {viewRecord.approvalSnapshot.assignmentTemplateNameAr}
                </p>
                <ul className="space-y-2">
                  {viewRecord.approvalSnapshot.stages.map((st, idx) => {
                    const stateLabel = approvalStageStateLabelAr(st.state);
                    const rowUi = vPer[idx];
                    return (
                      <li
                        key={st.stageId}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-sm',
                          st.state === 'approved' && 'border-success/30 bg-success/5',
                          st.state === 'rejected' && 'border-destructive/40 bg-destructive/5',
                          st.state === 'pending' && 'border-border bg-muted/30',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">المرحلة {idx + 1}</span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              st.state === 'approved' && 'bg-success/15 text-success',
                              st.state === 'rejected' && 'bg-destructive/15 text-destructive',
                              st.state === 'pending' && 'bg-muted text-muted-foreground',
                            )}
                          >
                            {stateLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {st.approverNamesAr.join('، ') || '—'}
                        </p>
                        <p className="text-[9px] text-muted-foreground/80 mt-0.5">
                          نوع المرحلة: {approvalStageModeLabelAr(st.mode)}
                        </p>
                        {rowUi?.showActionRow && st.state === 'pending' && rowUi.disabledHintAr && !rowUi.canAct && (
                          <p className="mt-1.5 text-[10px] text-muted-foreground leading-snug">
                            {rowUi.disabledHintAr}
                          </p>
                        )}
                        {rowUi?.showActionRow && st.state === 'pending' && viewRecord && (
                          <div className="mt-2 flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={!rowUi.canAct}
                              className="h-8 flex-1 gap-1 border-success/40 text-success hover:bg-success/10 disabled:opacity-40"
                              onClick={() => rowUi.canAct && onApprovalStage(viewRecord.id, idx, 'approved')}
                            >
                              <Check className="h-3.5 w-3.5" /> موافقة
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={!rowUi.canAct}
                              className="h-8 flex-1 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                              onClick={() => rowUi.canAct && onApprovalStage(viewRecord.id, idx, 'rejected')}
                            >
                              <X className="h-3.5 w-3.5" /> رفض
                            </Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })()}
          {viewRecord && (() => {
            const fields = viewTemplate?.formFields ?? [];
            const sorted = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);
            if (sorted.length === 0) return <p className="text-sm text-muted-foreground">لا توجد حقول</p>;
            return (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">بيانات النموذج</p>
                {sorted.map((f) => {
                  const v = viewRecord.fieldValues[f.id];
                  const display =
                    v === undefined || v === null
                      ? '—'
                      : typeof v === 'boolean'
                        ? v
                          ? 'نعم'
                          : 'لا'
                        : Array.isArray(v)
                          ? (v as string[]).join('، ')
                          : String(v);
                  return (
                    <div key={f.id} className="flex flex-col gap-0.5 rounded-lg bg-muted/30 px-3 py-2.5">
                      <p className="text-[11px] font-medium text-muted-foreground">{f.labelAr}</p>
                      <p className="text-sm font-medium">{display || '—'}</p>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
