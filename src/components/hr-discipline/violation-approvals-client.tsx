'use client';

import * as React from 'react';
import { CheckCircle2, XCircle, Edit3, Clock, CheckCheck, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { usePageFilters } from '@/components/filter-panel-context';
import { EmptyState } from '@/components/hr-requests/shared-ui';
import { useHRViolationCasesStore } from '@/lib/hr-discipline/violation-cases-store';
import type { HRApproverRole, HRViolationCaseRecord } from '@/lib/hr-discipline/types';
import { CASE_STATUS_COLORS, CASE_STATUS_LABELS } from '@/lib/hr-discipline/types';
import { cn } from '@/lib/utils';

const ROLE_OPTIONS: { value: HRApproverRole; label: string }[] = [
  { value: 'manager', label: 'مدير مباشر' },
  { value: 'hr', label: 'موارد بشرية' },
  { value: 'executive', label: 'تنفيذي' },
];

const ACTION_LABELS: Record<string, string> = {
  approved: 'تمت الموافقة',
  rejected: 'مرفوض',
  edit_requested: 'طُلب تعديل',
};

function CaseCard({
  c, actions,
}: {
  c: HRViolationCaseRecord;
  actions?: React.ReactNode;
}) {
  const lastLog = c.approvalLog[c.approvalLog.length - 1];
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold">{c.caseNumber}</span>
            <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', CASE_STATUS_COLORS[c.status])}>
              {CASE_STATUS_LABELS[c.status]}
            </span>
            {c.requiredApprovers.length > 1 && (
              <span className="text-[10px] text-muted-foreground">
                مرحلة {c.currentApprovalIndex + 1} / {c.requiredApprovers.length}
              </span>
            )}
          </div>
          <div className="mt-1 font-medium">{c.employeeNameAr}</div>
          <div className="text-xs text-muted-foreground">{c.typeNameAr} · {c.date}</div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {c.description && <p className="text-sm text-muted-foreground border-t border-border pt-2">{c.description}</p>}
      {lastLog && (
        <div className="text-xs text-muted-foreground border-t border-border pt-2 flex gap-1">
          <span className="font-medium">آخر إجراء:</span>
          <span>{ROLE_OPTIONS.find(r => r.value === lastLog.role)?.label ?? lastLog.role}</span>
          <span>–</span>
          <span>{ACTION_LABELS[lastLog.action] ?? lastLog.action}</span>
          {lastLog.note && <span className="text-foreground/60">({lastLog.note})</span>}
        </div>
      )}
    </div>
  );
}

export function ViolationApprovalsClient() {
  const { cases, approve, reject, requestEdit } = useHRViolationCasesStore();
  const { values } = usePageFilters([
    { key: 'role', label: 'الدور', type: 'select', options: ROLE_OPTIONS },
  ]);
  const role = ((values.role as HRApproverRole) || 'manager');
  const [editModal, setEditModal] = React.useState<{ caseId: string; caseNumber: string } | null>(null);
  const [editNote, setEditNote] = React.useState('');
  const [rejectModal, setRejectModal] = React.useState<{ caseId: string; caseNumber: string } | null>(null);
  const [rejectNote, setRejectNote] = React.useState('');

  /* active: waiting for this role's action */
  const activeQueue = cases.filter(
    c => c.status === 'under_review' && c.requiredApprovers[c.currentApprovalIndex] === role,
  );

  /* processed: this role already took an action (approved / rejected / edit_requested) */
  const processedQueue = cases.filter(
    c => c.approvalLog.some(l => l.role === role),
  );

  const handleApprove = (c: HRViolationCaseRecord) => {
    const res = approve(c.id, role);
    if (res.ok) toast.success(`تمت الموافقة على ${c.caseNumber}`);
    else toast.error(res.error ?? 'خطأ');
  };

  const handleReject = () => {
    if (!rejectModal) return;
    const res = reject(rejectModal.caseId, role, rejectNote);
    if (res.ok) toast.success('تم رفض القضية');
    else toast.error(res.error ?? 'خطأ');
    setRejectModal(null);
    setRejectNote('');
  };

  const handleRequestEdit = () => {
    if (!editModal) return;
    if (!editNote.trim()) { toast.error('ملاحظة التعديل مطلوبة'); return; }
    const res = requestEdit(editModal.caseId, role, editNote);
    if (res.ok) toast.success('تم إرسال طلب التعديل');
    else toast.error(res.error ?? 'خطأ');
    setEditModal(null);
    setEditNote('');
  };

  return (
    <div className="space-y-6">

      {/* ── Active queue ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-sm">
            بانتظار الاعتماد
            <span className="ms-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {activeQueue.length}
            </span>
          </h3>
        </div>

        {activeQueue.length === 0 ? (
          <EmptyState title="لا توجد قضايا منتظرة" description={`لا يوجد قضايا بانتظار اعتماد دور: ${ROLE_OPTIONS.find(r => r.value === role)?.label}`} />
        ) : (
          <div className="space-y-3">
            {activeQueue.map(c => (
              <CaseCard key={c.id} c={c} actions={
                <>
                  <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1.5" onClick={() => handleApprove(c)}>
                    <CheckCircle2 className="h-4 w-4" />موافقة
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5" onClick={() => { setRejectNote(''); setRejectModal({ caseId: c.id, caseNumber: c.caseNumber }); }}>
                    <XCircle className="h-4 w-4" />رفض
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setEditNote(''); setEditModal({ caseId: c.id, caseNumber: c.caseNumber }); }}>
                    <Edit3 className="h-4 w-4" />طلب تعديل
                  </Button>
                </>
              } />
            ))}
          </div>
        )}
      </section>

      {/* ── Processed by this role ── */}
      {processedQueue.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCheck className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-muted-foreground">
              المعالجة سابقًا بواسطة هذا الدور
              <span className="ms-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                {processedQueue.length}
              </span>
            </h3>
          </div>
          <div className="space-y-3 opacity-70">
            {processedQueue.map(c => {
              const myLog = c.approvalLog.find(l => l.role === role);
              const icon = myLog?.action === 'approved'
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                : myLog?.action === 'rejected'
                ? <Ban className="h-4 w-4 text-red-500" />
                : <Edit3 className="h-4 w-4 text-muted-foreground" />;
              return (
                <CaseCard key={c.id} c={c} actions={
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {icon}
                    {ACTION_LABELS[myLog?.action ?? ''] ?? myLog?.action}
                  </span>
                } />
              );
            })}
          </div>
        </section>
      )}

      {/* Reject Modal */}
      <Dialog open={!!rejectModal} onOpenChange={v => !v && setRejectModal(null)}>
        <DialogContent className="sm:max-w-sm border-border">
          <DialogHeader><DialogTitle>رفض القضية {rejectModal?.caseNumber}</DialogTitle></DialogHeader>
          <Input value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="سبب الرفض (اختياري)…" />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectModal(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleReject}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Edit Modal */}
      <Dialog open={!!editModal} onOpenChange={v => !v && setEditModal(null)}>
        <DialogContent className="sm:max-w-sm border-border">
          <DialogHeader><DialogTitle>طلب تعديل {editModal?.caseNumber}</DialogTitle></DialogHeader>
          <Input value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="ملاحظة التعديل المطلوب…" />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditModal(null)}>إلغاء</Button>
            <Button onClick={handleRequestEdit}>إرسال الطلب</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
