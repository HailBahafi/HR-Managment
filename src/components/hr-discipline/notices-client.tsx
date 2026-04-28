'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePageFilters } from '@/components/filter-panel-context';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, MinimalDropdown, SearchableDropdown,
} from '@/components/hr-requests/shared-ui';
import { useHRDisciplineNoticesStore } from '@/lib/hr-discipline/notices-store';
import { useHRViolationCasesStore } from '@/lib/hr-discipline/violation-cases-store';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import type { HRDisciplineNoticeKind } from '@/lib/hr-discipline/types';
import { NOTICE_KIND_LABELS } from '@/lib/hr-discipline/types';

const KIND_OPTIONS = (Object.entries(NOTICE_KIND_LABELS) as [HRDisciplineNoticeKind, string][]).map(([v, l]) => ({ value: v, label: l }));

interface DraftForm {
  employeeId: string; kind: HRDisciplineNoticeKind; reasonAr: string;
  date: string; linkedCaseId: string; attachmentsNote: string;
}
const EMPTY: DraftForm = { employeeId: '', kind: 'verbal', reasonAr: '', date: '', linkedCaseId: '', attachmentsNote: '' };

export function NoticesClient() {
  const { notices, add, remove } = useHRDisciplineNoticesStore();
  const { cases } = useHRViolationCasesStore();
  const { activeEmployees } = useHREmployeeDirectoryStore();

  const { values } = usePageFilters([{ key: 'q', label: 'بحث', type: 'text', placeholder: 'بحث بالاسم أو رقم القضية…' }]);
  const q = (values.q as string) ?? '';
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const empOptions = activeEmployees.map(e => ({ value: e.id, label: e.nameAr, sub: e.jobTitleAr }));
  const caseOptions = cases.map(c => ({ value: c.id, label: c.caseNumber, sub: c.employeeNameAr }));

  const filtered = notices.filter(n => n.employeeNameAr.includes(q) || n.reasonAr.includes(q));

  const set = (patch: Partial<DraftForm>) => setDraft(d => ({ ...d, ...patch }));

  const handleSave = () => {
    setFormError(null);
    if (!draft.employeeId) { setFormError('الموظف مطلوب'); return; }
    if (!draft.reasonAr.trim()) { setFormError('السبب مطلوب'); return; }
    if (!draft.date) { setFormError('التاريخ مطلوب'); return; }
    const emp = activeEmployees.find(e => e.id === draft.employeeId)!;
    add({ ...draft, employeeNameAr: emp.nameAr });
    toast.success('تم إضافة الإنذار');
    setDrawerOpen(false);
    setDraft(EMPTY);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="luxe" size="sm" onClick={() => { setDraft(EMPTY); setFormError(null); setDrawerOpen(true); }}>
          <Plus className="h-4 w-4 ml-1" />إضافة إنذار
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="لا توجد إنذارات" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(n => (
            <div key={n.id} className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{n.employeeNameAr}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{n.date}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  {NOTICE_KIND_LABELS[n.kind]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">{n.reasonAr}</p>
              <div className="mt-auto flex justify-end border-t border-border pt-3">
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(n.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <HRSettingsFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="إضافة إنذار" size="lg" onSave={handleSave} error={formError}>
        <FormField label="الموظف" required>
          <SearchableDropdown value={draft.employeeId} onChange={v => set({ employeeId: v })} options={empOptions} placeholder="اختر الموظف…" />
        </FormField>
        <FormField label="نوع الإنذار" required>
          <MinimalDropdown value={draft.kind} onChange={v => set({ kind: v as HRDisciplineNoticeKind })} options={KIND_OPTIONS} />
        </FormField>
        <FormField label="السبب" required>
          <textarea value={draft.reasonAr} onChange={e => set({ reasonAr: e.target.value })} placeholder="اكتب سبب الإنذار…" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="التاريخ" required>
          <Input type="date" value={draft.date} onChange={e => set({ date: e.target.value })} />
        </FormField>
        <FormField label="ربط بقضية">
          <SearchableDropdown value={draft.linkedCaseId} onChange={v => set({ linkedCaseId: v })} options={caseOptions} placeholder="اختر قضية (اختياري)…" allowClear />
        </FormField>
        <FormField label="ملاحظة المرفقات">
          <Input value={draft.attachmentsNote} onChange={e => set({ attachmentsNote: e.target.value })} placeholder="وصف المرفقات…" />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} onConfirm={() => { if (deleteId) { remove(deleteId); toast.success('تم الحذف'); setDeleteId(null); } }} title="حذف الإنذار" />
    </div>
  );
}
