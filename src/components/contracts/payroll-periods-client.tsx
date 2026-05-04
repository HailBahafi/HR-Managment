'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Plus, CalendarRange, BarChart2,
  ChevronRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SetPageTitle } from '@/components/set-page-title';
import { usePageFilters } from '@/components/filter-panel-context';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import { intervalOverlapsYmdRange } from '@/lib/hr-discipline/discipline-date-filter';
import {
  HRSettingsFormDrawer, FormField, ConfirmationModal, EmptyState,
} from '@/components/hr-requests/shared-ui';
import {
  useHRPayrollPeriodsStore,
  PERIOD_STATUS_LABELS, PERIOD_STATUS_COLORS, COMPENSATION_STATUS_LABELS,
  type HRPayrollPeriodDraft, type HRPayrollPeriodStatus, type HRPayrollCompensationReviewStatus,
} from '@/lib/contracts/payroll-periods-store';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | HRPayrollPeriodStatus;

const EMPTY_DRAFT: HRPayrollPeriodDraft = {
  code: '', nameAr: '', nameEn: '',
  periodStart: '', periodEnd: '',
  status: 'draft', compensationReviewStatus: 'draft',
  snapshotContractIds: [], employmentLines: [],
  linesMaterializedAt: null, employmentLineMonthlyInputs: {}, notes: '',
};

const COMP_STATUS_BADGE: Record<HRPayrollCompensationReviewStatus, string> = {
  draft:         'bg-muted text-muted-foreground border-border',
  first_review:  'bg-warning/10 text-warning border-warning/25',
  second_review: 'bg-gold/10 text-gold border-gold/25',
  approved:      'bg-success/10 text-success border-success/25',
};

