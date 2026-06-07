'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight, CalendarRange, Check, FileCheck, Eye, Shield,
  Users, Wallet, TrendingDown, BadgeCheck, ChevronRight,
  Sparkles, BarChart3, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { cn } from '@/shared/utils';
import {
  useHRPayrollPeriodsStore,
  PERIOD_STATUS_LABELS,
  type HRPayrollCompensationReviewStatus,
  type HRPayrollPeriodRecord,
  type HRPayrollMonthlyInput,
} from '@/features/hr/contracts/lib/payroll-periods-store';
import { useHRContractsStore } from '@/features/hr/contracts/lib/contracts-store';
import { useHRAllowanceTypesStore } from '@/features/hr/contracts/lib/allowance-types-store';
import {
  buildCompensationPreviews, lineNetFromVisibleColumns, formatLatinNumber,
  type CompensationColumnVisibility,
  type PayrollLineCompensationPreview,
} from '@/features/hr/contracts/lib/compensation-preview';
import { hrContractsRoutes } from '@/features/hr/contracts/constants/routes';

/* ── Inline-edit cell ──────────────────────────────────────────────────────── */
type EditRow = { overtime: string; bonus: string; absenceSar: string; late: string; penalties: string; admin: string };

function rowToEdits(row: PayrollLineCompensationPreview): EditRow {
  return {
    overtime:   String(row.entitlementOvertimeSar),
    bonus:      String(row.entitlementBonusSar),
    absenceSar: String(row.dedAbsenceSar),
    late:       String(row.dedLateSar),
    penalties:  String(row.dedPenaltiesSar),
    admin:      String(row.dedAdminSar),
  };
}

function EditCell({
  value, onChange, onCommit, colorClass, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  colorClass?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center">
      <input
        type="number"
        min={0}
        step="any"
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        className={cn(
          'w-22 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-center font-mono tabular-nums text-[11.5px] transition-all duration-150',
          'hover:border-border focus:border-primary/50 focus:bg-primary/5 focus:outline-none focus:ring-0',
          disabled ? 'pointer-events-none opacity-50' : 'cursor-text',
          colorClass,
        )}
      />
      {!disabled && (
        <Pencil className="absolute inset-e-0.5 top-0.5 h-2.5 w-2.5 text-muted-foreground/30 pointer-events-none" />
      )}
    </div>
  );
}

const REVIEW_STEPS: { key: HRPayrollCompensationReviewStatus; ar: string; icon: React.ElementType }[] = [
  { key: 'draft',        ar: 'مسودة',        icon: FileCheck },
  { key: 'first_review', ar: 'مراجعة أولى',  icon: Eye },
  { key: 'second_review',ar: 'مراجعة ثانية', icon: Eye },
  { key: 'approved',     ar: 'معتمد',         icon: Shield },
];

const STATUS_IDX: Record<HRPayrollCompensationReviewStatus, number> = {
  draft: 0, first_review: 1, second_review: 2, approved: 3,
};

const NEXT_REVIEW: Partial<Record<HRPayrollCompensationReviewStatus, HRPayrollCompensationReviewStatus>> = {
  draft: 'first_review', first_review: 'second_review', second_review: 'approved',
};

function advanceBtnLabel(s: HRPayrollCompensationReviewStatus): string {
  if (s === 'draft')        return 'تسجيل تمّت المراجعة الأولى';
  if (s === 'first_review') return 'تسجيل تمّت المراجعة الثانية';
  if (s === 'second_review')return 'تأكيد الاعتماد النهائي';
  return '';
}

function normalizePeriod(row: HRPayrollPeriodRecord): HRPayrollPeriodRecord {
  return {
    ...row,
    employmentLineMonthlyInputs: row.employmentLineMonthlyInputs ?? {},
    compensationReviewStatus: row.compensationReviewStatus ?? 'draft',
  };
}

const PERIOD_STATUS_BADGE: Record<string, string> = {
  draft:  'bg-muted text-muted-foreground border-border',
  open:   'bg-success/10 text-success border-success/30',
  closed: 'bg-primary/10 text-primary border-primary/30',
};

