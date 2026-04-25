'use client';

import * as React from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  PageHeader, EmptyState, MinimalDropdown, SearchableDropdown, Pagination,
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

  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  React.useEffect(() => { setPage(1); }, [q]);

  const caseOptions = cases.map(c => ({ value: c.id, label: c.caseNumber, sub: c.employeeNameAr }));

  const filtered = investigations.filter(i => i.caseNumber.includes(q) || i.employeeNameAr.includes(q) || i.investigatorName.includes(q));
  const total = filtered.length;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const set = (patch: Partial<DraftForm>) => setDraft(d => ({ ...d, ...patch }));

  const handleCaseSelect = (caseId: string) => {
    const c = cases.find(x => x.id === caseId);
    if (!c) { set({ caseId: '', caseNumber: '', employeeId: '', employeeNameAr: '' }); return; }
    set({ caseId: c.id, caseNumber: c.caseNumber, employeeId: c.employeeId, employeeNameAr: c.employeeNameAr });
  };

  const handleSave = () => {
    setFormError(null);
    if (!draft.caseId) { setFormError('القضية مطلوبة'); return; }
    if (!draft.investigatorName.trim()) { setFormError('اسم المحقق مطلوب'); return; }
    if (!draft.date) { setFormError('التاريخ مطلوب'); return; }
    add(draft);
    toast.success('تم إضافة التحقيق');
    setDrawerOpen(false);
    setDraft(EMPTY);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="التحقيقات" description="سجل التحقيقات في مخالفات الموظفين">
        <Button variant="luxe" size="sm" onClick={() => { setDraft(EMPTY); setFormError(null); setDrawerOpen(true); }}>
          <Plus className="h-4 w-4 ml-1" />إضافة تحقيق
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث برقم القضية أو المحقق…" className="pr-9" />
      </div>

      {/* Desktop */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">القضية</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الموظف</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">المحقق</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">التاريخ</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">النتيجة</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.length === 0 && <tr><td colSpan={6}><EmptyState title="لا توجد تحقيقات" /></td></tr>}
            {paged.map(inv => (
              <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{inv.caseNumber}</td>
                <td className="px-4 py-3 font-medium">{inv.employeeNameAr}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.investigatorName}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.date}</td>
                <td className="px-4 py-3">{INVESTIGATION_RESULT_LABELS[inv.result]}</td>
                <td className="px-4 py-3 text-left">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(inv.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 0 && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        {paged.length === 0 && <EmptyState title="لا توجد تحقيقات" />}
        {paged.map(inv => (
          <div key={inv.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs font-bold">{inv.caseNumber}</div>
                <div className="font-medium">{inv.employeeNameAr}</div>
                <div className="text-xs text-muted-foreground">{inv.investigatorName} · {inv.date}</div>
                <div className="text-xs mt-1">{INVESTIGATION_RESULT_LABELS[inv.result]}</div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => setDeleteId(inv.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
        {total > perPage && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>

      <HRSettingsFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="إضافة تحقيق" size="lg" onSave={handleSave} error={formError}>
        <FormField label="القضية" required>
          <SearchableDropdown value={draft.caseId} onChange={handleCaseSelect} options={caseOptions} placeholder="اختر القضية…" />
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
