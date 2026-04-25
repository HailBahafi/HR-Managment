'use client';

import * as React from 'react';
import { Download, Calendar, Filter, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useSetPageTitle } from '@/components/page-title-context';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { data } from '@/lib/data';
import { formatCurrency, cn } from '@/lib/utils';

const colors = ['#0f766e', '#ca8a04', '#be185d', '#7c3aed', '#0891b2', '#c2410c'];

export default function ReportsPage() {
  useSetPageTitle({ titleAr: 'رؤى وتحليلات', descriptionAr: 'تقارير متعمقة عن أداء المنظمة', icon: BarChart3 });
  // Derived data
  const byDept = data.departments.map((d) => ({
    name: d.name.substring(0, 10),
    value: d.employeesCount,
    color: d.color,
  }));

  const contractDist = [
    { type: 'دائم', value: data.employees.filter((e) => e.contractType === 'permanent').length },
    { type: 'مؤقت', value: data.employees.filter((e) => e.contractType === 'temporary').length },
    { type: 'جزئي', value: data.employees.filter((e) => e.contractType === 'part-time').length },
    { type: 'تعاقد', value: data.employees.filter((e) => e.contractType === 'contract').length },
  ];

  const requestTypeData = Object.entries(data.requestStats.byType).map(([type, value]) => {
    const labels: Record<string, string> = {
      leave: 'إجازة', permission: 'استئذان', advance: 'سلفة',
      'salary-letter': 'خطاب', equipment: 'معدات', 'attendance-correction': 'تصحيح'
    };
    return { type: labels[type] || type, value };
  });

  const radarData = data.branches.slice(0, 6).map((b) => ({
    branch: b.city,
    الحضور: 85 + Math.random() * 15,
    الالتزام: 80 + Math.random() * 18,
    الرضا: 75 + Math.random() * 22,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">هذا الأسبوع</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="quarter">هذا الربع</SelectItem>
              <SelectItem value="year">هذا العام</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">تقارير الحضور</TabsTrigger>
          <TabsTrigger value="employees">تقارير الموظفين</TabsTrigger>
          <TabsTrigger value="requests">تقارير الطلبات</TabsTrigger>
          <TabsTrigger value="payroll">تقارير الرواتب</TabsTrigger>
        </TabsList>

        {/* ATTENDANCE */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MetricTile label="متوسط الحضور" value="٩٦٫٣٪" delta={+1.8} accent="success" />
            <MetricTile label="متوسط التأخير" value="٢٫٨٪" delta={-0.5} accent="warning" />
            <MetricTile label="متوسط الغياب" value="٠٫٩٪" delta={-0.2} accent="destructive" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="اتجاه الحضور الأسبوعي" subtitle="آخر ٧ أيام">
              <AreaChart data={data.attendanceTrend}>
                <defs>
                  <linearGradient id="trAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('ar-SA', { weekday: 'short' })} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: 12, direction: 'rtl' }} />
                <Area type="monotone" dataKey="present" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#trAtt)" name="حاضر" />
              </AreaChart>
            </ChartCard>

            <ChartCard title="مقارنة الأداء بين الفروع" subtitle="مؤشرات متعددة">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="branch" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Radar dataKey="الحضور" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                <Radar dataKey="الالتزام" stroke="hsl(var(--gold))" fill="hsl(var(--gold))" fillOpacity={0.25} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: 12, direction: 'rtl' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ChartCard>
          </div>
        </TabsContent>

        {/* EMPLOYEES */}
        <TabsContent value="employees" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MetricTile label="إجمالي الموظفين" value="٨٤٢" delta={+4.2} accent="primary" />
            <MetricTile label="معدل الاحتفاظ" value="٩٤٫٥٪" delta={+2.1} accent="success" />
            <MetricTile label="متوسط الخدمة" value="٣٫٢ سنوات" delta={+0.4} accent="gold" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="التوزيع حسب القسم">
              <BarChart data={byDept} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: 12, direction: 'rtl' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byDept.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartCard>

            <ChartCard title="توزيع حالات العقود">
              <PieChart>
                <Pie data={contractDist} dataKey="value" nameKey="type" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {contractDist.map((_, i) => (
                    <Cell key={i} fill={colors[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: 12, direction: 'rtl' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ChartCard>
          </div>
        </TabsContent>

        {/* REQUESTS */}
        <TabsContent value="requests" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <MetricTile label="إجمالي الطلبات" value={data.requestStats.total.toString()} delta={+8} accent="primary" />
            <MetricTile label="موافق عليها" value={data.requestStats.approved.toString()} delta={+5} accent="success" />
            <MetricTile label="قيد الانتظار" value={data.requestStats.pending.toString()} delta={-3} accent="warning" />
            <MetricTile label="مرفوضة" value={data.requestStats.rejected.toString()} delta={-2} accent="destructive" />
          </div>

          <ChartCard title="الطلبات حسب النوع">
            <BarChart data={requestTypeData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: 12, direction: 'rtl' }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                {requestTypeData.map((_, i) => (
                  <Cell key={i} fill={colors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ChartCard>
        </TabsContent>

        {/* PAYROLL */}
        <TabsContent value="payroll" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MetricTile label="إجمالي الرواتب" value={`${(data.payrollCurrent.totalGross / 1000000).toFixed(1)}م`} delta={+1.85} accent="primary" />
            <MetricTile label="صافي الدفع" value={`${(data.payrollCurrent.totalNet / 1000000).toFixed(1)}م`} delta={+1.6} accent="gold" />
            <MetricTile label="الخصومات" value={`${(data.payrollCurrent.totalDeductions / 1000000).toFixed(1)}م`} delta={+0.3} accent="destructive" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="اتجاه التكلفة" subtitle="إجمالي vs صافي">
              <LineChart data={data.payrollTrend} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}م`} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: 12, direction: 'rtl' }}
                  formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : '')} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="gross" stroke="hsl(var(--primary))" strokeWidth={2.5} name="إجمالي" />
                <Line type="monotone" dataKey="net" stroke="hsl(var(--gold))" strokeWidth={2.5} name="صافي" />
              </LineChart>
            </ChartCard>

            <ChartCard title="توزيع الرواتب حسب الفرع">
              <PieChart>
                <Pie data={data.payrollByBranch} dataKey="cost" nameKey="branch" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {data.payrollByBranch.map((_, i) => (
                    <Cell key={i} fill={colors[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: 12, direction: 'rtl' }}
                  formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : '')} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricTile({ label, value, delta, accent }: { label: string; value: string; delta: number; accent: string }) {
  const map: Record<string, string> = {
    primary: 'from-primary/15 to-primary/5 border-primary/20',
    gold: 'from-gold/15 to-gold/5 border-gold/20',
    success: 'from-success/15 to-success/5 border-success/20',
    warning: 'from-warning/15 to-warning/5 border-warning/20',
    destructive: 'from-destructive/15 to-destructive/5 border-destructive/20',
  };
  const isPositive = delta >= 0;
  return (
    <div className={cn('rounded-lg border bg-gradient-to-br p-5 shadow-soft', map[accent])}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold number-ar">{value}</span>
        <span className={cn('flex items-center gap-0.5 text-xs font-semibold', isPositive ? 'text-success' : 'text-destructive')}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(delta)}%
        </span>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactElement }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-soft">
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