export function CompensationReportPanel({
  periodId,
  embedded = false,
  /** عند تحديده وعدم فراغه: عرض أسطر هؤلاء الموظفين فقط (مطابقة `employeeId` على سطر المسير) */
  employeeIdsFilter,
}: {
  periodId: string;
  embedded?: boolean;
  employeeIdsFilter?: string[] | undefined;
}) {
  const periods               = useHRPayrollPeriodsStore(s => s.periods);
  const fetchPeriods          = useHRPayrollPeriodsStore(s => s.fetch);
  const materialize           = useHRPayrollPeriodsStore(s => s.materializeFromContracts);
  const setCompensationStatus = useHRPayrollPeriodsStore(s => s.setCompensationStatus);
  const setMonthlyInputs      = useHRPayrollPeriodsStore(s => s.setMonthlyInputs);
  const contracts             = useHRContractsStore(s => s.contracts);
  const fetchContracts        = useHRContractsStore(s => s.fetch);
  const allowanceTypes        = useHRAllowanceTypesStore(s => s.items);
  const fetchAllowanceTypes   = useHRAllowanceTypesStore(s => s.fetch);

  // Load all data on mount if not already loaded
  React.useEffect(() => {
    if (periods.length === 0) fetchPeriods();
    if (contracts.length === 0) fetchContracts({});
    if (allowanceTypes.length === 0) fetchAllowanceTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive employment lines from contracts whenever both are available
  React.useEffect(() => {
    if (contracts.length > 0 && periods.length > 0) {
      materialize(contracts);
    }
  }, [contracts, periods.length, materialize]);

  const [cols, setCols] = React.useState<CompensationColumnVisibility>({
    colOvertime: true, colBonus: true,
    colDedAbsence: true, colDedLate: true, colDedPenalties: true, colDedAdmin: true,
  });
  const [edits, setEdits] = React.useState<Record<string, EditRow>>({});
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const raw    = periods.find(p => p.id === periodId);
  const period = React.useMemo(() => raw ? normalizePeriod(raw) : null, [raw]);

  const getContract = React.useCallback((id: string) => contracts.find(c => c.id === id),    [contracts]);
  const getAlloType  = React.useCallback((id: string) => allowanceTypes.find(a => a.id === id), [allowanceTypes]);

  const filterKey = employeeIdsFilter?.length ? [...employeeIdsFilter].sort().join(',') : '';
  const previews = React.useMemo(() => {
    if (!period) return [];
    let list = buildCompensationPreviews(period, getContract, getAlloType);
    if (filterKey) {
      const allow = new Set(filterKey.split(','));
      list = list.filter(r => allow.has(r.employeeId));
    }
    return list;
  }, [period, getContract, getAlloType, filterKey]);

  /* ── init edit state from previews ── */
  React.useEffect(() => {
    setEdits(prev => {
      const next: Record<string, EditRow> = { ...prev };
      previews.forEach(row => {
        if (!next[row.lineId]) next[row.lineId] = rowToEdits(row);
      });
      return next;
    });
  }, [previews]);

  const handleChange = (lineId: string, field: keyof EditRow, val: string) =>
    setEdits(e => ({ ...e, [lineId]: { ...e[lineId], [field]: val } }));

  const handleSave = React.useCallback((lineId: string, baseSalary: number) => {
    const editRow = edits[lineId];
    if (!editRow || !period) return;
    const existing = period.employmentLineMonthlyInputs?.[lineId] ?? [];
    const advanceRecovery = existing.filter(x => x.kind === 'advance_recovery');

    const p = (s: string) => Math.max(0, parseFloat(s) || 0);
    const overtime   = p(editRow.overtime);
    const bonus      = p(editRow.bonus);
    const absenceSar = p(editRow.absenceSar);
    const late       = p(editRow.late);
    const penalties  = p(editRow.penalties);
    const admin      = p(editRow.admin);

    const dailyRate   = baseSalary / 30;
    const absenceDays = dailyRate > 0 ? Math.round((absenceSar / dailyRate) * 1000) / 1000 : 0;

    const inputs: HRPayrollMonthlyInput[] = [
      ...advanceRecovery,
      ...(overtime    > 0 ? [{ kind: 'overtime_hours'    as const, value: overtime,    note: '' }] : []),
      ...(bonus       > 0 ? [{ kind: 'allowance_amount'  as const, value: bonus,       note: '' }] : []),
      ...(absenceDays > 0 ? [{ kind: 'absence_days'      as const, value: absenceDays, note: '' }] : []),
      ...(late        > 0 ? [{ kind: 'late_minutes'      as const, value: late,        note: '' }] : []),
      ...(penalties   > 0 ? [{ kind: 'deduction_amount'  as const, value: penalties,   note: '' }] : []),
      ...(admin       > 0 ? [{ kind: 'other'             as const, value: admin,        note: 'خصم او اضافة مباشرة' }] : []),
    ];

    setMonthlyInputs(periodId, lineId, inputs);
  }, [edits, period, periodId, setMonthlyInputs]);

  const fmt = (n: number, f = 2) => formatLatinNumber(n, f);
  const backHref = hrContractsRoutes.payrollPeriods;

  const backBtn = (
    <Link
      href={backHref}
      className="group inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground/70 shadow-soft transition-all hover:border-primary/30 hover:bg-accent hover:text-primary"
    >
      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      العودة إلى فترات الراتب
    </Link>
  );

  if (!periodId || !period) {
    if (embedded) return <p className="text-sm text-muted-foreground py-4">الفترة غير موجودة.</p>;
    return (
      <div className="flex flex-col items-start gap-4 p-6 animate-fade-in">
        {backBtn}
        <p className="text-sm text-muted-foreground">
          {!periodId ? 'معرّف الفترة غير صالح.' : 'الفترة غير موجودة.'}
        </p>
      </div>
    );
  }

  const hasLines  = period.employmentLines.length > 0;
  const filterActive = Boolean(filterKey);
  const compStatus = period.compensationReviewStatus;
  const reviewIdx  = STATUS_IDX[compStatus];
  const isApproved = compStatus === 'approved';

  /* ── Aggregate totals ── */
  const totalBase  = previews.reduce((s, r) => s + r.baseSalary, 0);
  const totalAllowances = previews.reduce((s, r) => s + r.allowancesMonthlyTotal, 0);
  const totalEntitlements = previews.reduce((s, r) => s + r.entitlementOvertimeSar + r.entitlementBonusSar, 0);
  const totalDed   = previews.reduce((s, r) => s + r.dedAbsenceSar + r.dedLateSar + r.dedPenaltiesSar + r.dedAdminSar, 0);
  const totalNet      = previews.reduce((s, r) => s + lineNetFromVisibleColumns(r, cols), 0);
  const totalDedNoAdmin = previews.reduce((s, r) => s + r.dedAbsenceSar + r.dedLateSar + r.dedPenaltiesSar, 0);
  const totalNetSar   = previews.reduce((s, r) => s + r.lineNetSar, 0);

  const handleAdvance = () => {
    if (!hasLines) { toast.error('تأكد من وجود سجلات في الفترة قبل تسجيل المراجعة.'); return; }
    const next = NEXT_REVIEW[compStatus];
    if (!next) return;
    setCompensationStatus(period.id, next);
    toast.success(next === 'approved' ? 'تم اعتماد المستحقات والخصومات.' : 'تم تسجيل مرحلة المراجعة.');
  };

  const toggleCol = (k: keyof CompensationColumnVisibility) =>
    setCols(c => ({ ...c, [k]: !c[k] }));

  return (
    <>
      {!embedded && <SetPageTitle titleAr={`تقرير المستحقات — ${period.nameAr || period.code}`} iconName="CalendarRange" />}

      <div className={cn('space-y-5 transition-opacity duration-500', mounted ? 'opacity-100' : 'opacity-0')}>

        {/* ══ BACK BUTTON ══ */}
        {!embedded && (
          <div className="flex justify-start">
            {backBtn}
          </div>
        )}

        {/* ══ REVIEW WORKFLOW ══ */}
        {!embedded && <Card className="overflow-hidden border-primary/20 animate-fade-in">
          <div className="relative overflow-hidden bg-linear-to-b from-primary/6 to-card">
            <div className="flex items-center gap-3 px-4 py-2.5">
              <p className="shrink-0 text-xs font-bold text-foreground">مسار المراجعة</p>

              {/* Steps (compact, inline) */}
              <div className="flex flex-1 items-center min-w-0" dir="ltr">
                {REVIEW_STEPS.map((st, i) => {
                  const done   = i < reviewIdx || isApproved;
                  const active = i === reviewIdx && !isApproved;
                  const filled = i > 0 && (reviewIdx >= i || isApproved);
                  const StepIcon = st.icon;
                  return (
                    <React.Fragment key={st.key}>
                      {i > 0 && (
                        <div className={cn(
                          'h-[2px] min-w-2 flex-1 rounded-full transition-all duration-500',
                          filled ? 'bg-primary' : 'bg-border',
                        )} />
                      )}
                      <div
                        title={st.ar}
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-300',
                          done   && 'border-success/50 bg-success/10 text-success',
                          active && 'border-primary bg-primary text-primary-foreground shadow-soft',
                          !done && !active && 'border-border bg-muted/30 text-muted-foreground',
                        )}
                      >
                        {done
                          ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          : <StepIcon className="h-3.5 w-3.5" />
                        }
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Action / status */}
              {isApproved ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-success/12 border border-success/25 px-2 py-1 text-[11px] font-bold text-success">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                  معتمد
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={handleAdvance}
                  disabled={!hasLines}
                  title={!hasLines ? 'أضف سجلات تشغيل أولاً' : undefined}
                  className="h-7 shrink-0 gap-1 px-2.5 text-xs"
                >
                  <Sparkles className="h-3 w-3" />
                  {advanceBtnLabel(compStatus)}
                </Button>
              )}
            </div>
          </div>
        </Card>}

        {/* ══ COLUMN TOGGLES ══ */}
        {!embedded && hasLines && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-soft animate-fade-in">
            <span className="text-xs font-semibold text-muted-foreground">إظهار الأعمدة</span>
            <div className="h-5 w-px bg-border hidden sm:block" />

            <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wide">مستحقات</span>
            {([
              { k: 'colOvertime', label: 'أوفر تايم' },
              { k: 'colBonus',    label: 'مكافآت' },
            ] as { k: keyof CompensationColumnVisibility; label: string }[]).map(({ k, label }) => (
              <button
                key={k}
                onClick={() => toggleCol(k)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
                  cols[k]
                    ? 'bg-primary text-primary-foreground border-primary shadow-soft'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground',
                )}
              >
                {cols[k] && <Check className="h-3 w-3" />}
                {label}
              </button>
            ))}

            <div className="h-5 w-px bg-border" />
            <span className="text-[10px] font-bold text-destructive/80 uppercase tracking-wide">خصومات</span>
            {([
              { k: 'colDedAbsence',   label: 'غياب' },
              { k: 'colDedLate',      label: 'تأخير' },
              { k: 'colDedPenalties', label: 'جزاءات' },
              { k: 'colDedAdmin',     label: 'خصم او اضافة مباشرة' },
            ] as { k: keyof CompensationColumnVisibility; label: string }[]).map(({ k, label }) => (
              <button
                key={k}
                onClick={() => toggleCol(k)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
                  cols[k]
                    ? 'bg-destructive/10 text-destructive border-destructive/30 shadow-soft'
                    : 'bg-card text-muted-foreground border-border hover:border-destructive/30 hover:text-foreground',
                )}
              >
                {cols[k] && <Check className="h-3 w-3" />}
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ══ TABLE / EMPTY STATE ══ */}
        {!hasLines ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">لا توجد سجلات تشغيل</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              عُد إلى تعديل الفترة وأضف الموظفين أو مزامنة لقطة العقود لعرض التقرير.
            </p>
          </div>
        ) : previews.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">لا توجد نتائج</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {filterActive
                ? 'لا يوجد موظفون مطابقون لتصفية الموظفين الحالية. غيّر التصفية أو اختر «جميع الموظفين».'
                : 'تعذر عرض صفوف التقرير لهذه الفترة.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border shadow-elevated animate-fade-in">
            <div className="overflow-x-auto">
              <table className={cn('w-full border-collapse text-[11.5px]', embedded ? 'min-w-[680px]' : 'min-w-[860px]')}>
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-gradient-to-b from-muted/80 to-muted/50 backdrop-blur-sm text-muted-foreground">
                    <th className="w-9 border-e border-border/60 px-2 py-3 text-center font-semibold">#</th>
                    <th className="min-w-[9.5rem] border-e border-border/60 px-3 py-3 text-right font-semibold">الموظف</th>
                    {!embedded && <th className="min-w-[11rem] border-e border-border/60 px-3 py-3 text-right font-semibold">البدلات (شهري)</th>}
                    <th className="min-w-[5.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold">الراتب الأساسي</th>
                    {embedded  && <th className="min-w-[5rem] border-e border-border/60 px-3 py-3 text-center font-semibold">البدلات</th>}
                    {!embedded && cols.colOvertime   && <th className="min-w-[5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-primary/80">أوفر تايم</th>}
                    {!embedded && cols.colBonus      && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-primary/80">مكافآت</th>}
                    {embedded  && <th className="min-w-[5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-primary/80">مستحقات</th>}
                    {!embedded && cols.colDedAbsence && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-warning">غياب</th>}
                    {!embedded && cols.colDedLate    && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-destructive">تأخير</th>}
                    {!embedded && cols.colDedPenalties&&<th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-destructive">جزاءات</th>}
                    {!embedded && cols.colDedAdmin   && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold">خصم او اضافة مباشرة</th>}
                    {embedded  && <th className="min-w-[5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-destructive/80">خصومات</th>}
                    <th className="min-w-[6rem] bg-primary/6 px-3 py-3 text-center font-bold text-primary">الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  {previews.map((row, i) => {
                    const net = lineNetFromVisibleColumns(row, cols);
                    const e   = edits[row.lineId] ?? rowToEdits(row);
                    const chg = (f: keyof EditRow) => (v: string) => handleChange(row.lineId, f, v);
                    const sav = () => handleSave(row.lineId, row.baseSalary);
                    return (
                      <tr
                        key={row.lineId}
                        className="group border-b border-border/50 last:border-0 even:bg-muted/15 hover:bg-primary/4 transition-colors duration-150"
                      >
                        <td className="border-e border-border/40 px-2 py-2 text-center font-mono text-[10px] text-muted-foreground tabular-nums">
                          {fmt(i + 1, 0)}
                        </td>
                        <td className="border-e border-border/40 px-3 py-2 text-right">
                          <span className="font-semibold text-foreground">{row.namePrimary}</span>
                        </td>
                        {!embedded && (
                          <td className="border-e border-border/40 px-3 py-2 text-right">
                            {row.allowanceLines.length === 0 ? (
                              <span className="text-muted-foreground text-[10px]">—</span>
                            ) : (
                              <div className="space-y-0.5">
                                {row.allowanceLines.map(a => (
                                  <div key={a.labelAr} className="flex justify-between gap-2 text-[10px]">
                                    <span className="text-muted-foreground">{a.labelAr}</span>
                                    <span className="font-mono font-semibold tabular-nums text-primary">{fmt(a.amount)}</span>
                                  </div>
                                ))}
                                <div className="mt-0.5 border-t border-border/40 pt-0.5 text-right text-[10px] font-bold">
                                  ∑ <span className="font-mono text-primary">{fmt(row.allowancesMonthlyTotal)}</span>
                                </div>
                              </div>
                            )}
                          </td>
                        )}
                        <td className="border-e border-border/40 px-3 py-2 text-center font-mono font-semibold tabular-nums">
                          {fmt(row.baseSalary)}
                        </td>
                        {embedded && (
                          <td className="border-e border-border/40 px-3 py-2 text-center font-mono tabular-nums">
                            {fmt(row.allowancesMonthlyTotal)}
                          </td>
                        )}
                        {!embedded && cols.colOvertime    && <td className="border-e border-border/40 px-1 py-1"><EditCell value={e.overtime}   onChange={chg('overtime')}   onCommit={sav} colorClass="text-primary"           disabled={isApproved} /></td>}
                        {!embedded && cols.colBonus       && <td className="border-e border-border/40 px-1 py-1"><EditCell value={e.bonus}      onChange={chg('bonus')}      onCommit={sav} colorClass="text-primary"           disabled={isApproved} /></td>}
                        {embedded && (
                          <td className="border-e border-border/40 px-3 py-2 text-center font-mono tabular-nums text-primary">
                            {fmt(row.entitlementOvertimeSar + row.entitlementBonusSar)}
                          </td>
                        )}
                        {!embedded && cols.colDedAbsence  && <td className="border-e border-border/40 px-1 py-1"><EditCell value={e.absenceSar} onChange={chg('absenceSar')} onCommit={sav} colorClass="text-warning"           disabled={isApproved} /></td>}
                        {!embedded && cols.colDedLate     && <td className="border-e border-border/40 px-1 py-1"><EditCell value={e.late}       onChange={chg('late')}       onCommit={sav} colorClass="text-destructive"       disabled={isApproved} /></td>}
                        {!embedded && cols.colDedPenalties&& <td className="border-e border-border/40 px-1 py-1"><EditCell value={e.penalties}  onChange={chg('penalties')}  onCommit={sav} colorClass="text-destructive"       disabled={isApproved} /></td>}
                        {!embedded && cols.colDedAdmin    && <td className="border-e border-border/40 px-1 py-1"><EditCell value={e.admin}      onChange={chg('admin')}      onCommit={sav} colorClass="text-muted-foreground" disabled={isApproved} /></td>}
                        {embedded && (
                          <td className="border-e border-border/40 px-3 py-2 text-center font-mono tabular-nums text-destructive">
                            {fmt(row.dedAbsenceSar + row.dedLateSar + row.dedPenaltiesSar)}
                          </td>
                        )}
                        <td className={cn(
                          'bg-primary/5 px-3 py-2 text-center font-mono font-bold tabular-nums',
                          (embedded ? row.lineNetSar : net) < 0 ? 'text-destructive' : 'text-foreground',
                        )}>
                          {fmt(embedded ? row.lineNetSar : net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals footer */}
                <tfoot>
                  <tr className="border-t-2 border-primary/20 bg-gradient-to-b from-primary/6 to-primary/3 font-bold text-[11.5px]">
                    {embedded ? (
                      <>
                        <td colSpan={2} className="border-e border-border/60 px-3 py-3 text-right text-xs font-bold text-primary">المجموع الكلي</td>
                        <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums">{fmt(totalBase)}</td>
                        <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums">{fmt(totalAllowances)}</td>
                        <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-primary">{fmt(totalEntitlements)}</td>
                        <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-destructive">{fmt(totalDedNoAdmin)}</td>
                        <td className={cn('bg-primary/10 px-3 py-3 text-center font-mono font-extrabold tabular-nums text-sm', totalNetSar < 0 ? 'text-destructive' : 'text-primary')}>
                          {fmt(totalNetSar)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td colSpan={3} className="border-e border-border/60 px-3 py-3 text-right text-xs font-bold text-primary">
                          المجموع الكلي
                        </td>
                        <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums">
                          {fmt(totalBase)}
                        </td>
                        {cols.colOvertime    && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-primary">{fmt(previews.reduce((s,r)=>s+r.entitlementOvertimeSar,0))}</td>}
                        {cols.colBonus       && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-primary">{fmt(previews.reduce((s,r)=>s+r.entitlementBonusSar,0))}</td>}
                        {cols.colDedAbsence  && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-warning">{fmt(previews.reduce((s,r)=>s+r.dedAbsenceSar,0))}</td>}
                        {cols.colDedLate     && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-destructive">{fmt(previews.reduce((s,r)=>s+r.dedLateSar,0))}</td>}
                        {cols.colDedPenalties&& <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-destructive">{fmt(previews.reduce((s,r)=>s+r.dedPenaltiesSar,0))}</td>}
                        {cols.colDedAdmin    && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-muted-foreground">{fmt(previews.reduce((s, r) => s + r.dedAdminSar, 0))}</td>}
                        <td className={cn(
                          'bg-primary/10 px-3 py-3 text-center font-mono font-extrabold tabular-nums text-sm',
                          totalNet < 0 ? 'text-destructive' : 'text-primary',
                        )}>
                          {fmt(totalNet)}
                        </td>
                      </>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
