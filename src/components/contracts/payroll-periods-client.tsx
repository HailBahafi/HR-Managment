'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Plus, CalendarRange, BarChart2, LayoutGrid, List,
  ChevronRight, CheckCircle2, Clock, Lock, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SetPageTitle } from '@/components/set-page-title';
import { usePageFilters } from '@/components/filter-panel-context';
import {
  HRSettingsFormDrawer, FormField, ConfirmationModal, EmptyState, Pagination,
} from '@/components/hr-requests/shared-ui';
import {
  useHRPayrollPeriodsStore,
  PERIOD_STATUS_LABELS, PERIOD_STATUS_COLORS, COMPENSATION_STATUS_LABELS,
  type HRPayrollPeriodDraft, type HRPayrollPeriodStatus, type HRPayrollCompensationReviewStatus,
} from '@/lib/contracts/payroll-periods-store';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | HRPayrollPeriodStatus;
type ViewMode = 'cards' | 'table';

const EMPTY_DRAFT: HRPayrollPeriodDraft = {
  code: '', nameAr: '', nameEn: '',
  periodStart: '', periodEnd: '',
  status: 'draft', compensationReviewStatus: 'draft',
  snapshotContractIds: [], employmentLines: [],
  linesMaterializedAt: null, employmentLineMonthlyInputs: {}, notes: '',
};

const PERIOD_CARD_STYLE: Record<string, { border: string; bg: string; icon: React.ElementType; iconColor: string }> = {
  draft:  { border: 'border-border',         bg: 'bg-muted/30',      icon: FileText,      iconColor: 'text-muted-foreground' },
  open:   { border: 'border-success/25',     bg: 'bg-success/5',     icon: Clock,         iconColor: 'text-success' },
  closed: { border: 'border-primary/20',     bg: 'bg-primary/5',     icon: Lock,          iconColor: 'text-primary' },
};

const COMP_STATUS_BADGE: Record<HRPayrollCompensationReviewStatus, string> = {
  draft:         'bg-muted text-muted-foreground border-border',
  first_review:  'bg-warning/10 text-warning border-warning/25',
  second_review: 'bg-gold/10 text-gold border-gold/25',
  approved:      'bg-success/10 text-success border-success/25',
};

