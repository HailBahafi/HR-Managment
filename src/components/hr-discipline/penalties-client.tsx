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
import { useHRDisciplinePenaltiesStore } from '@/lib/hr-discipline/penalties-store';
import { useHRViolationCasesStore } from '@/lib/hr-discipline/violation-cases-store';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import type { HRPenaltyType } from '@/lib/hr-discipline/types';
import { PENALTY_TYPE_LABELS } from '@/lib/hr-discipline/types';

const PENALTY_OPTIONS = (Object.entries(PENALTY_TYPE_LABELS) as [HRPenaltyType, string][]).map(([v, l]) => ({ value: v, label: l }));

interface DraftForm {
  employeeId: string; employeeNameAr: string;
  caseId: string; caseNumber: string;
  penaltyType: HRPenaltyType; decisionDate: string; notes: string;
}
const EMPTY: DraftForm = { employeeId: '', employeeNameAr: '', caseId: '', caseNumber: '', penaltyType: 'reprimand', decisionDate: '', notes: '' };

export function PenaltiesClient() {
  const { penalties, add, remove } = useHRDisciplinePenaltiesStore();
  const { cases } = useHRViolationCasesStore();
  const { activeEmployees } = useHREmployeeDirectoryStore();

  const { values } = usePageFilters([{ key: 'q', label: 'بحث', type: 'text', placeholder: 'اسم الموظف أو رقم القضية…' }]);
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

  const filtered = penalties.filter(p => p.employeeNameAr.includes(q) || p.caseNumber.includes(q));
  const total = filtered.length;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const set = (patch: Partial<DraftForm>) => setDraft(d => ({ ...d, ...patch }));

  const handleCaseSelect = (caseId: string) => {
    const c = cases.find(x => x.id === caseId);
    if (!c) { set({ caseId: '', caseNumber: '' }); return; }
    set({ caseId: c.id, caseNumber: c.caseNumber, employeeId: c.employeeId, employeeNameAr: c.employeeNameAr });
  };

  const handleSave = () => {
    setFormError(null);
    if (!draft.employeeId) { setFormError('الموظف مطلوب'); return; }
    if (!draft.caseId) { setFormError('القضية مطلوبة'); return; }
    if (!draft.decisionDate) { setFormError('تاريخ القرار مطلوب'); return; }
    add(draft);
    toast.success('تم إضافة العقوبة');
    setDrawerOpen(false);
    setDraft(EMPTY);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="luxe" size="sm" onClick={() => { setDraft(EMPTY); setFormError(null); setDrawerOpen(true); }}>
          <Plus className="h-4 w-4 ml-1" />إضافة عقوبة
        </Button>
      </div>

      {/* Desktop */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الموظف</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">القضية</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">نوع العقوبة</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">تاريخ القرار</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.length === 0 && <tr><td colSpan={5}><EmptyState title="لا توجد عقوبات" /></td></tr>}
            {paged.map(p => (
              <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{p.employeeNameAr}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.caseNumber}</td>
                <td className="px-4 py-3">{PENALTY_TYPE_LABELS[p.penaltyType]}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.decisionDate}</td>
                <td className="px-4 py-3 text-left">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 0 && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        {paged.length === 0 && <EmptyState title="لا توجد عقوبات" />}
        {paged.map(p => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{p.employeeNameAr}</div>
                <div className="text-xs text-muted-foreground">{p.caseNumber} · {p.decisionDate}</div>
                <div className="text-sm mt-1">{PENALTY_TYPE_LABELS[p.penaltyType]}</div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
        {total > perPage && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>

      <HRSettingsFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="إضافة عقوبة" size="lg" onSave={handleSave} error={formError}>
        <FormField label="القضية" required>
          <SearchableDropdown value={draft.caseId} onChange={handleCaseSelect} options={caseOptions} placeholder="اختر القضية…" />
        </FormField>
        <FormField label="الموظف" required>
          <SearchableDropdown
            value={draft.employeeId}
            onChange={v => { const emp = activeEmployees.find(e => e.id === v); if (emp) set({ employeeId: emp.id, employeeNameAr: emp.nameAr }); }}
            options={empOptions}
            placeholder="اختر الموظف…"
          />
        </FormField>
        <FormField label="نوع العقوبة" required>
          <MinimalDropdown value={draft.penaltyType} onChange={v => set({ penaltyType: v as HRPenaltyType })} options={PENALTY_OPTIONS} />
        </FormField>
        <FormField label="تاريخ القرار" required>
          <Input type="date" value={draft.decisionDate} onChange={e => set({ decisionDate: e.target.value })} />
        </FormField>
        <FormField label="ملاحظات">
          <textarea value={draft.notes} onChange={e => set({ notes: e.target.value })} placeholder="ملاحظات إضافية…" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} onConfirm={() => { if (deleteId) { remove(deleteId); toast.success('تم الحذف'); setDeleteId(null); } }} title="حذف العقوبة" />
    </div>
  );
}
