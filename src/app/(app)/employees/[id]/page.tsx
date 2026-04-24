'use client';

import * as React from 'react';
import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  CreditCard,
  Heart,
  Shield,
  Edit,
  FileText,
  Download,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, ContractTypeLabel } from '@/components/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getEmployee, getBranch, getDepartment, data } from '@/lib/data';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const employee = getEmployee(id);
  if (!employee) return notFound();

  const branch = getBranch(employee.branchId);
  const department = getDepartment(employee.departmentId);
  const manager = employee.managerId ? getEmployee(employee.managerId) : null;
  const totalSalary = employee.baseSalary + employee.housingAllowance + employee.transportAllowance + employee.otherAllowances;

  const employeeRequests = data.requests.filter((r) => r.employeeId === employee.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/employees" className="flex items-center gap-1 transition-colors hover:text-foreground">
          <ArrowRight className="h-4 w-4" />
          الموظفين
        </Link>
        <span>/</span>
        <span className="text-foreground">{employee.name}</span>
      </div>

      {/* Profile header - editorial hero */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
        {/* Banner */}
        <div className="relative h-40 bg-gradient-to-l from-primary via-primary-700 to-primary-900">
          <div className="absolute inset-0 bg-noise opacity-10 mix-blend-overlay" />
          <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 h-px gold-accent-line opacity-50" />
        </div>

        <div className="relative px-8 pb-8">
          <div className="-mt-20 flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <Avatar className="h-32 w-32 border-4 border-card shadow-elevated ring-2 ring-gold/30">
                <AvatarImage src={employee.avatar} />
                <AvatarFallback className="text-2xl">{getInitials(employee.name)}</AvatarFallback>
              </Avatar>
              <div className="mb-2 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  <span>{employee.employeeCode}</span>
                  <span>·</span>
                  <StatusBadge status={employee.contractStatus} />
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight">{employee.name}</h1>
                <p className="text-lg text-muted-foreground">{employee.position}</p>
                <p className="text-sm text-muted-foreground" dir="ltr">{employee.nameEn}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                السيرة الذاتية
              </Button>
              <Button variant="luxe" className="gap-2">
                <Edit className="h-4 w-4" />
                تعديل الملف
              </Button>
            </div>
          </div>

          {/* Quick contact strip */}
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">البريد</p>
                <p className="truncate text-sm font-medium" dir="ltr">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">الجوال</p>
                <p className="truncate text-sm font-medium" dir="ltr">{employee.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">الفرع</p>
                <p className="truncate text-sm font-medium">{branch?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gold/15 text-gold">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">تاريخ الالتحاق</p>
                <p className="truncate text-sm font-medium">{formatDate(employee.startDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">المعلومات الشخصية</TabsTrigger>
          <TabsTrigger value="employment">بيانات التوظيف</TabsTrigger>
          <TabsTrigger value="salary">الراتب والمزايا</TabsTrigger>
          <TabsTrigger value="requests">الطلبات ({employeeRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <InfoCard title="المعلومات الأساسية" icon={Shield}>
              <InfoRow label="الاسم الكامل" value={employee.name} />
              <InfoRow label="الاسم بالإنجليزية" value={employee.nameEn} dir="ltr" />
              <InfoRow label="رقم الهوية" value={employee.nationalId} dir="ltr" />
              <InfoRow label="الجنسية" value={employee.nationality} />
              <InfoRow label="تاريخ الميلاد" value={formatDate(employee.birthDate)} />
              <InfoRow label="الجنس" value={employee.gender === 'male' ? 'ذكر' : 'أنثى'} />
              <InfoRow label="الحالة الاجتماعية" value={employee.maritalStatus === 'single' ? 'أعزب' : 'متزوج'} />
            </InfoCard>

            <InfoCard title="معلومات التواصل" icon={Phone}>
              <InfoRow label="البريد الإلكتروني" value={employee.email} dir="ltr" />
              <InfoRow label="رقم الجوال" value={employee.phone} dir="ltr" />
              <InfoRow label="جهة الاتصال للطوارئ" value={employee.emergencyContact} dir="ltr" />
              <InfoRow label="العنوان" value={employee.address} />
            </InfoCard>
          </div>
        </TabsContent>

        <TabsContent value="employment" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <InfoCard title="تفاصيل الوظيفة" icon={Briefcase}>
              <InfoRow label="رقم الموظف" value={employee.employeeCode} />
              <InfoRow label="المنصب" value={employee.position} />
              <InfoRow label="القسم" value={department?.name ?? '-'} />
              <InfoRow label="الفرع" value={branch?.name ?? '-'} />
              <InfoRow label="المدير المباشر" value={manager?.name ?? 'لا يوجد'} />
              <InfoRow label="نوع العقد" value={<ContractTypeLabel type={employee.contractType} />} />
              <InfoRow label="الحالة" value={<StatusBadge status={employee.contractStatus} />} />
            </InfoCard>

            <InfoCard title="الجدول الزمني" icon={Calendar}>
              <InfoRow label="تاريخ الالتحاق" value={formatDate(employee.startDate)} />
              {employee.endDate && <InfoRow label="تاريخ الانتهاء" value={formatDate(employee.endDate)} />}
              <InfoRow
                label="مدة الخدمة"
                value={`${Math.floor((Date.now() - new Date(employee.startDate).getTime()) / (365 * 24 * 60 * 60 * 1000))} سنوات`}
              />
            </InfoCard>
          </div>
        </TabsContent>

        <TabsContent value="salary" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg border border-gold/40 bg-gradient-to-br from-gold/10 via-card to-card p-6 shadow-soft lg:col-span-1">
              <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
              <div className="relative">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">إجمالي الراتب الشهري</p>
                <p className="mt-2 font-display text-4xl font-bold tracking-tight number-ar">{formatCurrency(totalSalary)}</p>
                <div className="mt-4 h-px gold-accent-line" />
                <p className="mt-4 text-xs text-muted-foreground">بعد الخصومات المتغيرة</p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <InfoCard title="التفاصيل" icon={CreditCard}>
                <InfoRow label="الراتب الأساسي" value={formatCurrency(employee.baseSalary)} />
                <InfoRow label="بدل السكن" value={formatCurrency(employee.housingAllowance)} />
                <InfoRow label="بدل المواصلات" value={formatCurrency(employee.transportAllowance)} />
                <InfoRow label="بدلات أخرى" value={formatCurrency(employee.otherAllowances)} />
                <InfoRow label="اشتراك التأمينات (GOSI)" value={formatCurrency(employee.gosi)} />
                <InfoRow label="رقم الحساب البنكي" value={employee.bankAccount} dir="ltr" />
                <InfoRow label="IBAN" value={employee.iban} dir="ltr" />
              </InfoCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="rounded-lg border border-border bg-card shadow-soft">
            {employeeRequests.length > 0 ? (
              <div className="divide-y divide-border">
                {employeeRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold">{req.title}</p>
                        <p className="text-xs text-muted-foreground">{req.requestNumber} · {formatDate(req.submittedAt)}</p>
                      </div>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />
                <p>لا توجد طلبات سابقة</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-soft">
      <div className="flex items-center gap-3 border-b border-border p-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-display font-semibold">{title}</h3>
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, dir }: { label: string; value: React.ReactNode; dir?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium" dir={dir}>{value}</span>
    </div>
  );
}
