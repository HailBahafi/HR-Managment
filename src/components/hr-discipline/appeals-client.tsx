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
import { useHRDisciplineAppealsStore } from '@/lib/hr-discipline/appeals-store';
import { useHRViolationCasesStore } from '@/lib/hr-discipline/violation-cases-store';
import type { HRAppealChannel, HRAppealStatus } from '@/lib/hr-discipline/types';
import { APPEAL_CHANNEL_LABELS, APPEAL_STATUS_LABELS } from '@/lib/hr-discipline/types';
import { cn } from '@/lib/utils';

const CHANNEL_OPTIONS = (Object.entries(APPEAL_CHANNEL_LABELS) as [HRAppealChannel, string][]).map(([v, l]) => ({ value: v, label: l }));
const STATUS_OPTIONS = (Object.entries(APPEAL_STATUS_LABELS) as [HRAppealStatus, string][]).map(([v, l]) => ({ value: v, label: l }));

const STATUS_COLORS: Record<HRAppealStatus, string> = {
  submitted: 'text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/30',
  in_review: 'text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/30',
  accepted: 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30',
  rejected: 'text-red-700 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950/30',
  closed: 'text-muted-foreground border-border bg-muted/30',
};

interface DraftForm {
  caseId: string; caseNumber: string; employeeId: string; employeeNameAr: string;
  date: string; channel: HRAppealChannel; grounds: string;
  status: HRAppealStatus; responseNote: string;
}
const EMPTY: DraftForm = {
  caseId: '', caseNumber: '', employeeId: '', employeeNameAr: '',
  date: '', channel: 'hr', grounds: '', status: 'submitted', responseNote: '',
};

export function AppealsClient() {
  const { appeals, add, update, remove } = useHRDisciplineAppealsStore();
  const { cases } = useHRViolationCasesStore();

  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  React.useEffect(() => { setPage(1); }, [q]);

  const caseOptions = cases.map(c => ({ value: c.id, label: c.caseNumber, sub: c.employeeNameAr }));

  const filtered = appeals.filter(a => a.caseNumber.includes(q) || a.employeeNameAr.includes(q));
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
    if (!draft.date) { setFormError('التاريخ مطلوب'); return; }
    if (!draft.grounds.trim()) { setFormError('أسباب التظلم مطلوبة'); return; }
    add(draft);
    toast.success('تم تقديم التظلم');
    setDrawerOpen(false);
    setDraft(EMPTY);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="التظلمات" description="تظلمات الموظفين ضد قرارات الانضباط">
        <Button variant="luxe" size="sm" onClick={() => { setDraft(EMPTY); setFormError(null); setDrawerOpen(true); }}>
          <Plus className="h-4 w-4 ml-1" />إضافة تظلم
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث برقم القضية أو الموظف…" className="pr-9" />
      </div>

      {/* Desktop */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">القضية</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الموظف</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">القناة</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">التاريخ</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الحالة</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.length === 0 && <tr><td colSpan={6}><EmptyState title="لا توجد تظلمات" /></td></tr>}
            {paged.map(a => (
              <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{a.caseNumber}</td>
                <td className="px-4 py-3 font-medium">{a.employeeNameAr}</td>
                <td className="px-4 py-3">{APPEAL_CHANNEL_LABELS[a.channel]}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.date}</td>
                <td className="px-4 py-3">
                  <MinimalDropdown
                    value={a.status}
                    onChange={v => { update(a.id, { status: v as HRAppealStatus }); toast.success('تم تحديث الحالة'); }}
                    options={STATUS_OPTIONS}
                    className={cn('h-8 text-xs border-0 shadow-none', STATUS_COLORS[a.status])}
                  />
                </td>
                <td className="px-4 py-3 text-left">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 0 && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        {paged.length === 0 && <EmptyState title="لا توجد تظلمات" />}
        {paged.map(a => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs font-bold">{a.caseNumber}</div>
                <div className="font-medium">{a.employeeNameAr}</div>
                <div className="text-xs text-muted-foreground">{APPEAL_CHANNEL_LABELS[a.channel]} · {a.date}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', STATUS_COLORS[a.status])}>
                  {APPEAL_STATUS_LABELS[a.status]}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <MinimalDropdown
                value={a.status}
                onChange={v => { update(a.id, { status: v as HRAppealStatus }); toast.success('تم تحديث الحالة'); }}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
        ))}
        {total > perPage && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>

      <HRSettingsFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="تقديم تظلم" size="lg" onSave={handleSave} error={formError}>
        <FormField label="القضية" required>
          <SearchableDropdown value={draft.caseId} onChange={handleCaseSelect} options={caseOptions} placeholder="اختر القضية…" />
        </FormField>
        {draft.employeeNameAr && (
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm"><span className="text-muted-foreground">الموظف: </span>{draft.employeeNameAr}</div>
        )}
        <FormField label="تاريخ التظلم" required>
          <Input type="date" value={draft.date} onChange={e => set({ date: e.target.value })} />
        </FormField>
        <FormField label="قناة التظلم" required>
          <MinimalDropdown value={draft.channel} onChange={v => set({ channel: v as HRAppealChannel })} options={CHANNEL_OPTIONS} />
        </FormField>
        <FormField label="أسباب التظلم" required>
          <textarea value={draft.grounds} onChange={e => set({ grounds: e.target.value })} placeholder="اشرح أسباب التظلم…" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} onConfirm={() => { if (deleteId) { remove(deleteId); toast.success('تم الحذف'); setDeleteId(null); } }} title="حذف التظلم" />
    </div>
  );
}