export function PayrollPeriodsClient() {
  const { periods, add, update, remove, open: openPeriod, close: closePeriod, setCompensationStatus } = useHRPayrollPeriodsStore();

  const { values } = usePageFilters([
    { key: 'q', label: 'بحث', type: 'text', placeholder: 'بحث بالكود أو الاسم…' },
    {
      key: 'status', label: 'الحالة', type: 'select',
      options: [
        { value: 'draft', label: PERIOD_STATUS_LABELS.draft },
        { value: 'open', label: PERIOD_STATUS_LABELS.open },
        { value: 'closed', label: PERIOD_STATUS_LABELS.closed },
      ],
    },
  ]);

  const q = ((values.q as string) ?? '').toLowerCase();
  const statusFilter = (values.status as StatusFilter) || 'all';

  const [viewMode, setViewMode] = React.useState<ViewMode>('cards');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<HRPayrollPeriodDraft>(EMPTY_DRAFT);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const perPage = 10;

  const filtered = React.useMemo(() =>
    periods
      .filter(p => {
        const matchQ = !q || p.code.toLowerCase().includes(q) || p.nameAr.includes(q) || p.nameEn.toLowerCase().includes(q);
        const matchS = statusFilter === 'all' || p.status === statusFilter;
        return matchQ && matchS;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [periods, q, statusFilter],
  );

  const total      = filtered.length;
  const paged      = filtered.slice((page - 1) * perPage, page * perPage);
  const draftCount = periods.filter(p => p.status === 'draft').length;
  const openCount  = periods.filter(p => p.status === 'open').length;
  const closedCount= periods.filter(p => p.status === 'closed').length;

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

      {/* ── Summary stat strip ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'إجمالي الفترات', value: periods.length, color: 'text-foreground',         bg: 'bg-card border-border' },
          { label: 'مسودة',           value: draftCount,      color: 'text-muted-foreground',   bg: 'bg-muted/30 border-border' },
          { label: 'مفتوحة',          value: openCount,       color: 'text-success',            bg: 'bg-success/6 border-success/20' },
          { label: 'مغلقة',           value: closedCount,     color: 'text-primary',            bg: 'bg-primary/6 border-primary/20' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-xl border px-4 py-3 shadow-soft', s.bg)}>
            <p className="text-[10px] font-medium text-muted-foreground">{s.label}</p>
            <p className={cn('text-2xl font-bold tabular-nums leading-none mt-0.5', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{total} فترة</span>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-border bg-card p-0.5 shadow-soft">
            <button
              onClick={() => setViewMode('cards')}
              className={cn('flex h-7 w-7 items-center justify-center rounded-lg transition-all', viewMode === 'cards' ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn('flex h-7 w-7 items-center justify-center rounded-lg transition-all', viewMode === 'table' ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground')}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />فترة جديدة
          </Button>
        </div>
      </div>

      {paged.length === 0 ? (
        <EmptyState icon={CalendarRange} title="لا توجد فترات" description="أنشئ فترة راتب جديدة للبدء." />
      ) : viewMode === 'cards' ? (
        /* ── CARDS VIEW ── */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-fade-in">
          {paged.map(p => {
            const style = PERIOD_CARD_STYLE[p.status] ?? PERIOD_CARD_STYLE.draft;
            const StatusIcon = style.icon;
            return (
              <Card key={p.id} className={cn('luxe-card border transition-all duration-200 hover:shadow-elevated', style.border)}>
                <CardContent className={cn('p-0 overflow-hidden rounded-lg', style.bg)}>
                  {/* Card top bar */}
                  <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', style.border, style.bg)}>
                        <StatusIcon className={cn('h-4 w-4', style.iconColor)} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground leading-snug truncate">{p.nameAr}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{p.code}</p>
                      </div>
                    </div>
                    <Badge className={cn('shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-semibold', PERIOD_STATUS_COLORS[p.status])}>
                      {PERIOD_STATUS_LABELS[p.status]}
                    </Badge>
                  </div>

                  {/* Date range */}
                  <div className="mx-4 mb-3 flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground">
                    <CalendarRange className="h-3 w-3 shrink-0" />
                    <span className="font-mono">{p.periodStart}</span>
                    <ChevronRight className="h-3 w-3 opacity-40" />
                    <span className="font-mono">{p.periodEnd}</span>
                  </div>

                  {/* Compensation status */}
                  <div className="mx-4 mb-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground">حالة المراجعة</span>
                    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', COMP_STATUS_BADGE[p.compensationReviewStatus])}>
                      {p.compensationReviewStatus === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                      {COMPENSATION_STATUS_LABELS[p.compensationReviewStatus]}
                    </span>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-end gap-1 border-t border-border/50 bg-card/40 px-3 py-2">
                    <PeriodActions p={p} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="overflow-hidden rounded-2xl border border-border shadow-elevated animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-linear-to-b from-muted/70 to-muted/40 text-muted-foreground">
                  <th className="border-e border-border/60 px-4 py-3 text-right font-semibold text-xs">الكود</th>
                  <th className="border-e border-border/60 px-4 py-3 text-right font-semibold text-xs">الفترة</th>
                  <th className="border-e border-border/60 px-4 py-3 text-right font-semibold text-xs hidden md:table-cell">المدة</th>
                  <th className="border-e border-border/60 px-4 py-3 text-right font-semibold text-xs">حالة الفترة</th>
                  <th className="border-e border-border/60 px-4 py-3 text-right font-semibold text-xs hidden sm:table-cell">المراجعة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paged.map(p => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 even:bg-muted/10 hover:bg-primary/4 transition-colors duration-150">
                    <td className="border-e border-border/40 px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
                    </td>
                    <td className="border-e border-border/40 px-4 py-3">
                      <p className="font-semibold text-sm">{p.nameAr}</p>
                      {p.nameEn && <p className="text-[11px] text-muted-foreground">{p.nameEn}</p>}
                    </td>
                    <td className="border-e border-border/40 px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                        {p.periodStart}<ChevronRight className="h-3 w-3 opacity-40" />{p.periodEnd}
                      </span>
                    </td>
                    <td className="border-e border-border/40 px-4 py-3">
                      <Badge className={cn('rounded-lg border px-2 py-0.5 text-[10px] font-semibold', PERIOD_STATUS_COLORS[p.status])}>
                        {PERIOD_STATUS_LABELS[p.status]}
                      </Badge>
                    </td>
                    <td className="border-e border-border/40 px-4 py-3 hidden sm:table-cell">
                      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', COMP_STATUS_BADGE[p.compensationReviewStatus])}>
                        {p.compensationReviewStatus === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                        {COMPENSATION_STATUS_LABELS[p.compensationReviewStatus]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <PeriodActions p={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {total > perPage && (
        <div className="mt-4">
          <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={() => {}} />
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
