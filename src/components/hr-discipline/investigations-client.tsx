'use client';

import * as React from 'react';
import { Plus, Trash2, CalendarDays } from 'lucide-react';
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
import type { HRInvestigationResult } from '@/lib/hr-discipline/types';
import { INVESTIGATION_RESULT_LABELS, INVESTIGATION_RESULT_FILTER_ORDER } from '@/lib/hr-discipline/types';
import type { DateFilterTab } from '@/lib/hr-discipline/discipline-date-filter';
import { matchesDateRange } from '@/lib/hr-discipline/discipline-date-filter';
import {
  DisciplineFilterToolbar,
  type DisciplineFilterToolbarHandle,
  type DisciplineViewMode,
} from '@/components/hr-discipline/discipline-filter-toolbar';

const RESULT_OPTIONS = (Object.entries(INVESTIGATION_RESULT_LABELS) as [HRInvestigationResult, string][]).map(([v, l]) => ({ value: v, label: l }));

type ResultFilter = 'all' | HRInvestigationResult;

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

  const { values } = usePageFilters([{ key: 'q', label: 'بحث', type: 'text', placeholder: 'رقم الموظف…' }]);
  const q = (values.q as string) ?? '';
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<DisciplineViewMode>('cards');
  const [resultFilter, setResultFilter] = React.useState<ResultFilter>('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [dateMeta, setDateMeta] = React.useState<{ tab: DateFilterTab; hasRestriction: boolean }>({ tab: 'all', hasRestriction: false });
  const filterToolbarRef = React.useRef<DisciplineFilterToolbarHandle>(null);
  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => { setDateBounds(b); }, []);
  const onDateFilterMetaChange = React.useCallback((m: { tab: DateFilterTab; hasRestriction: boolean }) => { setDateMeta(m); }, []);

  const empPickerList = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const i of investigations) map.set(i.employeeId, i.employeeNameAr);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [investigations]);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const caseOptions = cases.map(c => ({ value: c.id, label: c.caseNumber, sub: c.employeeNameAr }));

  const searchFiltered = React.useMemo(
    () =>
      investigations.filter(
        (i) =>
          (i.caseNumber.includes(q) || i.employeeNameAr.includes(q) || i.investigatorName.includes(q)) &&
          (selectedEmpIds.size === 0 || selectedEmpIds.has(i.employeeId)),
      ),
    [investigations, q, selectedEmpIds],
  );

  const filtered = React.useMemo(
    () => searchFiltered.filter((i) => matchesDateRange(i.date, dateBounds.from, dateBounds.to)),
    [searchFiltered, dateBounds.from, dateBounds.to],
  );

  const listFiltered = React.useMemo(
    () => (resultFilter === 'all' ? filtered : filtered.filter((i) => i.result === resultFilter)),
    [filtered, resultFilter],
  );

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: filtered.length };
    for (const r of INVESTIGATION_RESULT_FILTER_ORDER) counts[r] = 0;
    for (const i of filtered) counts[i.result] = (counts[i.result] ?? 0) + 1;
    return counts;
  }, [filtered]);

  const dateRangeActive = dateMeta.hasRestriction;

  const set = (patch: Partial<DraftForm>) => setDraft(d => ({ ...d, ...patch }));

  const handleCaseSelect = (caseId: string) => {
    const c = cases.find(x => x.id === caseId);
    if (!c) { set({ caseId: '', caseNumber: '', employeeId: '', employeeNameAr: '' }); return; }
    set({ caseId: c.id, caseNumber: c.caseNumber, employeeId: c.employeeId, employeeNameAr: c.employeeNameAr });
  };

  const handleSave = () => {
    setFormError(null);
    if (!draft.caseId) { setFormError('المخالفة مطلوبة'); return; }
    if (!draft.investigatorName.trim()) { setFormError('اسم المحقق مطلوب'); return; }
    if (!draft.date) { setFormError('التاريخ مطلوب'); return; }
    add(draft);
    toast.success('تم إضافة التحقيق');
    setDrawerOpen(false);
    setDraft(EMPTY);
  };

  return (
    <div className="space-y-4">
      <DisciplineFilterToolbar
        ref={filterToolbarRef}
        primaryActionLabel="إضافة تحقيق"
        onPrimaryAction={() => { setDraft(EMPTY); setFormError(null); setDrawerOpen(true); }}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={resultFilter}
        onStatusFilterChange={(v) => setResultFilter(v as ResultFilter)}
        statusOrder={INVESTIGATION_RESULT_FILTER_ORDER}
        statusLabels={INVESTIGATION_RESULT_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateBoundsChange={onDateBoundsChange}
        onDateFilterMetaChange={onDateFilterMetaChange}
      />

      {searchFiltered.length === 0 ? (
        <EmptyState title="لا توجد تحقيقات مطابقة للبحث أو الموظفين المحددين." />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {dateMeta.tab === 'today'
              ? 'لا توجد تحقيقات بتاريخ اليوم ضمن النتائج الحالية.'
              : dateMeta.tab === 'week'
                ? 'لا توجد تحقيقات ضمن هذا الأسبوع ضمن النتائج الحالية.'
                : dateMeta.tab === 'custom' && dateRangeActive
                  ? 'لا توجد تحقيقات ضمن نطاق التاريخ المخصص مع عوامل البحث الحالية.'
                  : 'لا توجد تحقيقات ضمن النتائج الحالية.'}
          </p>
          {dateRangeActive ? (
            <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetDateFilter()}>
              عرض كل الفترات
            </Button>
          ) : null}
        </div>
      ) : listFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            لا توجد تحقيقات بنتيجة «{resultFilter === 'all' ? '' : INVESTIGATION_RESULT_LABELS[resultFilter]}» مع عوامل البحث الحالية.
          </p>
          <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetStatusFilter()}>
            عرض الكل
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listFiltered.map(inv => (
            <div key={inv.id} className="flex flex-col space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold text-muted-foreground" dir="ltr">{inv.caseNumber}</p>
                  <p className="mt-0.5 truncate font-semibold">{inv.employeeNameAr}</p>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  {INVESTIGATION_RESULT_LABELS[inv.result]}
                </span>
              </div>
              <div className="space-y-0.5 text-xs text-muted-foreground">
                <p>المحقق: {inv.investigatorName}</p>
                <p className="flex items-center gap-1 font-mono tabular-nums" dir="ltr">
                  <CalendarDays className="h-3 w-3 shrink-0" />
                  {inv.date}
                </p>
              </div>
              <div className="mt-auto flex justify-end border-t border-border pt-3">
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(inv.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-right">
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">المخالفة</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">الموظف</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">المحقق</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">التاريخ</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">النتيجة</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {listFiltered.map((inv) => (
                <tr key={inv.id} className="border-b border-border/70 transition-colors hover:bg-muted/25">
                  <td className="p-3 font-mono text-xs font-medium tabular-nums text-muted-foreground" dir="ltr">{inv.caseNumber}</td>
                  <td className="max-w-[10rem] truncate p-3 font-medium">{inv.employeeNameAr}</td>
                  <td className="max-w-[9rem] truncate p-3 text-xs">{inv.investigatorName}</td>
                  <td className="whitespace-nowrap p-3 font-mono text-xs tabular-nums" dir="ltr">{inv.date}</td>
                  <td className="whitespace-nowrap p-3 text-xs">{INVESTIGATION_RESULT_LABELS[inv.result]}</td>
                  <td className="p-2">
                    <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" type="button" onClick={() => setDeleteId(inv.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