export function PayrollPeriodsClient() {
  const { periods, add, update, remove, open: openPeriod, close: closePeriod, setCompensationStatus } = useHRPayrollPeriodsStore();

  const { values, setValue } = usePageFilters([
    {
      key: 'status', label: 'الحالة', type: 'select',
      options: [
        { value: 'draft', label: PERIOD_STATUS_LABELS.draft },
        { value: 'open', label: PERIOD_STATUS_LABELS.open },
        { value: 'closed', label: PERIOD_STATUS_LABELS.closed },
      ],
    },
  ]);

  const statusFilter = (values.status as StatusFilter) || 'all';

  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => {
    setDateBounds(b);
  }, []);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<HRPayrollPeriodDraft>(EMPTY_DRAFT);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const narrowedByDate = React.useMemo(
    () =>
      periods.filter((p) =>
        intervalOverlapsYmdRange(p.periodStart, p.periodEnd, dateBounds.from, dateBounds.to),
      ),
    [periods, dateBounds.from, dateBounds.to],
  );

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: narrowedByDate.length,
      draft: 0,
      open: 0,
      closed: 0,
    };
    for (const p of narrowedByDate) {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
    }
    return counts;
  }, [narrowedByDate]);

  const filtered = React.useMemo(
    () =>
      narrowedByDate
        .filter(p => statusFilter === 'all' || p.status === statusFilter)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [narrowedByDate, statusFilter],
  );

  const total = filtered.length;

  const openCreate = () => { setEditId(null); setDraft(EMPTY_DRAFT); setError(null); setDrawerOpen(true); };
  const openEdit   = (id: string) => {
    const p = periods.find(x => x.id === id);
    if (!p) return;
    setEditId(id);
    setDraft({
      code: p.code, nameAr: p.nameAr, nameEn: p.nameEn,
      periodStart: p.periodStart, periodEnd: p.periodEnd,
      status: p.status, compensationReviewStatus: p.compensationReviewStatus,
      snapshotContractIds: p.snapshotContractIds, employmentLines: p.employmentLines,
      linesMaterializedAt: p.linesMaterializedAt, employmentLineMonthlyInputs: p.employmentLineMonthlyInputs,
      notes: p.notes,
    });
    setError(null); setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!draft.code.trim()) { setError('الكود مطلوب'); return; }
    if (!draft.nameAr.trim()) { setError('الاسم العربي مطلوب'); return; }
    if (!draft.periodStart || !draft.periodEnd) { setError('تواريخ الفترة مطلوبة'); return; }
    if (editId) { update(editId, draft); } else { add(draft); }
    setDrawerOpen(false);
  };

  const set = (patch: Partial<HRPayrollPeriodDraft>) => setDraft(d => ({ ...d, ...patch }));

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showEmployeePicker={false}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => setValue('status', v)}
        statusOrder={['draft', 'open', 'closed']}
        statusLabels={{
          draft: PERIOD_STATUS_LABELS.draft,
          open: PERIOD_STATUS_LABELS.open,
          closed: PERIOD_STATUS_LABELS.closed,
        }}
        statusCounts={statusCounts}
        onDateBoundsChange={onDateBoundsChange}
        trailingActions={(
          <Button onClick={openCreate} className="h-8 gap-1.5 px-3 text-xs shadow-sm">
            <Plus className="h-4 w-4" />فترة جديدة
          </Button>
        )}
      />
    ),
    [
      statusFilter,
      statusCounts.all,
      statusCounts.draft,
      statusCounts.open,
      statusCounts.closed,
      dateBounds.from,
      dateBounds.to,
      total,
    ],
  );

  const PeriodActions = ({ p }: { p: typeof periods[0] }) => (
    <div className="flex items-center gap-1 flex-wrap">
      <Link href={`/hr/contracts/period/${encodeURIComponent(p.id)}/compensation`}>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
          <BarChart2 className="h-3 w-3" />تقرير
        </Button>
      </Link>
      {p.status === 'draft' && <Button size="sm" variant="ghost" className="h-7 text-xs text-success hover:text-success" onClick={() => openPeriod(p.id)}>فتح</Button>}
      {p.status === 'open'  && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => closePeriod(p.id)}>إغلاق</Button>}
      {p.status !== 'closed'&& <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(p.id)}>تعديل</Button>}
      {p.status === 'draft' && <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setConfirmId(p.id)}>حذف</Button>}
    </div>
  );

  return (
    <>
      <SetPageTitle titleAr="فترات الراتب" descriptionAr="إنشاء وإدارة فترات الرواتب الشهرية." iconName="CalendarRange" />

      <p className="mb-2 text-sm text-muted-foreground">{total} فترة</p>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarRange} title="لا توجد فترات" description="أنشئ فترة راتب جديدة للبدء." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(p => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col cursor-pointer"
              onClick={() => openEdit(p.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] text-muted-foreground">{p.code}</p>
                  <p className="font-semibold truncate mt-0.5">{p.nameAr}</p>
                </div>
                <Badge className={cn('shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-semibold', PERIOD_STATUS_COLORS[p.status])}>
                  {PERIOD_STATUS_LABELS[p.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground">
                <CalendarRange className="h-3 w-3 shrink-0" />
                <span className="font-mono">{p.periodStart}</span>
                <ChevronRight className="h-3 w-3 opacity-40" />
                <span className="font-mono">{p.periodEnd}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">حالة المراجعة</span>
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', COMP_STATUS_BADGE[p.compensationReviewStatus])}>
                  {p.compensationReviewStatus === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                  {COMPENSATION_STATUS_LABELS[p.compensationReviewStatus]}
                </span>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-end gap-1 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                <PeriodActions p={p} />
              </div>
            </div>
          ))}
        </div>
      )}

      <HRSettingsFormDrawer
        open={drawerOpen} onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل فترة الراتب' : 'فترة راتب جديدة'}
        onSave={handleSave} error={error}
      >
        <FormField label="الكود" required>
          <Input value={draft.code} onChange={e => set({ code: e.target.value })} placeholder="مثال: PAY-2025-01" />
        </FormField>
        <FormField label="الاسم العربي" required>
          <Input value={draft.nameAr} onChange={e => set({ nameAr: e.target.value })} placeholder="يناير 2025" />
        </FormField>
        <FormField label="الاسم الإنجليزي">
          <Input value={draft.nameEn} onChange={e => set({ nameEn: e.target.value })} placeholder="January 2025" />
        </FormField>
        <FormField label="بداية الفترة" required>
          <Input type="date" value={draft.periodStart} onChange={e => set({ periodStart: e.target.value })} />
        </FormField>
        <FormField label="نهاية الفترة" required>
          <Input type="date" value={draft.periodEnd} onChange={e => set({ periodEnd: e.target.value })} />
        </FormField>
        <FormField label="ملاحظات" span2>
          <Input value={draft.notes} onChange={e => set({ notes: e.target.value })} placeholder="ملاحظات اختيارية…" />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!confirmId}
        onOpenChange={v => { if (!v) setConfirmId(null); }}
        title="حذف فترة الراتب"
        description="هل أنت متأكد من حذف هذه الفترة؟ لا يمكن التراجع."
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={() => { if (confirmId) { remove(confirmId); setConfirmId(null); } }}
      />
    </>
  );
}
