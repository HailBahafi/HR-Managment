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
    <div className="space-y-6 animate-fade-in">


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
          { label: 'عقود نشطة',          value: activeContracts,    icon: FileCheck2,   colorCls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',  href: '/hr/contracts' },
          { label: 'إجازات معلقة',        value: pendingLeaves,      icon: CalendarDays, colorCls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',            href: '/hr/leaves' },
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

      {/* ── Violations Queue + Today's Alerts ────────────────────── */}
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
                <Link href="/hr/discipline/violation-cases" className="gap-1">عرض الكل <ArrowLeft className="h-3 w-3" /></Link>
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
