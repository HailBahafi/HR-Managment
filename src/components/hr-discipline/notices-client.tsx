'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePageFilters } from '@/components/filter-panel-context';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  PageHeader, EmptyState, MinimalDropdown, SearchableDropdown, Pagination,
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
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  React.useEffect(() => { setPage(1); }, [q]);

  const empOptions = activeEmployees.map(e => ({ value: e.id, label: e.nameAr, sub: e.jobTitleAr }));
  const caseOptions = cases.map(c => ({ value: c.id, label: c.caseNumber, sub: c.employeeNameAr }));

  const filtered = notices.filter(n => n.employeeNameAr.includes(q) || n.reasonAr.includes(q));
  const total = filtered.length;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

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

      {/* Desktop */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الموظف</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">النوع</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">السبب</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">التاريخ</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.length === 0 && <tr><td colSpan={5}><EmptyState title="لا توجد إنذارات" /></td></tr>}
            {paged.map(n => (
              <tr key={n.id} className="group hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => { /* Optional: open view modal */ }}>
                <td className="px-4 py-3 font-medium">{n.employeeNameAr}</td>
                <td className="px-4 py-3">{NOTICE_KIND_LABELS[n.kind]}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{n.reasonAr}</td>
                <td className="px-4 py-3 text-muted-foreground">{n.date}</td>
                <td className="px-4 py-3 text-left" onClick={e => e.stopPropagation()}>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(n.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 0 && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        {paged.length === 0 && <EmptyState title="لا توجد إنذارات" />}
        {paged.map(n => (
          <div key={n.id} className="rounded-xl border border-border bg-card p-4 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{n.employeeNameAr}</div>
                <div className="text-xs text-muted-foreground">{NOTICE_KIND_LABELS[n.kind]} · {n.date}</div>
                <div className="text-sm mt-1 text-muted-foreground">{n.reasonAr}</div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => setDeleteId(n.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
        {total > perPage && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>

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
