'use client';

import * as React from 'react';
import { TrendingUp, Users, CalendarOff, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  MOCK_ANALYTICS_EMPLOYEES,
  MOCK_ANALYTICS_TIMELINE_BARS,
  MOCK_BRANCHES,
  MOCK_UNIFIED_LEAVES,
} from '@/lib/leaves/unified-mock';
import type { EmployeeLeaveAnalyticsRow, TimelineLeaveBar } from '@/lib/leaves/types';

// ─── colour maps ─────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  annual: 'bg-primary/80 text-primary-foreground',
  sick: 'bg-amber-500/80 text-white',
  unpaid: 'bg-muted text-muted-foreground border border-border',
  maternity: 'bg-pink-500/80 text-white',
  emergency: 'bg-destructive/80 text-white',
};

const TYPE_LABEL: Record<string, string> = {
  annual: 'سنوية', sick: 'مرضية', unpaid: 'بدون راتب', maternity: 'أمومة', emergency: 'طارئة',
};

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft flex items-start gap-4">
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', accent ?? 'bg-primary/10')}>
        <Icon className={cn('h-5 w-5', accent ? 'text-white' : 'text-primary')} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Branch breakdown bar ─────────────────────────────────────────────────────

function BranchBar() {
  const counts = React.useMemo(() => {
    const map: Record<string, number> = {};
    MOCK_UNIFIED_LEAVES.forEach((l) => { map[l.requestBranchId] = (map[l.requestBranchId] ?? 0) + 1; });
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return MOCK_BRANCHES.map((b) => ({ ...b, count: map[b.id] ?? 0, pct: Math.round(((map[b.id] ?? 0) / total) * 100) }));
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-4">
      <p className="font-semibold">توزيع الإجازات حسب الفرع</p>
      <div className="flex h-3 overflow-hidden rounded-full">
        {counts.map((b, i) => (
          <div
            key={b.id}
            className={cn('h-full transition-all', i === 0 ? 'bg-primary' : i === 1 ? 'bg-amber-500' : 'bg-pink-500')}
            style={{ width: `${b.pct}%` }}
          />
        ))}
      </div>
      <div className="flex gap-4">
        {counts.map((b, i) => (
          <div key={b.id} className="flex items-center gap-1.5 text-xs">
            <span className={cn('h-2.5 w-2.5 rounded-full', i === 0 ? 'bg-primary' : i === 1 ? 'bg-amber-500' : 'bg-pink-500')} />
            <span className="text-muted-foreground">{b.nameAr}</span>
            <span className="font-semibold">{b.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Employee card ────────────────────────────────────────────────────────────

function EmployeeCard({ row }: { row: EmployeeLeaveAnalyticsRow }) {
  const annualPct = row.annualTotal > 0 ? Math.round((row.annualConsumed / row.annualTotal) * 100) : 0;
  const sickPct = row.sickCap > 0 ? Math.round((row.sickUsed / row.sickCap) * 100) : 0;
  const branch = MOCK_BRANCHES.find((b) => b.id === row.branchId);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: `hsl(${row.avatarHue} 60% 45%)` }}
        >
          {row.nameAr.split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-sm">{row.nameAr}</p>
          <p className="truncate text-xs text-muted-foreground">{row.roleAr} · {branch?.nameAr}</p>
        </div>
        {row.absenceDays > 0 && (
          <span className="mr-auto shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
            {row.absenceDays} غياب
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>سنوية</span>
          <span>{row.annualConsumed}/{row.annualTotal} يوم</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${annualPct}%` }} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>مرضية</span>
          <span>{row.sickUsed}/{row.sickCap} يوم</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${sickPct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineView() {
  const [monthOffset, setMonthOffset] = React.useState(0);
  const now = new Date(2026, 3 + monthOffset, 1); // April 2026 base
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = now.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const barsInView = MOCK_ANALYTICS_TIMELINE_BARS.filter((bar) => {
    const s = new Date(bar.rangeStart);
    const e = new Date(bar.rangeEnd);
    const mStart = new Date(year, month, 1);
    const mEnd = new Date(year, month, daysInMonth);
    return s <= mEnd && e >= mStart;
  });

  const employees = MOCK_ANALYTICS_EMPLOYEES.filter((e) => barsInView.some((b) => b.employeeId === e.id));

  return (
    <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="font-semibold">الجدول الزمني للإجازات</p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setMonthOffset((o) => o - 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="min-w-[120px] text-center text-sm font-medium">{monthLabel}</span>
          <Button variant="ghost" size="icon" onClick={() => setMonthOffset((o) => o + 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day header */}
          <div className="flex border-b border-border bg-muted/40">
            <div className="w-40 shrink-0 px-4 py-2 text-xs font-semibold text-muted-foreground">الموظف</div>
            {days.map((d) => (
              <div key={d} className="flex-1 py-2 text-center text-[10px] text-muted-foreground font-mono">{d}</div>
            ))}
          </div>
          {/* Rows */}
          {employees.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">لا توجد إجازات في هذا الشهر</div>
          ) : employees.map((emp) => {
            const empBars = barsInView.filter((b) => b.employeeId === emp.id);
            return (
              <div key={emp.id} className="flex items-center border-b border-border/50 last:border-0">
                <div className="w-40 shrink-0 px-4 py-3 text-xs font-medium truncate">{emp.nameAr}</div>
                <div className="relative flex flex-1 items-center" style={{ height: 36 }}>
                  {days.map((d) => {
                    const date = new Date(year, month, d);
                    const bar = empBars.find((b) => new Date(b.rangeStart) <= date && new Date(b.rangeEnd) >= date);
                    return (
                      <div
                        key={d}
                        className={cn('flex-1 h-6 mx-px rounded-sm transition-colors', bar ? TYPE_COLOR[bar.leaveType] : 'bg-transparent')}
                        title={bar ? TYPE_LABEL[bar.leaveType] : undefined}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 border-t border-border px-5 py-3">
        {Object.entries(TYPE_LABEL).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('h-2.5 w-2.5 rounded-sm', TYPE_COLOR[k]?.split(' ')[0])} />
            {v}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AnalyticsClient() {
  const [branchFilter, setBranchFilter] = React.useState('all');

  const totalLeaves = MOCK_UNIFIED_LEAVES.length;
  const approved = MOCK_UNIFIED_LEAVES.filter((l) => l.status === 'approved').length;
  const pending = MOCK_UNIFIED_LEAVES.filter((l) => l.status === 'pending').length;
  const totalDays = MOCK_UNIFIED_LEAVES.reduce((s, l) => s + l.workingDays, 0);

  const filteredEmployees = branchFilter === 'all'
    ? MOCK_ANALYTICS_EMPLOYEES
    : MOCK_ANALYTICS_EMPLOYEES.filter((e) => e.branchId === branchFilter);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="إجمالي الطلبات" value={totalLeaves} sub="في النظام" icon={Users} />
        <KpiCard label="معتمدة" value={approved} sub={`${Math.round((approved / totalLeaves) * 100)}% من الإجمالي`} icon={TrendingUp} accent="bg-emerald-500" />
        <KpiCard label="قيد الانتظار" value={pending} sub="تحتاج إجراء" icon={Clock} accent="bg-amber-500" />
        <KpiCard label="أيام مُستهلكة" value={totalDays} sub="يوم عمل فعلي" icon={CalendarOff} accent="bg-primary" />
      </div>

      {/* Branch bar */}
      <BranchBar />

      {/* Timeline */}
      <TimelineView />

      {/* Employee cards */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold">أرصدة الموظفين</p>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="الفرع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفروع</SelectItem>
              {MOCK_BRANCHES.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.nameAr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEmployees.map((row) => (
            <EmployeeCard key={row.id} row={row} />
          ))}
        </div>
      </div>
    </div>
  );
}
