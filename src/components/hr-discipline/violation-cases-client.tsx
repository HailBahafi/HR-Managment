'use client';

import * as React from 'react';
import { Plus, Search, Eye, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  PageHeader, EmptyState, SearchableDropdown, MinimalDropdown, Pagination,
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
  const { cases, add, submit, remove } = useHRViolationCasesStore();
  const { types } = useHRViolationTypesStore();
  const { activeEmployees } = useHREmployeeDirectoryStore();

  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [viewCase, setViewCase] = React.useState<HRViolationCaseRecord | null>(null);

  React.useEffect(() => { setPage(1); }, [q]);

  const filtered = cases.filter(c =>
    c.caseNumber.includes(q) || c.employeeNameAr.includes(q) || c.typeNameAr.includes(q)
  );
  const total = filtered.length;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

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
      employeeNameEn: emp.nameEn ?? '',
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

    toast.success(andSubmit ? 'تم حفظ القضية وتقديمها' : 'تم حفظ المسودة');
    setDrawerOpen(false);
    setDraft(EMPTY);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="قضايا المخالفات" description="سجل قضايا الانضباط الوظيفي">
        <Button variant="luxe" size="sm" onClick={() => { setDraft(EMPTY); setFormError(null); setDrawerOpen(true); }}>
          <Plus className="h-4 w-4 ml-1" />قضية جديدة
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث برقم القضية أو الموظف…" className="pr-9" />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">رقم القضية</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الموظف</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">نوع المخالفة</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">التاريخ</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الحالة</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.length === 0 && <tr><td colSpan={6}><EmptyState title="لا توجد قضايا" /></td></tr>}
            {paged.map(c => (
              <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{c.caseNumber}</td>
                <td className="px-4 py-3 font-medium">{c.employeeNameAr}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.typeNameAr}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.date}</td>
                <td className="px-4 py-3">
                  <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', CASE_STATUS_COLORS[c.status])}>
                    {CASE_STATUS_LABELS[c.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewCase(c)}><Eye className="h-3.5 w-3.5" /></Button>
                    {c.status === 'draft' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => { submit(c.id); toast.success('تم تقديم القضية'); }} title="تقديم"><Send className="h-3.5 w-3.5" /></Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 0 && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {paged.length === 0 && <EmptyState title="لا توجد قضايا" />}
        {paged.map(c => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs font-bold">{c.caseNumber}</div>
                <div className="font-medium mt-0.5">{c.employeeNameAr}</div>
                <div className="text-xs text-muted-foreground">{c.typeNameAr} · {c.date}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', CASE_STATUS_COLORS[c.status])}>
                  {CASE_STATUS_LABELS[c.status]}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewCase(c)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {total > perPage && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>

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
        <div className="flex justify-end">
          <Button variant="default" type="button" onClick={() => handleSave(true)}>
            <Send className="h-4 w-4 ml-1" />حفظ وتقديم
          </Button>
        </div>
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
    </div>
  );
}
