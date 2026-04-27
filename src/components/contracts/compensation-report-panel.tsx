'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight, CalendarRange, Check, FileCheck, Eye, Shield,
  Users, Wallet, TrendingDown, BadgeCheck, ChevronRight,
  Sparkles, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SetPageTitle } from '@/components/set-page-title';
import { cn } from '@/lib/utils';
import {
  useHRPayrollPeriodsStore,
  PERIOD_STATUS_LABELS,
  type HRPayrollCompensationReviewStatus,
  type HRPayrollPeriodRecord,
} from '@/lib/contracts/payroll-periods-store';
import { useHRContractsStore } from '@/lib/contracts/contracts-store';
import { useHRAllowanceTypesStore } from '@/lib/contracts/allowance-types-store';
import {
  buildCompensationPreviews, lineNetFromVisibleColumns, formatLatinNumber,
  type CompensationColumnVisibility,
} from '@/lib/contracts/compensation-preview';

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

export function CompensationReportPanel({ periodId }: { periodId: string }) {
  const periods             = useHRPayrollPeriodsStore(s => s.periods);
  const setCompensationStatus = useHRPayrollPeriodsStore(s => s.setCompensationStatus);
  const contracts           = useHRContractsStore(s => s.contracts);
  const allowanceTypes      = useHRAllowanceTypesStore(s => s.items);

  const [cols, setCols] = React.useState<CompensationColumnVisibility>({
    colOvertime: true, colBonus: true,
    colDedAbsence: true, colDedLate: true, colDedPenalties: true, colDedAdmin: true,
  });
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const raw    = periods.find(p => p.id === periodId);
  const period = React.useMemo(() => raw ? normalizePeriod(raw) : null, [raw]);

  const getContract = React.useCallback((id: string) => contracts.find(c => c.id === id),    [contracts]);
  const getAlloType  = React.useCallback((id: string) => allowanceTypes.find(a => a.id === id), [allowanceTypes]);

  const previews = React.useMemo(() => {
    if (!period) return [];
    return buildCompensationPreviews(period, getContract, getAlloType);
  }, [period, getContract, getAlloType]);

  const fmt = (n: number, f = 2) => formatLatinNumber(n, f);
  const backHref = '/hr/contracts/payroll-periods';

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
  const compStatus = period.compensationReviewStatus;
  const reviewIdx  = STATUS_IDX[compStatus];
  const isApproved = compStatus === 'approved';

  /* ── Aggregate totals ── */
  const totalBase  = previews.reduce((s, r) => s + r.baseSalary, 0);
  const totalAllowances = previews.reduce((s, r) => s + r.allowancesMonthlyTotal, 0);
  const totalEntitlements = previews.reduce((s, r) => s + r.entitlementOvertimeSar + r.entitlementBonusSar, 0);
  const totalDed   = previews.reduce((s, r) => s + r.dedAbsenceSar + r.dedLateSar + r.dedPenaltiesSar + r.dedAdminSar, 0);
  const totalNet   = previews.reduce((s, r) => s + lineNetFromVisibleColumns(r, cols), 0);

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
      <SetPageTitle titleAr={`تقرير المستحقات — ${period.nameAr || period.code}`} iconName="CalendarRange" />

      <div className={cn('space-y-5 transition-opacity duration-500', mounted ? 'opacity-100' : 'opacity-0')}>

        {/* ══ HERO HEADER ══ */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card shadow-soft">
          <div className="absolute inset-0 dotted-bg opacity-30 pointer-events-none" />
          <div className="absolute -top-8 -start-8 h-32 w-32 rounded-full bg-primary/6 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -end-6 h-24 w-24 rounded-full bg-gold/8 blur-2xl pointer-events-none" />

          <div className="relative flex flex-wrap items-start justify-between gap-4 px-6 py-5">
            <div className="space-y-2.5">
              {backBtn}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <BarChart3 className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground leading-tight">
                    {period.nameAr || period.code}
                  </h1>
                  <p className="text-xs text-muted-foreground">تقرير المستحقات والخصومات</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground border border-border/60">
                  <CalendarRange className="h-3.5 w-3.5" />
                  <span className="font-mono">{period.periodStart}</span>
                  <ChevronRight className="h-3 w-3 opacity-40" />
                  <span className="font-mono">{period.periodEnd}</span>
                </span>
                <Badge
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-medium',
                    PERIOD_STATUS_BADGE[period.status] ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  {PERIOD_STATUS_LABELS[period.status]}
                </Badge>
                {isApproved && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-success/10 border border-success/25 px-2.5 py-1 text-xs font-semibold text-success animate-fade-in">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    معتمد نهائياً
                  </span>
                )}
              </div>
            </div>

            {!isApproved && hasLines && (
              <Button
                onClick={handleAdvance}
                className="shrink-0 shadow-elevated gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                {advanceBtnLabel(compStatus)}
              </Button>
            )}
          </div>
        </div>

        {/* ══ SUMMARY STAT CARDS ══ */}
        {hasLines && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-in">
            {[
              {
                label: 'الموظفون',
                value: fmt(previews.length, 0),
                sub: 'سجل تشغيل',
                icon: Users,
                color: 'text-primary',
                bg: 'bg-primary/8 border-primary/20',
              },
              {
                label: 'إجمالي الرواتب',
                value: fmt(totalBase + totalAllowances),
                sub: 'أساسي + بدلات',
                icon: Wallet,
                color: 'text-gold',
                bg: 'bg-gold/8 border-gold/20',
              },
              {
                label: 'إجمالي الخصومات',
                value: fmt(totalDed),
                sub: 'كل أنواع الخصم',
                icon: TrendingDown,
                color: 'text-destructive',
                bg: 'bg-destructive/8 border-destructive/20',
              },
              {
                label: 'صافي المستحق',
                value: fmt(totalNet),
                sub: 'بعد جميع التعديلات',
                icon: BadgeCheck,
                color: 'text-success',
                bg: 'bg-success/8 border-success/20',
              },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <Card key={label} className={cn('luxe-card border', bg, 'transition-all duration-300')}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground truncate">{label}</p>
                      <p className={cn('mt-1 text-xl font-bold font-mono tabular-nums leading-none', color)}>
                        {value}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{sub}</p>
                    </div>
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border', bg)}>
                      <Icon className={cn('h-4 w-4', color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ══ REVIEW WORKFLOW ══ */}
        <Card className="overflow-hidden border-primary/20 animate-fade-in">
          <div className="relative overflow-hidden bg-gradient-to-b from-primary/6 to-card">
            <div className="flex items-center justify-between gap-3 border-b border-border/50 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-foreground">مسار مراجعة التقرير</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  مستقل عن حالة الفترة — يُعاد لمسودة عند تغيير لقطة العقود.
                </p>
              </div>
              {isApproved && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-success/12 border border-success/25 px-3 py-1.5 text-xs font-bold text-success animate-fade-in">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  معتمد
                </span>
              )}
            </div>

            <div className="px-5 py-5">
              {/* Steps */}
              <div className="flex w-full items-center" dir="ltr">
                {REVIEW_STEPS.map((st, i) => {
                  const done   = i < reviewIdx || isApproved;
                  const active = i === reviewIdx && !isApproved;
                  const filled = i > 0 && (reviewIdx >= i || isApproved);
                  const StepIcon = st.icon;
                  return (
                    <React.Fragment key={st.key}>
                      {i > 0 && (
                        <div className={cn(
                          'h-[2px] min-w-4 flex-1 rounded-full transition-all duration-500',
                          filled ? 'bg-primary' : 'bg-border',
                        )} />
                      )}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-300',
                          done   && 'border-success/50 bg-success/10 text-success shadow-sm',
                          active && 'border-primary bg-primary text-primary-foreground shadow-elevated scale-110',
                          !done && !active && 'border-border bg-muted/30 text-muted-foreground',
                        )}>
                          {done
                            ? <Check className="h-4 w-4" strokeWidth={2.5} />
                            : <StepIcon className="h-4 w-4" />
                          }
                        </div>
                        <p className={cn(
                          'w-20 text-center text-[9px] font-semibold leading-tight',
                          active ? 'text-primary' : done ? 'text-success' : 'text-muted-foreground',
                        )}>
                          {st.ar}
                        </p>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Action row */}
              <div className="mt-4 pt-4 border-t border-border/50">
                {isApproved ? (
                  <p className="text-center text-xs text-success font-medium">
                    ✓ تقرير المستحقات والخصومات في حالة اعتماد نهائي.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] text-muted-foreground sm:max-w-[60%]">
                      بعد الاطلاع والتحقق من الجدول، سجّل مرحلة المراجعة. الخطوة الأخيرة هي الاعتماد النهائي.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleAdvance}
                      disabled={!hasLines}
                      title={!hasLines ? 'أضف سجلات تشغيل أولاً' : undefined}
                      className="shrink-0 gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {advanceBtnLabel(compStatus)}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* ══ COLUMN TOGGLES ══ */}
        {hasLines && (
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
              { k: 'colDedAdmin',     label: 'إداري' },
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
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border shadow-elevated animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-[11.5px]">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-gradient-to-b from-muted/80 to-muted/50 backdrop-blur-sm text-muted-foreground">
                    <th className="w-9 border-e border-border/60 px-2 py-3 text-center font-semibold">#</th>
                    <th className="min-w-[9.5rem] border-e border-border/60 px-3 py-3 text-right font-semibold">الموظف</th>
                    <th className="min-w-[11rem] border-e border-border/60 px-3 py-3 text-right font-semibold">البدلات (شهري)</th>
                    <th className="min-w-[5.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold">الراتب الأساسي</th>
                    {cols.colOvertime   && <th className="min-w-[5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-primary/80">أوفر تايم</th>}
                    {cols.colBonus      && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-primary/80">مكافآت</th>}
                    {cols.colDedAbsence && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-warning">غياب</th>}
                    {cols.colDedLate    && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-destructive">تأخير</th>}
                    {cols.colDedPenalties&&<th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold text-destructive">جزاءات</th>}
                    {cols.colDedAdmin   && <th className="min-w-[4.5rem] border-e border-border/60 px-3 py-3 text-center font-semibold">إداري</th>}
                    <th className="min-w-[6rem] bg-primary/6 px-3 py-3 text-center font-bold text-primary">الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  {previews.map((row, i) => {
                    const net = lineNetFromVisibleColumns(row, cols);
                    return (
                      <tr
                        key={row.lineId}
                        className="group border-b border-border/50 last:border-0 even:bg-muted/15 hover:bg-primary/4 transition-colors duration-150"
                      >
                        <td className="border-e border-border/40 px-2 py-2.5 text-center font-mono text-[10px] text-muted-foreground tabular-nums">
                          {fmt(i + 1, 0)}
                        </td>
                        <td className="border-e border-border/40 px-3 py-2.5 text-right">
                          <span className="font-semibold text-foreground">{row.namePrimary}</span>
                        </td>
                        <td className="border-e border-border/40 px-3 py-2.5 text-right">
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
                        <td className="border-e border-border/40 px-3 py-2.5 text-center font-mono font-semibold tabular-nums">
                          {fmt(row.baseSalary)}
                        </td>
                        {cols.colOvertime    && <td className="border-e border-border/40 px-3 py-2.5 text-center font-mono tabular-nums text-primary">{fmt(row.entitlementOvertimeSar)}</td>}
                        {cols.colBonus       && <td className="border-e border-border/40 px-3 py-2.5 text-center font-mono tabular-nums text-primary">{fmt(row.entitlementBonusSar)}</td>}
                        {cols.colDedAbsence  && <td className="border-e border-border/40 px-3 py-2.5 text-center font-mono tabular-nums text-warning">{fmt(row.dedAbsenceSar)}</td>}
                        {cols.colDedLate     && <td className="border-e border-border/40 px-3 py-2.5 text-center font-mono tabular-nums text-destructive">{fmt(row.dedLateSar)}</td>}
                        {cols.colDedPenalties&& <td className="border-e border-border/40 px-3 py-2.5 text-center font-mono tabular-nums text-destructive">{fmt(row.dedPenaltiesSar)}</td>}
                        {cols.colDedAdmin    && <td className="border-e border-border/40 px-3 py-2.5 text-center font-mono tabular-nums text-muted-foreground">{fmt(row.dedAdminSar)}</td>}
                        <td className={cn(
                          'bg-primary/5 px-3 py-2.5 text-center font-mono font-bold tabular-nums',
                          net < 0 ? 'text-destructive' : 'text-foreground',
                        )}>
                          {fmt(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals footer */}
                <tfoot>
                  <tr className="border-t-2 border-primary/20 bg-gradient-to-b from-primary/6 to-primary/3 font-bold text-[11.5px]">
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
                    {cols.colDedAdmin    && <td className="border-e border-border/60 px-3 py-3 text-center font-mono tabular-nums text-muted-foreground">{fmt(0)}</td>}
                    <td className={cn(
                      'bg-primary/10 px-3 py-3 text-center font-mono font-extrabold tabular-nums text-sm',
                      totalNet < 0 ? 'text-destructive' : 'text-primary',
                    )}>
                      {fmt(totalNet)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {hasLines && (
          <div className="flex justify-start pt-1 animate-fade-in">
            {backBtn}
          </div>
        )}
      </div>
    </>
  );
}
