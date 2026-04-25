'use client';

import * as React from 'react';
import { Wallet, Play, Download, Printer, CheckCircle2, Clock, FileSpreadsheet, Users, TrendingUp, Sparkles } from 'lucide-react';
import { useSetPageTitle } from '@/components/page-title-context';
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/status-badge';
import { data, getEmployee } from '@/lib/data';
import { formatCurrency, formatNumber, getInitials, cn } from '@/lib/utils';

export default function PayrollPage() {
  useSetPageTitle({ titleAr: 'الرواتب والمستحقات', descriptionAr: 'تشغيل وإدارة رواتب الموظفين الشهرية', icon: Wallet });
  const current = data.payrollCurrent;
  const progress = 68;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Current run hero */}
      <div className="relative overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-primary via-primary to-primary-700 p-8 text-primary-foreground shadow-luxe">
        <div className="absolute inset-0 bg-noise opacity-[0.08] mix-blend-overlay" />
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-primary-foreground/5 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-gold">
                <Sparkles className="h-3 w-3" />
                جولة الرواتب الحالية
              </div>
              <h2 className="mt-2 font-display text-4xl font-bold tracking-tight">
                راتب {current.month} <span className="text-gold">٢٠٢٦</span>
              </h2>
              <p className="mt-1 text-primary-foreground/70">
                قيد المعالجة · <span className="number-ar">{current.employeesCount}</span> موظف
              </p>
            </div>
            <Badge variant="gold" className="gap-1">
              <div className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-gold" />
              معالجة مباشرة
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-primary-foreground/60">إجمالي المستحقات</p>
              <p className="font-display text-3xl font-bold number-ar">{formatCurrency(current.totalGross).replace('SAR', '').trim()}</p>
              <p className="text-xs text-primary-foreground/60">ريال سعودي</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-primary-foreground/60">إجمالي الخصومات</p>
              <p className="font-display text-3xl font-bold text-destructive number-ar">
                -{formatCurrency(current.totalDeductions).replace('SAR', '').trim()}
              </p>
              <p className="text-xs text-primary-foreground/60">ريال سعودي</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-gold">الصافي للدفع</p>
              <p className="font-display text-3xl font-bold text-gold number-ar">{formatCurrency(current.totalNet).replace('SAR', '').trim()}</p>
              <p className="text-xs text-primary-foreground/60">ريال سعودي</p>
            </div>
            <div className="flex items-end">
              <Button variant="gold" size="lg" className="w-full gap-2">
                <Play className="h-4 w-4" />
                تشغيل الرواتب
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-primary-foreground/60">تقدم المعالجة</span>
              <span className="font-semibold text-gold">{progress}%</span>
            </div>
            <Progress value={progress} indicatorClassName="bg-gold" className="h-1.5 bg-primary-foreground/10" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="payslips">كشوف الرواتب</TabsTrigger>
          <TabsTrigger value="history">السجل التاريخي</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Trend */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold">اتجاه الرواتب</h3>
                  <p className="text-xs text-muted-foreground">آخر ٦ أشهر</p>
                </div>
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.payrollTrend} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="lineG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}م`} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: 12, direction: 'rtl' }}
                    formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : '')}
                  />
                  <Line type="monotone" dataKey="gross" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(var(--primary))' }} name="الإجمالي" />
                  <Line type="monotone" dataKey="net" stroke="hsl(var(--gold))" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(var(--gold))' }} name="الصافي" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* By branch */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold">التكلفة حسب الفرع</h3>
                  <p className="text-xs text-muted-foreground">توزيع الرواتب</p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.payrollByBranch} layout="vertical" margin={{ top: 5, right: 10, left: 50, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}م`} />
                  <YAxis type="category" dataKey="branch" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: 12, direction: 'rtl' }}
                    formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : '')}
                  />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                    {data.payrollByBranch.map((_, i) => (
                      <Cell key={i} fill={['#0f766e', '#ca8a04', '#be185d', '#7c3aed', '#0891b2', '#c2410c'][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payslips" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data.payslips.map((slip) => {
              const emp = getEmployee(slip.employeeId);
              if (!emp) return null;
              const totalDeductions = slip.gosi + slip.absenceDeduction + slip.latenessDeduction + slip.loanDeduction + slip.otherDeductions;
              return (
                <div key={slip.id} className="relative overflow-hidden rounded-lg border border-border bg-card shadow-soft">
                  {/* Edge accent */}
                  <div className="absolute right-0 top-0 h-full w-1 gold-accent-line" />

                  <div className="border-b border-border bg-muted/30 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 ring-2 ring-gold/30">
                          <AvatarImage src={emp.avatar} />
                          <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.employeeCode} · {emp.position}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Printer className="h-3 w-3" />
                        طباعة
                      </Button>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Month */}
                    <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">كشف راتب</span>
                      <span className="font-display text-lg font-bold">{slip.month} {slip.year}</span>
                    </div>

                    {/* Earnings */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-success">المستحقات</p>
                      <div className="space-y-1.5 rounded-md bg-success/5 p-3 text-sm">
                        <PayRow label="الراتب الأساسي" value={slip.baseSalary} />
                        <PayRow label="بدل السكن" value={slip.housing} />
                        <PayRow label="بدل المواصلات" value={slip.transport} />
                        <PayRow label="بدلات أخرى" value={slip.otherAllowances} />
                        {slip.overtime > 0 && <PayRow label="ساعات إضافية" value={slip.overtime} />}
                        <div className="mt-2 flex items-center justify-between border-t border-success/20 pt-2 font-semibold">
                          <span>الإجمالي</span>
                          <span className="text-success number-ar">{formatCurrency(slip.gross)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-destructive">الخصومات</p>
                      <div className="space-y-1.5 rounded-md bg-destructive/5 p-3 text-sm">
                        <PayRow label="التأمينات (GOSI)" value={-slip.gosi} />
                        {slip.absenceDeduction > 0 && <PayRow label="خصم غياب" value={-slip.absenceDeduction} />}
                        {slip.latenessDeduction > 0 && <PayRow label="خصم تأخير" value={-slip.latenessDeduction} />}
                        {slip.loanDeduction > 0 && <PayRow label="قسط قرض" value={-slip.loanDeduction} />}
                        <div className="mt-2 flex items-center justify-between border-t border-destructive/20 pt-2 font-semibold">
                          <span>إجمالي الخصومات</span>
                          <span className="text-destructive number-ar">-{formatCurrency(totalDeductions)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Net */}
                    <div className="relative overflow-hidden rounded-md bg-gradient-to-l from-gold/20 via-gold/10 to-gold/20 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-display font-semibold">الصافي للدفع</span>
                        <span className="font-display text-2xl font-bold text-gold number-ar">{formatCurrency(slip.net)}</span>
                      </div>
                    </div>

                    {/* Work days */}
                    <div className="grid grid-cols-4 gap-2 border-t border-border pt-4 text-xs">
                      <div className="text-center">
                        <p className="text-muted-foreground">أيام العمل</p>
                        <p className="font-display text-lg font-bold number-ar">{slip.workingDays}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">حضور</p>
                        <p className="font-display text-lg font-bold text-success number-ar">{slip.presentDays}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">غياب</p>
                        <p className="font-display text-lg font-bold text-destructive number-ar">{slip.absentDays}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">تأخير</p>
                        <p className="font-display text-lg font-bold text-warning number-ar">{slip.lateDays}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4 text-right">الفترة</th>
                  <th className="px-6 py-4 text-right">عدد الموظفين</th>
                  <th className="px-6 py-4 text-right">الإجمالي</th>
                  <th className="px-6 py-4 text-right">الخصومات</th>
                  <th className="px-6 py-4 text-right">الصافي</th>
                  <th className="px-6 py-4 text-right">الحالة</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {data.payrollHistory.map((run) => (
                  <tr key={run.id} className="border-b border-border/60 last:border-b-0 transition-colors hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{run.month} {run.year}</p>
                        <p className="text-xs text-muted-foreground">{run.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 number-ar">{formatNumber(run.employeesCount)}</td>
                    <td className="px-6 py-4 font-semibold number-ar">{formatCurrency(run.totalGross)}</td>
                    <td className="px-6 py-4 text-destructive number-ar">-{formatCurrency(run.totalDeductions)}</td>
                    <td className="px-6 py-4 font-semibold text-gold number-ar">{formatCurrency(run.totalNet)}</td>
                    <td className="px-6 py-4"><StatusBadge status={run.status} /></td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <FileSpreadsheet className="h-3 w-3" />
                        التفاصيل
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PayRow({ label, value }: { label: string; value: number }) {
  const isNegative = value < 0;
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-mono number-ar', isNegative ? 'text-destructive' : 'text-foreground')}>
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
