'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users, UserCheck, FileCheck2, Wallet, Clock, AlertCircle, ArrowLeft,
  Building2, CalendarDays, TrendingUp, UserPlus,
  ShieldAlert,
} from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { data, getEmployee } from '@/lib/data';
import { getInitials, cn } from '@/lib/utils';
import { useSetPageTitle } from '@/components/page-title-context';
import { useHRViolationCasesStore } from '@/lib/hr-discipline/violation-cases-store';
import { useHRContractsStore } from '@/lib/contracts/contracts-store';
import { MOCK_UNIFIED_LEAVES } from '@/lib/leaves/unified-mock';

export default function DashboardPage() {
  useSetPageTitle({ titleAr: 'لوحة التحكم', descriptionAr: 'نظرة عامة على أداء المنظمة', iconName: 'LayoutDashboard' });

  const { cases } = useHRViolationCasesStore();
  const { contracts } = useHRContractsStore();

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

  const underReviewCases = cases.filter(c => c.status === 'under_review');
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const pendingLeaves = MOCK_UNIFIED_LEAVES.filter(l => l.status === 'pending').length;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Main KPIs ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>

      {/* ── Secondary Stats Strip ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'عقود نشطة',             value: activeContracts, icon: FileCheck2,   colorCls: 'text-emerald-600 dark:text-emerald-400', bgCls: 'bg-emerald-50 dark:bg-emerald-950/40', href: '/hr/contracts' },
          { label: 'إجازات معلقة',           value: pendingLeaves,   icon: CalendarDays, colorCls: 'text-blue-600 dark:text-blue-400',        bgCls: 'bg-blue-50 dark:bg-blue-950/40',        href: '/hr/leaves' },
          { label: 'طلبات بانتظار المراجعة', value: pendingRequests, icon: Clock,        colorCls: 'text-amber-600 dark:text-amber-400',      bgCls: 'bg-amber-50 dark:bg-amber-950/40',      href: '/requests' },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-elevated">
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105', s.bgCls, s.colorCls)}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className={cn('font-display text-2xl font-bold tabular-nums', s.colorCls)}>{s.value}</div>
              <div className="text-xs text-muted-foreground leading-tight mt-0.5">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Violations Queue + Today's Alerts ────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Under-review violations */}
        <div className="flex flex-col rounded-xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold leading-tight">مخالفات بانتظار الاعتماد</h3>
                <p className="text-xs text-muted-foreground mt-0.5">الحالات التي تحتاج قراراً</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning" className="tabular-nums">{underReviewCases.length}</Badge>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hidden sm:flex" asChild>
                <Link href="/hr/discipline/violation-cases">عرض الكل <ArrowLeft className="h-3 w-3" /></Link>
              </Button>
            </div>
          </div>
          <div className="divide-y divide-border/40 flex-1">
            {underReviewCases.slice(0, 5).map(c => {
              const stage = c.requiredApprovers[c.currentApprovalIndex];
              const stageLabel = stage === 'manager' ? 'مدير مباشر' : stage === 'hr' ? 'موارد بشرية' : 'تنفيذي';
              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold">
                    {c.employeeNameAr.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.employeeNameAr}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{c.typeNameAr} · {c.caseNumber}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">{stageLabel}</Badge>
                </div>
              );
            })}
            {underReviewCases.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 mb-2">
                  <ShieldAlert className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">لا توجد مخالفات معلقة</p>
              </div>
            )}
          </div>
          {underReviewCases.length > 0 && (
            <div className="p-3 border-t border-border/60 sm:hidden">
              <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1" asChild>
                <Link href="/hr/discipline/violation-cases">عرض الكل <ArrowLeft className="h-3 w-3" /></Link>
              </Button>
            </div>
          )}
        </div>

        {/* Today's alerts */}
        <div className="flex flex-col rounded-xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold leading-tight">تنبيهات اليوم</h3>
                <p className="text-xs text-muted-foreground mt-0.5">تأخرات وغياب — <span className="tabular-nums">{lateCount + absentCount}</span> موظف</p>
              </div>
            </div>
            <div className="flex gap-2">
              {absentCount > 0 && <Badge variant="destructive" className="tabular-nums">{absentCount} غائب</Badge>}
              {lateCount > 0 && <Badge variant="warning" className="tabular-nums">{lateCount} متأخر</Badge>}
            </div>
          </div>
          <div className="divide-y divide-border/40 flex-1">
            {lateEmployees.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={item.employee.avatar} />
                  <AvatarFallback className="text-xs">{getInitials(item.employee.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.employee.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{item.employee.position}</p>
                </div>
                {item.status === 'late'
                  ? <Badge variant="warning" className="shrink-0 text-[10px] tabular-nums">+{item.lateMinutes} د</Badge>
                  : <Badge variant="destructive" className="shrink-0 text-[10px]">غائب</Badge>}
              </div>
            ))}
            {lateEmployees.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 mb-2">
                  <UserCheck className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">جميع الموظفين حاضرون</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4">
          <h3 className="font-display text-base font-bold">إجراءات سريعة</h3>
          <p className="text-xs text-muted-foreground mt-0.5">الأدوات الأكثر استخداماً في متناول يدك</p>
        </div>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'موظف جديد',       icon: UserPlus,    href: '/employees' },
            { label: 'طلب إجازة',        icon: CalendarDays, href: '/hr/leaves' },
            { label: 'الرواتب',          icon: Wallet,       href: '/hr/contracts' },
            { label: 'تقرير حضور',       icon: Clock,        href: '/attendance' },
            { label: 'هيكل تنظيمي',      icon: Building2,    href: '/organization' },
            { label: 'تحليلات الإجازات', icon: TrendingUp,   href: '/hr/leaves/analytics' },
          ].map(a => (
            <Link key={a.label} href={a.href}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-background text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary shadow-xs">
                <a.icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight text-muted-foreground group-hover:text-foreground">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
