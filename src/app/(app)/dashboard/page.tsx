'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users, UserCheck, FileCheck2, Wallet, Clock, AlertCircle, Plus, ArrowLeft,
  Building2, CalendarDays, Sparkles, TrendingUp, UserPlus, FileText,
  ShieldAlert, ClipboardList, CheckCircle2, Settings,
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';
import { KpiCard } from '@/components/kpi-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { data, getEmployee } from '@/lib/data';
import { relativeTime, getInitials, cn } from '@/lib/utils';
import { useSetPageTitle } from '@/components/page-title-context';
import { useHRViolationCasesStore } from '@/lib/hr-discipline/violation-cases-store';
import { useHRContractsStore } from '@/lib/contracts/contracts-store';
import { useHRRequestSubmissionsStore } from '@/lib/hr-requests/submissions-store';
import { MOCK_UNIFIED_LEAVES } from '@/lib/leaves/unified-mock';

const iconMap: Record<string, React.ElementType> = {
  FileText, Clock, UserPlus, Wallet, CheckCircle2, Settings,
};

const TOOLTIP_STYLE: React.CSSProperties = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  direction: 'rtl',
  fontSize: 12,
};

export default function DashboardPage() {
  useSetPageTitle({ titleAr: 'لوحة التحكم', descriptionAr: 'نظرة عامة على أداء المنظمة', iconName: 'LayoutDashboard' });

  /* ── Store reads ──────────────────────────────────────────────────── */
  const { cases } = useHRViolationCasesStore();
  const { contracts } = useHRContractsStore();
  const { submissions } = useHRRequestSubmissionsStore();

  /* ── Attendance ───────────────────────────────────────────────────── */
  const totalEmployees = data.company.totalEmployees;
  const presentCount = data.attendanceToday.filter(a => a.status === 'present').length;
  const lateCount = data.attendanceToday.filter(a => a.status === 'late').length;
  const absentCount = data.attendanceToday.filter(a => a.status === 'absent').length;
  const attendanceRate = Math.round(((presentCount + lateCount) / data.attendanceToday.length) * 100);
  const pendingRequests = data.requests.filter(r => r.status === 'pending').length;
  const lateEmployees = data.attendanceToday
    .filter(a => a.status === 'late' || a.status === 'absent')
    .map(a => ({ ...a, employee: getEmployee(a.employeeId)! }))
    .filter(a => a.employee);

  /* ── Violations ───────────────────────────────────────────────────── */
  const underReviewCases = cases.filter(c => c.status === 'under_review');
  const violationsByStatus = [
    { name: 'مسودة',        value: cases.filter(c => c.status === 'draft').length,        color: '#94a3b8' },
    { name: 'قيد الاعتماد', value: cases.filter(c => c.status === 'under_review').length,  color: '#f59e0b' },
    { name: 'معتمد',        value: cases.filter(c => c.status === 'approved').length,      color: '#10b981' },
    { name: 'مرفوض',        value: cases.filter(c => c.status === 'rejected').length,      color: '#ef4444' },
  ].filter(d => d.value > 0);

  /* ── Contracts ────────────────────────────────────────────────────── */
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  /* ── Leaves ───────────────────────────────────────────────────────── */
  const pendingLeaves = MOCK_UNIFIED_LEAVES.filter(l => l.status === 'pending').length;
  const approvedLeaves = MOCK_UNIFIED_LEAVES.filter(l => l.status === 'approved').length;
  const leavesByType = [
    { type: 'سنوية',       count: MOCK_UNIFIED_LEAVES.filter(l => l.type === 'annual').length,    fill: '#0f766e' },
    { type: 'مرضية',       count: MOCK_UNIFIED_LEAVES.filter(l => l.type === 'sick').length,      fill: '#0891b2' },
    { type: 'طارئة',       count: MOCK_UNIFIED_LEAVES.filter(l => l.type === 'emergency').length, fill: '#f59e0b' },
    { type: 'أمومة',       count: MOCK_UNIFIED_LEAVES.filter(l => l.type === 'maternity').length, fill: '#be185d' },
    { type: 'بدون راتب',   count: MOCK_UNIFIED_LEAVES.filter(l => l.type === 'unpaid').length,    fill: '#7c3aed' },
  ];

  /* ── Department data ──────────────────────────────────────────────── */
  const deptData = [...data.departments]
    .sort((a, b) => b.employeesCount - a.employeesCount)
    .slice(0, 8)
    .map(d => ({ name: d.name, value: d.employeesCount, color: d.color }));

  /* ── Payroll ──────────────────────────────────────────────────────── */
  const payrollTrend = data.payrollTrend.map(t => ({
    month: t.month,
    إجمالي: Math.round(t.gross / 1000),
    صافي: Math.round(t.net / 1000),
  }));
  const maxBranchCost = Math.max(...data.payrollByBranch.map(b => b.cost));

  /* ── Branch donut ─────────────────────────────────────────────────── */
  const BRANCH_COLORS = ['#0f766e', '#ca8a04', '#be185d', '#7c3aed', '#0891b2', '#c2410c'];
  const branchData = data.branches.map((b, i) => ({ name: b.city, value: b.employeesCount, color: BRANCH_COLORS[i % 6] }));

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-linear-to-l from-primary via-primary to-primary-700 p-8 text-primary-foreground">
        <div className="absolute inset-0 bg-noise opacity-[0.06] mix-blend-overlay" />
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-48 w-48 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-gold">
              <Sparkles className="h-3 w-3" />
              <span>الأحد، ٢٧ أبريل ٢٠٢٦</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              مرحباً، عبدالرحمن <span className="text-gold">👋</span>
            </h1>
            <p className="max-w-xl text-primary-foreground/70">
              لديك <span className="font-semibold text-gold">{underReviewCases.length}</span> مخالفة تنتظر الاعتماد
              و<span className="font-semibold text-gold"> {pendingLeaves}</span> طلب إجازة معلق اليوم.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="gold" className="gap-2" asChild>
              <Link href="/employees"><Plus className="h-4 w-4" />إضافة موظف</Link>
            </Button>
            <Button variant="outline" className="gap-2 border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20" asChild>
              <Link href="/hr/discipline/violation-approvals"><ShieldAlert className="h-4 w-4" />مراجعة المخالفات</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main KPIs ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="إجمالي الموظفين"
          value={totalEmployees.toLocaleString('ar-SA')}
          delta={4.2} icon={Users} accent="primary"
          description={`في ${data.branches.length} فروع`}
          sparkline={[620, 680, 720, 740, 780, 810, 842]}
        />
        <KpiCard
          label="نسبة الحضور اليوم"
          value={`${attendanceRate}%`}
          delta={1.8} icon={UserCheck} accent="success"
          description={`${presentCount + lateCount} من ${data.attendanceToday.length} موظف`}
          sparkline={[92, 95, 93, 96, 97, 96, attendanceRate]}
        />
        <KpiCard
          label="رواتب أبريل"
          value={`${(data.payrollCurrent.totalNet / 1_000_000).toFixed(1)}م ر.س`}
          delta={1.85} icon={Wallet} accent="warning"
          description="إجمالي صافي الرواتب"
          sparkline={[23.9, 24.1, 24.4, 24.6, 24.8, 25.0, 25.2]}
        />
        <KpiCard
          label="مخالفات قيد الاعتماد"
          value={underReviewCases.length}
          delta={-5} icon={ShieldAlert} accent="gold"
          description={`من ${cases.length} حالة إجمالاً`}
          sparkline={[8, 12, 10, 15, 18, 20, underReviewCases.length]}
        />
      </div>

      {/* ── Secondary Stats Strip ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'عقود نشطة',          value: activeContracts,    icon: FileCheck2,   colorCls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',  href: '/hr/contracts' },
          { label: 'إجازات معلقة',        value: pendingLeaves,      icon: CalendarDays, colorCls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',            href: '/hr/leaves' },
          { label: 'طلبات HR',            value: submissions.length, icon: ClipboardList,colorCls: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30',      href: '/hr/requests' },
          { label: 'طلبات بانتظار المراجعة', value: pendingRequests, icon: Clock,        colorCls: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',         href: '/requests' },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-elevated">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', s.colorCls)}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground leading-tight">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Row A: Attendance Trend + Department Bar ─────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Attendance trend */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <div className="h-1 w-4 rounded-full bg-gold" />اتجاه الحضور
              </div>
              <h3 className="mt-1 font-display text-lg font-bold">الحضور خلال الأسبوع</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {[['bg-success','حاضرون'],['bg-warning','متأخرون'],['bg-destructive','غائبون']].map(([cls,lbl]) => (
                <span key={lbl} className="flex items-center gap-1.5"><span className={cn('h-2 w-2 rounded-full', cls)} />{lbl}</span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.attendanceTrend} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152 55% 32%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(152 55% 32%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(32 90% 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(32 90% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }}
                tickFormatter={v => new Date(v).toLocaleDateString('ar-SA', { weekday: 'short' })} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE}
                labelFormatter={v => new Date(v).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })} />
              <Area type="monotone" dataKey="present" stroke="hsl(152 55% 32%)" strokeWidth={2.5} fill="url(#gP)" name="حاضر" />
              <Area type="monotone" dataKey="late"    stroke="hsl(32 90% 50%)"   strokeWidth={2}   fill="url(#gL)" name="متأخر" />
              <Area type="monotone" dataKey="absent"  stroke="hsl(6 72% 48%)"    strokeWidth={2}   fill="transparent" name="غائب" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department distribution (horizontal bar) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <div className="h-1 w-4 rounded-full bg-gold" />الإدارات
              </div>
              <h3 className="mt-1 font-display text-lg font-bold">توزيع الموظفين</h3>
            </div>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Number(v)} موظف`, '']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {deptData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row B: Violations Donut + Leaves Bar + Payroll Trend ────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Violations by status (donut) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <div className="h-1 w-4 rounded-full bg-gold" />المخالفات
              </div>
              <h3 className="mt-1 font-display text-lg font-bold">توزيع حالات المخالفات</h3>
            </div>
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={violationsByStatus} innerRadius={50} outerRadius={72} paddingAngle={3}
                  dataKey="value" stroke="none">
                  {violationsByStatus.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Number(v)} حالة`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display text-2xl font-bold">{cases.length}</span>
              <span className="text-xs text-muted-foreground">حالة</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {violationsByStatus.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ms-auto font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaves by type (bar) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <div className="h-1 w-4 rounded-full bg-gold" />الإجازات
              </div>
              <h3 className="mt-1 font-display text-lg font-bold">الإجازات حسب النوع</h3>
            </div>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mb-3 flex gap-3 text-xs">
            <span className="flex items-center gap-1 text-blue-600 font-medium"><span className="h-2 w-2 rounded-full bg-blue-500" />{pendingLeaves} معلقة</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium"><span className="h-2 w-2 rounded-full bg-emerald-500" />{approvedLeaves} معتمدة</span>
          </div>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={leavesByType} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Number(v)} طلب`, '']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32} name="الطلبات">
                {leavesByType.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payroll monthly trend */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <div className="h-1 w-4 rounded-full bg-gold" />الرواتب
              </div>
              <h3 className="mt-1 font-display text-lg font-bold">اتجاه الرواتب الشهري</h3>
            </div>
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mb-2 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary/60" />إجمالي</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />صافي</span>
          </div>
          <ResponsiveContainer width="100%" height={185}>
            <AreaChart data={payrollTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Number(v).toLocaleString('ar-SA')} ألف ر.س`, '']} />
              <Area type="monotone" dataKey="إجمالي" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gG)" />
              <Area type="monotone" dataKey="صافي"   stroke="#10b981"              strokeWidth={2} fill="url(#gN)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row C: Under-Review Queue + Payroll by Branch ───────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Under-review violations */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">مخالفات بانتظار الاعتماد</h3>
              <p className="text-sm text-muted-foreground">الحالات التي تحتاج قراراً</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning">{underReviewCases.length}</Badge>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/hr/discipline/violation-approvals" className="gap-1">عرض الكل <ArrowLeft className="h-3 w-3" /></Link>
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {underReviewCases.slice(0, 6).map(c => {
              const stage = c.requiredApprovers[c.currentApprovalIndex];
              const stageLabel = stage === 'manager' ? 'مدير مباشر' : stage === 'hr' ? 'موارد بشرية' : 'تنفيذي';
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 hover:bg-muted/40 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.employeeNameAr}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.typeNameAr} · {c.caseNumber}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">{stageLabel}</Badge>
                </div>
              );
            })}
            {underReviewCases.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">لا توجد مخالفات معلقة</p>
            )}
          </div>
        </div>

        {/* Payroll cost by branch */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">تكلفة الرواتب حسب الفرع</h3>
              <p className="text-sm text-muted-foreground">التوزيع الجغرافي لكتلة الأجور</p>
            </div>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {data.payrollByBranch.map(b => {
              const pct = Math.round((b.cost / maxBranchCost) * 100);
              const costM = (b.cost / 1_000_000).toFixed(1);
              return (
                <div key={b.branch} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{b.branch}</span>
                    <span className="text-muted-foreground">{costM} م ر.س · {b.employees} موظف</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row D: Branch Donut + Today's Alerts + Recent Activity ───── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Branch donut */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <div className="h-1 w-4 rounded-full bg-gold" />الفروع
              </div>
              <h3 className="mt-1 font-display text-lg font-bold">توزيع الموظفين بالفروع</h3>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={branchData} innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
                  {branchData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Number(v)} موظف`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display text-xl font-bold">{totalEmployees}</span>
              <span className="text-xs text-muted-foreground">موظف</span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {branchData.map(b => (
              <div key={b.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: b.color }} />
                  <span className="text-muted-foreground">{b.name}</span>
                </div>
                <span className="font-semibold">{b.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's alerts */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">تنبيهات اليوم</h3>
              <p className="text-sm text-muted-foreground">تأخرات وغياب — {lateCount + absentCount} موظف</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-2.5">
            {lateEmployees.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2 hover:bg-muted/40 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={item.employee.avatar} />
                  <AvatarFallback className="text-xs">{getInitials(item.employee.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{item.employee.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{item.employee.position}</p>
                </div>
                {item.status === 'late'
                  ? <Badge variant="warning" className="shrink-0 text-[10px]">+{item.lateMinutes} د</Badge>
                  : <Badge variant="destructive" className="shrink-0 text-[10px]">غائب</Badge>}
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">آخر النشاطات</h3>
              <p className="text-sm text-muted-foreground">آخر التحديثات</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/requests" className="gap-1">الكل <ArrowLeft className="h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="space-y-3">
            {data.activities.slice(0, 5).map((activity, idx) => {
              const Icon = iconMap[activity.icon] || FileText;
              return (
                <div key={activity.id} className="relative flex gap-3">
                  {idx !== 4 && <div className="absolute right-[15px] top-8 h-full w-px bg-border" />}
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 pb-3 min-w-0">
                    <p className="text-xs font-semibold truncate">{activity.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{activity.description}</p>
                    <span className="text-[10px] text-muted-foreground/70">{relativeTime(activity.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-linear-to-l from-muted/30 via-card to-muted/30 p-6 shadow-soft">
        <div className="mb-4">
          <h3 className="font-display text-lg font-bold">إجراءات سريعة</h3>
          <p className="text-sm text-muted-foreground">الأدوات الأكثر استخداماً في متناول يدك</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'موظف جديد',       icon: UserPlus,    href: '/employees' },
            { label: 'طلب إجازة',        icon: CalendarDays, href: '/hr/leaves' },
            { label: 'الرواتب',          icon: Wallet,       href: '/hr/contracts' },
            { label: 'تقرير حضور',       icon: Clock,        href: '/attendance' },
            { label: 'هيكل تنظيمي',      icon: Building2,    href: '/organization' },
            { label: 'تحليلات الإجازات', icon: TrendingUp,   href: '/hr/leaves/analytics' },
          ].map(a => (
            <Link key={a.label} href={a.href}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-elevated">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-gold/15 group-hover:text-gold">
                <a.icon className="h-[18px] w-[18px]" />
              </div>
              <span className="text-xs font-semibold text-center leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
