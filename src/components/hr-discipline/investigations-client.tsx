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
import { useHRDisciplineInvestigationsStore } from '@/lib/hr-discipline/investigations-store';
import { useHRViolationCasesStore } from '@/lib/hr-discipline/violation-cases-store';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import type { HRInvestigationResult } from '@/lib/hr-discipline/types';
import { INVESTIGATION_RESULT_LABELS } from '@/lib/hr-discipline/types';

const RESULT_OPTIONS = (Object.entries(INVESTIGATION_RESULT_LABELS) as [HRInvestigationResult, string][]).map(([v, l]) => ({ value: v, label: l }));

interface DraftForm {
  caseId: string; caseNumber: string; employeeId: string; employeeNameAr: string;
  investigatorName: string; date: string;
  employeeStatement: string; witnessStatement: string;
  result: HRInvestigationResult; recommendation: string;
}
const EMPTY: DraftForm = {
  caseId: '', caseNumber: '', employeeId: '', employeeNameAr: '',
  investigatorName: '', date: '', employeeStatement: '', witnessStatement: '', result: 'upheld', recommendation: '',
};

export function InvestigationsClient() {
  const { investigations, add, remove } = useHRDisciplineInvestigationsStore();
  const { cases } = useHRViolationCasesStore();
  const { activeEmployees } = useHREmployeeDirectoryStore();

  const { values } = usePageFilters([{ key: 'q', label: 'بحث', type: 'text', placeholder: 'رقم الموظف…' }]);
  const q = (values.q as string) ?? '';
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const caseOptions = cases.map(c => ({ value: c.id, label: c.caseNumber, sub: c.employeeNameAr }));

  const filtered = investigations.filter(i => i.caseNumber.includes(q) || i.employeeNameAr.includes(q) || i.investigatorName.includes(q));

  const set = (patch: Partial<DraftForm>) => setDraft(d => ({ ...d, ...patch }));

  const handleCaseSelect = (caseId: string) => {
    const c = cases.find(x => x.id === caseId);
    if (!c) { set({ caseId: '', caseNumber: '', employeeId: '', employeeNameAr: '' }); return; }
    set({ caseId: c.id, caseNumber: c.caseNumber, employeeId: c.employeeId, employeeNameAr: c.employeeNameAr });
  };

  const handleSave = () => {
    setFormError(null);
    if (!draft.caseId) { setFormError('الموظف مطلوب'); return; }
    if (!draft.investigatorName.trim()) { setFormError('اسم المحقق مطلوب'); return; }
    if (!draft.date) { setFormError('التاريخ مطلوب'); return; }
    add(draft);
    toast.success('تم إضافة التحقيق');
    setDrawerOpen(false);
    setDraft(EMPTY);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="luxe" size="sm" onClick={() => { setDraft(EMPTY); setFormError(null); setDrawerOpen(true); }}>
          <Plus className="h-4 w-4 ml-1" />إضافة تحقيق
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="لا توجد تحقيقات" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(inv => (
            <div key={inv.id} className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold text-muted-foreground">{inv.caseNumber}</p>
                  <p className="font-semibold truncate mt-0.5">{inv.employeeNameAr}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary shrink-0">
                  {INVESTIGATION_RESULT_LABELS[inv.result]}
                </span>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>المحقق: {inv.investigatorName}</p>
                <p>التاريخ: {inv.date}</p>
              </div>
              <div className="mt-auto flex justify-end border-t border-border pt-3">
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(inv.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <HRSettingsFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="إضافة تحقيق" size="lg" onSave={handleSave} error={formError}>
        <FormField label="المخالفة" required>
          <SearchableDropdown value={draft.caseId} onChange={handleCaseSelect} options={caseOptions} placeholder="اختر المخالفة…" />
        </FormField>
        {draft.employeeNameAr && (
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm"><span className="text-muted-foreground">الموظف: </span>{draft.employeeNameAr}</div>
        )}
        <FormField label="اسم المحقق" required>
          <Input value={draft.investigatorName} onChange={e => set({ investigatorName: e.target.value })} placeholder="اسم المحقق…" />
        </FormField>
        <FormField label="تاريخ التحقيق" required>
          <Input type="date" value={draft.date} onChange={e => set({ date: e.target.value })} />
        </FormField>
        <FormField label="أقوال الموظف">
          <textarea value={draft.employeeStatement} onChange={e => set({ employeeStatement: e.target.value })} placeholder="ما قاله الموظف في التحقيق…" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="أقوال الشهود">
          <textarea value={draft.witnessStatement} onChange={e => set({ witnessStatement: e.target.value })} placeholder="شهادة الشهود…" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="نتيجة التحقيق" required>
          <MinimalDropdown value={draft.result} onChange={v => set({ result: v as HRInvestigationResult })} options={RESULT_OPTIONS} />
        </FormField>
        <FormField label="التوصية">
          <textarea value={draft.recommendation} onChange={e => set({ recommendation: e.target.value })} placeholder="توصية المحقق…" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} onConfirm={() => { if (deleteId) { remove(deleteId); toast.success('تم الحذف'); setDeleteId(null); } }} title="حذف التحقيق" />
    </div>
  );
}
