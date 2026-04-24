'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  FileCheck2,
  Wallet,
  Clock,
  AlertCircle,
  Plus,
  ArrowLeft,
  Building2,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  TrendingUp,
  UserPlus,
  Settings,
  FileText,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { KpiCard } from '@/components/kpi-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { data, getEmployee } from '@/lib/data';
import { formatCurrency, relativeTime, getInitials } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  FileText, Clock, UserPlus, Wallet, CheckCircle2, Settings,
};

export default function DashboardPage() {
  const totalEmployees = data.company.totalEmployees;
  const presentCount = data.attendanceToday.filter((a) => a.status === 'present').length;
  const lateCount = data.attendanceToday.filter((a) => a.status === 'late').length;
  const absentCount = data.attendanceToday.filter((a) => a.status === 'absent').length;
  const attendanceRate = Math.round(((presentCount + lateCount) / data.attendanceToday.length) * 100);
  const pendingRequests = data.requests.filter((r) => r.status === 'pending').length;

  // Branch distribution for donut
  const branchData = data.branches.map((b) => ({
    name: b.city,
    value: b.employeesCount,
    color: ['#0f766e', '#ca8a04', '#be185d', '#7c3aed', '#0891b2', '#c2410c'][data.branches.indexOf(b) % 6],
  }));

  const lateEmployees = data.attendanceToday
    .filter((a) => a.status === 'late' || a.status === 'absent')
    .map((a) => ({ ...a, employee: getEmployee(a.employeeId)! }))
    .filter((a) => a.employee);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-l from-primary via-primary to-primary-700 p-8 text-primary-foreground">
        <div className="absolute inset-0 bg-noise opacity-[0.06] mix-blend-overlay" />
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-48 w-48 rounded-full bg-primary-foreground/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-gold">
              <Sparkles className="h-3 w-3" />
              <span>الثلاثاء، ٢١ أبريل ٢٠٢٦</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              مرحباً، عبدالرحمن <span className="text-gold">👋</span>
            </h1>
            <p className="max-w-xl text-primary-foreground/70">
              إليك نظرة سريعة على أداء منظمتك اليوم. هناك <span className="font-semibold text-gold">{pendingRequests}</span> طلبات بانتظار مراجعتك.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="gold" className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة موظف
            </Button>
            <Button variant="outline" className="gap-2 border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
              <FileCheck2 className="h-4 w-4" />
              طلب جديد
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="إجمالي الموظفين"
          value={totalEmployees.toLocaleString('ar-SA')}
          delta={4.2}
          icon={Users}
          accent="primary"
          description={`في ${data.branches.length} فروع`}
          sparkline={[620, 680, 720, 740, 780, 810, 842]}
        />
        <KpiCard
          label="نسبة الحضور اليوم"
          value={`${attendanceRate}%`}
          delta={1.8}
          icon={UserCheck}
          accent="success"
          description={`${presentCount + lateCount} من ${data.attendanceToday.length}`}
          sparkline={[92, 95, 93, 96, 97, 96, attendanceRate]}
        />
        <KpiCard
          label="طلبات بانتظار المراجعة"
          value={pendingRequests}
          delta={-12}
          icon={FileCheck2}
          accent="gold"
          description="متوسط الرد ٢٫٤ ساعة"
          sparkline={[22, 28, 24, 19, 21, 16, pendingRequests]}
        />
        <KpiCard
          label="رواتب أبريل"
          value={formatCurrency(data.payrollCurrent.totalNet).replace('SAR', '').trim()}
          delta={1.85}
          icon={Wallet}
          accent="warning"
          description="قيد المعالجة"
          sparkline={[23.9, 24.1, 24.4, 24.6, 24.8, 25.0, 25.2]}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Attendance trend */}
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <div className="h-1 w-4 rounded-full bg-gold" />
                اتجاه الحضور
              </div>
              <h3 className="mt-1 font-display text-xl font-bold">الحضور خلال الأسبوع</h3>
              <p className="mt-1 text-sm text-muted-foreground">تحديث فوري كل ١٥ دقيقة</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span>حاضرون</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-warning" />
                <span>متأخرون</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <span>غائبون</span>
              </div>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.attendanceTrend} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(152 55% 32%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(152 55% 32%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(32 90% 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(32 90% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('ar-SA', { weekday: 'short' })}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    direction: 'rtl',
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })}
                />
                <Area
                  type="monotone"
                  dataKey="present"
                  stroke="hsl(152 55% 32%)"
                  strokeWidth={2.5}
                  fill="url(#gPresent)"
                  name="حاضر"
                />
                <Area
                  type="monotone"
                  dataKey="late"
                  stroke="hsl(32 90% 50%)"
                  strokeWidth={2}
                  fill="url(#gLate)"
                  name="متأخر"
                />
                <Area
                  type="monotone"
                  dataKey="absent"
                  stroke="hsl(6 72% 48%)"
                  strokeWidth={2}
                  fill="transparent"
                  name="غائب"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch distribution */}
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <div className="h-1 w-4 rounded-full bg-gold" />
                توزيع الموظفين
              </div>
              <h3 className="mt-1 font-display text-xl font-bold">حسب الفرع</h3>
            </div>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="relative mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={branchData}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {branchData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold">{totalEmployees}</span>
              <span className="text-xs text-muted-foreground">موظف</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {branchData.slice(0, 4).map((b) => (
              <div key={b.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                  <span className="text-muted-foreground">{b.name}</span>
                </div>
                <span className="font-semibold number-ar">{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: activity + late widget */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold">آخر النشاطات</h3>
              <p className="text-sm text-muted-foreground">آخر التحديثات من فريقك</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/requests" className="gap-1">
                عرض الكل <ArrowLeft className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            {data.activities.map((activity, idx) => {
              const Icon = iconMap[activity.icon] || FileText;
              return (
                <div key={activity.id} className="group relative flex gap-4">
                  {idx !== data.activities.length - 1 && (
                    <div className="absolute right-[19px] top-10 h-full w-px bg-border" />
                  )}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{activity.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Late / Absent widget */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold">تنبيهات اليوم</h3>
              <p className="text-sm text-muted-foreground">تأخرات وغياب</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-3">
            {lateEmployees.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-md border border-border/60 bg-background p-3 transition-colors hover:bg-muted/40">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={item.employee.avatar} />
                  <AvatarFallback>{getInitials(item.employee.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.employee.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.employee.position}</p>
                </div>
                {item.status === 'late' ? (
                  <Badge variant="warning" className="shrink-0">+{item.lateMinutes} د</Badge>
                ) : (
                  <Badge variant="destructive" className="shrink-0">غائب</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions strip */}
      <div className="rounded-lg border border-border bg-gradient-to-l from-muted/30 via-card to-muted/30 p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-bold">إجراءات سريعة</h3>
            <p className="text-sm text-muted-foreground">الأدوات الأكثر استخداماً في متناول يدك</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'موظف جديد', icon: UserPlus, href: '/employees', accent: 'primary' },
            { label: 'طلب إجازة', icon: CalendarDays, href: '/requests', accent: 'gold' },
            { label: 'تشغيل رواتب', icon: Wallet, href: '/payroll', accent: 'success' },
            { label: 'تقرير حضور', icon: Clock, href: '/attendance', accent: 'warning' },
            { label: 'هيكل تنظيمي', icon: Building2, href: '/organization', accent: 'primary' },
            { label: 'التحليلات', icon: TrendingUp, href: '/reports', accent: 'gold' },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-elevated"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-gold/15 group-hover:text-gold">
                <a.icon className="h-[18px] w-[18px]" />
              </div>
              <span className="text-xs font-semibold">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
