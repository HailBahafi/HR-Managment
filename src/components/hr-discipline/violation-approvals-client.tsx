'use client';

import * as React from 'react';
import { CheckCircle2, XCircle, Edit3 } from 'lucide-react';
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

  const queue = cases.filter(c => c.status === 'under_review' && c.requiredApprovers[c.currentApprovalIndex] === role);

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
    <div className="space-y-4">
      {queue.length === 0 ? (
        <EmptyState title="لا توجد قضايا منتظرة" description={`لا يوجد قضايا بانتظار اعتماد دور: ${ROLE_OPTIONS.find(r => r.value === role)?.label}`} />
      ) : (
        <div className="space-y-3">
          {queue.map(c => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold">{c.caseNumber}</span>
                    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', CASE_STATUS_COLORS[c.status])}>
                      {CASE_STATUS_LABELS[c.status]}
                    </span>
                  </div>
                  <div className="mt-1 font-medium">{c.employeeNameAr}</div>
                  <div className="text-xs text-muted-foreground">{c.typeNameAr} · {c.date}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1.5" onClick={() => handleApprove(c)}>
                    <CheckCircle2 className="h-4 w-4" />موافقة
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5" onClick={() => { setRejectNote(''); setRejectModal({ caseId: c.id, caseNumber: c.caseNumber }); }}>
                    <XCircle className="h-4 w-4" />رفض
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setEditNote(''); setEditModal({ caseId: c.id, caseNumber: c.caseNumber }); }}>
                    <Edit3 className="h-4 w-4" />طلب تعديل
                  </Button>
                </div>
              </div>
              {c.description && <p className="text-sm text-muted-foreground border-t border-border pt-2">{c.description}</p>}
              {c.approvalLog.length > 0 && (
                <div className="text-xs text-muted-foreground border-t border-border pt-2">
                  <span className="font-medium">آخر إجراء: </span>
                  {c.approvalLog[c.approvalLog.length - 1]?.role} – {c.approvalLog[c.approvalLog.length - 1]?.action}
                </div>
              )}
            </div>
          ))}
        </div>
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
