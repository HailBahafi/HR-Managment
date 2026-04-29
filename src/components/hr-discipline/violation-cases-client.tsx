'use client';

import * as React from 'react';
import { Plus, Eye, Trash2, Send, CheckCircle2, XCircle, Edit3, ShieldAlert, CalendarDays, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePageFilters } from '@/components/filter-panel-context';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, SearchableDropdown,
} from '@/components/hr-requests/shared-ui';
import { useHRViolationCasesStore } from '@/lib/hr-discipline/violation-cases-store';
import { useHRViolationTypesStore } from '@/lib/hr-discipline/violation-types-store';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import type { HRViolationCaseRecord } from '@/lib/hr-discipline/types';
import { CASE_STATUS_LABELS, CASE_STATUS_COLORS } from '@/lib/hr-discipline/types';
import { cn } from '@/lib/utils';

interface DraftForm {
  employeeId: string; date: string; violationTypeId: string;
  description: string; notes: string; attachmentsNote: string;
}
const EMPTY: DraftForm = { employeeId: '', date: '', violationTypeId: '', description: '', notes: '', attachmentsNote: '' };

export function ViolationCasesClient() {
  const { cases, add, submit, remove, approve, reject, requestEdit } = useHRViolationCasesStore();
  const { types } = useHRViolationTypesStore();
  const { activeEmployees } = useHREmployeeDirectoryStore();

  const { values } = usePageFilters([{ key: 'q', label: 'بحث', type: 'text', placeholder: 'رقم الموظف…' }]);
  const q = (values.q as string) ?? '';
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [viewCase, setViewCase] = React.useState<HRViolationCaseRecord | null>(null);
  const [rejectModal, setRejectModal] = React.useState<HRViolationCaseRecord | null>(null);
  const [rejectNote, setRejectNote] = React.useState('');
  const [editModal, setEditModal] = React.useState<HRViolationCaseRecord | null>(null);
  const [editNote, setEditNote] = React.useState('');

  const handleApprove = (c: HRViolationCaseRecord) => {
    const role = c.requiredApprovers[c.currentApprovalIndex];
    if (!role) { toast.error('لا يوجد دور معتمد للقضية'); return; }
    const res = approve(c.id, role);
    if (res.ok) toast.success(`تمت الموافقة على ${c.caseNumber}`);
    else toast.error(res.error ?? 'خطأ');
  };

  const handleReject = () => {
    if (!rejectModal) return;
    const role = rejectModal.requiredApprovers[rejectModal.currentApprovalIndex];
    if (!role) { toast.error('لا يوجد دور معتمد للقضية'); return; }
    const res = reject(rejectModal.id, role, rejectNote);
    if (res.ok) toast.success('تم رفض القضية');
    else toast.error(res.error ?? 'خطأ');
    setRejectModal(null);
    setRejectNote('');
  };

  const handleRequestEdit = () => {
    if (!editModal) return;
    if (!editNote.trim()) { toast.error('ملاحظة التعديل مطلوبة'); return; }
    const role = editModal.requiredApprovers[editModal.currentApprovalIndex];
    if (!role) { toast.error('لا يوجد دور معتمد للقضية'); return; }
    const res = requestEdit(editModal.id, role, editNote);
    if (res.ok) toast.success('تم إرسال طلب التعديل');
    else toast.error(res.error ?? 'خطأ');
    setEditModal(null);
    setEditNote('');
  };

  const filtered = cases.filter(c =>
    c.caseNumber.includes(q) || c.employeeNameAr.includes(q) || c.typeNameAr.includes(q)
  );

  const empOptions = activeEmployees.map(e => ({ value: e.id, label: e.nameAr, sub: e.jobTitleAr }));
  const typeOptions = types.filter(t => t.isActive).map(t => ({ value: t.id, label: t.nameAr, sub: t.code }));

  const set = (patch: Partial<DraftForm>) => setDraft(d => ({ ...d, ...patch }));

  const handleSave = (andSubmit: boolean) => {
    setFormError(null);
    if (!draft.employeeId) { setFormError('الموظف مطلوب'); return; }
    if (!draft.violationTypeId) { setFormError('نوع المخالفة مطلوب'); return; }
    if (!draft.date) { setFormError('التاريخ مطلوب'); return; }
    if (!draft.description.trim()) { setFormError('الوصف مطلوب'); return; }

    const vt = types.find(t => t.id === draft.violationTypeId)!;
    const emp = activeEmployees.find(e => e.id === draft.employeeId)!;

    const result = add({
      employeeId: emp.id,
      employeeNameAr: emp.nameAr,
      employeeNameEn: emp.nameAr,
      date: draft.date,
      description: draft.description,
      notes: draft.notes,
      attachmentsNote: draft.attachmentsNote,
      violationTypeId: vt.id,
      typeCode: vt.code,
      typeNameAr: vt.nameAr,
      typeHasDeduction: vt.hasDeduction,
      typeDeductionKind: vt.deductionKind,
      typeDeductionValue: vt.deductionValue,
      typeNeedsWarning: vt.needsWarning,
      typeNeedsInvestigation: vt.needsInvestigation,
      typeNeedsApproval: vt.needsApproval,
      approvalTemplateId: vt.approvalTemplateId,
    });

    if (!result.ok) { setFormError(result.error ?? 'خطأ'); return; }

    if (andSubmit && result.id) {
      submit(result.id);
    }

    toast.success(andSubmit ? 'تم حفظ المخالفة وتقديمها' : 'تم حفظ المسودة');
    setDrawerOpen(false);
    setDraft(EMPTY);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="luxe" size="sm" onClick={() => { setDraft(EMPTY); setFormError(null); setDrawerOpen(true); }}>
          <Plus className="h-4 w-4 ml-1" />قضية جديدة
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <ShieldAlert className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد قضايا. أنشئ قضية جديدة للبدء.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(c => {
            const isUnderReview = c.status === 'under_review';
            const isDraft = c.status === 'draft';
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => setViewCase(c)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewCase(c); } }}
                className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring flex flex-col"
              >
                <div className={cn(
                  'absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-10',
                  isUnderReview ? 'bg-amber-500' : 'bg-primary',
                )} />
                <div className="relative p-5 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      isUnderReview ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-primary/10 text-primary',
                    )}>
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0',
                      CASE_STATUS_COLORS[c.status],
                    )}>
                      {CASE_STATUS_LABELS[c.status]}
                    </span>
                  </div>

                  {/* Case number + employee */}
                  <p className="font-mono text-[10px] font-bold text-muted-foreground/80 mb-0.5" dir="ltr">{c.caseNumber}</p>
                  <h3 className="font-display text-base font-bold leading-snug mb-3 group-hover:text-primary transition-colors truncate flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{c.employeeNameAr}</span>
                  </h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary truncate max-w-full">
                      {c.typeNameAr}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground" dir="ltr">
                      <CalendarDays className="h-2.5 w-2.5" />
                      {c.date}
                    </span>
                    {c.requiredApprovers.length > 1 && isUnderReview && (
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                        مرحلة {c.currentApprovalIndex + 1}/{c.requiredApprovers.length}
                      </span>
                    )}
                  </div>

                  {/* Description preview */}
                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{c.description}</p>
                  )}

                  {/* Approval action strip — only under_review */}
                  {isUnderReview && (
                    <div
                      className="grid grid-cols-3 gap-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-1 mb-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
                        onClick={() => handleApprove(c)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> موافقة
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-1 text-xs font-semibold text-red-700 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
                        onClick={() => { setRejectNote(''); setRejectModal(c); }}
                      >
                        <XCircle className="h-3.5 w-3.5" /> رفض
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-1 text-xs font-semibold text-amber-700 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
                        onClick={() => { setEditNote(''); setEditModal(c); }}
                      >
                        <Edit3 className="h-3.5 w-3.5" /> تعديل
                      </Button>
                    </div>
                  )}

                  {/* Footer */}
                  <div
                    className="mt-auto flex items-center gap-1 border-t border-border/60 pt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="sm" type="button" className="h-7 gap-1 px-2 text-xs flex-1" onClick={() => setViewCase(c)}>
                      <Eye className="h-3 w-3" /> عرض
                    </Button>
                    {isDraft && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="h-7 gap-1 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                        onClick={() => { submit(c.id); toast.success('تم تقديم القضية'); }}
                      >
                        <Send className="h-3 w-3" /> تقديم
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(c.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Drawer */}
      <HRSettingsFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="قضية مخالفة جديدة"
        size="lg"
        onSave={() => handleSave(false)}
        saveLabel="حفظ مسودة"
        error={formError}
      >
        <FormField label="الموظف" required>
          <SearchableDropdown value={draft.employeeId} onChange={v => set({ employeeId: v })} options={empOptions} placeholder="اختر الموظف…" />
        </FormField>
        <FormField label="نوع المخالفة" required>
          <SearchableDropdown value={draft.violationTypeId} onChange={v => set({ violationTypeId: v })} options={typeOptions} placeholder="اختر نوع المخالفة…" />
        </FormField>
        <FormField label="تاريخ المخالفة" required>
          <Input type="date" value={draft.date} onChange={e => set({ date: e.target.value })} />
        </FormField>
        <FormField label="الوصف" required>
          <textarea
            value={draft.description}
            onChange={e => set({ description: e.target.value })}
            placeholder="اكتب وصف المخالفة…"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </FormField>
        <FormField label="ملاحظات">
          <textarea
            value={draft.notes}
            onChange={e => set({ notes: e.target.value })}
            placeholder="ملاحظات إضافية…"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </FormField>
        <FormField label="ملاحظة المرفقات">
          <Input value={draft.attachmentsNote} onChange={e => set({ attachmentsNote: e.target.value })} placeholder="وصف المستندات المرفقة…" />
        </FormField>

      </HRSettingsFormDrawer>

      {/* View modal */}
      <Dialog open={!!viewCase} onOpenChange={v => !v && setViewCase(null)}>
        <DialogContent className="sm:max-w-lg border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{viewCase?.caseNumber}</DialogTitle>
          </DialogHeader>
          {viewCase && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground text-xs">الموظف</span><p className="font-medium">{viewCase.employeeNameAr}</p></div>
                <div><span className="text-muted-foreground text-xs">نوع المخالفة</span><p className="font-medium">{viewCase.typeNameAr}</p></div>
                <div><span className="text-muted-foreground text-xs">التاريخ</span><p>{viewCase.date}</p></div>
                <div>
                  <span className="text-muted-foreground text-xs">الحالة</span>
                  <p><span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', CASE_STATUS_COLORS[viewCase.status])}>{CASE_STATUS_LABELS[viewCase.status]}</span></p>
                </div>
              </div>
              <div><span className="text-muted-foreground text-xs">الوصف</span><p className="mt-1">{viewCase.description}</p></div>
              {viewCase.notes && <div><span className="text-muted-foreground text-xs">ملاحظات</span><p className="mt-1">{viewCase.notes}</p></div>}
              {viewCase.approvalLog.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">سجل الاعتماد</p>
                  <div className="space-y-2">
                    {viewCase.approvalLog.map((entry, i) => (
                      <div key={i} className="rounded-lg border border-border p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{entry.role}</span>
                          <span className={cn('font-medium', entry.action === 'approved' ? 'text-emerald-600' : entry.action === 'rejected' ? 'text-red-600' : 'text-amber-600')}>{entry.action === 'approved' ? 'معتمد' : entry.action === 'rejected' ? 'مرفوض' : 'طلب تعديل'}</span>
                        </div>
                        {entry.note && <p className="mt-1 text-muted-foreground">{entry.note}</p>}
                        <p className="mt-1 text-muted-foreground">{new Date(entry.at).toLocaleString('ar-SA')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        onConfirm={() => { if (deleteId) { remove(deleteId); toast.success('تم الحذف'); setDeleteId(null); } }}
        title="حذف القضية"
      />

      {/* Reject Modal */}
      <Dialog open={!!rejectModal} onOpenChange={v => !v && setRejectModal(null)}>
        <DialogContent className="sm:max-w-sm border-border">
          <DialogHeader><DialogTitle>رفض المخالفة {rejectModal?.caseNumber}</DialogTitle></DialogHeader>
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
