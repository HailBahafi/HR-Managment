'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  Briefcase,
  Hash,
  UserRound,
  Building2,
  Calendar,
  Sparkles,
  FileSignature,
  CircleDot,
  Eye,
  Banknote,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, ContractTypeLabel } from '@/components/shared/status-badge';
import { formatDate } from '@/shared/utils';
import { Prop, FieldGroup } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import { EmployeeProfileField } from '@/features/hr/organization/employees/components/employee-profile-field';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';
import { EmployeeAssignmentList } from '@/features/hr/organization/employees/components/sections/employee-assignment-list';

export function EmployeeEmploymentSection({ model }: { model: EmployeeProfileModel }) {
  const {
    draft,
    updateField,
    branch,
    department,
    manager,
    yearsOfService,
    openHrPdfPrep,
    openSettlementPdfQuick,
    hrAssignments,
    assignmentsLoading,
    assignmentsError,
    primaryAssignment,
    setAssignmentDialogOpen,
    setEditAssignment,
    setDeleteAssignmentTarget,
  } = model;

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-arabic-display text-lg font-semibold tracking-tight text-foreground">
            <Briefcase className="h-5 w-5 shrink-0 text-primary" />
            بيانات التوظيف
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            الإسناد التنظيمي (شركة · فرع · قسم · مسمى) وسجل التعيينات
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs shrink-0"
          onClick={() => setAssignmentDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          إضافة إسناد
        </Button>
      </div>

      <FieldGroup title="الوظيفة والتسلسل الإداري">
        <Prop icon={Hash} label="رقم الموظف" mono>{draft.employeeCode}</Prop>
        <EmployeeProfileField draft={draft} editingPersonal={false} updateField={updateField} icon={Briefcase} field="position" label="المسمى الوظيفي" />
        <Prop icon={UserRound} label="المدير المباشر">
          {manager ? (
            <Link href={hrOrganizationRoutes.employee(manager.id)} className="hover:text-primary inline-flex items-center gap-1">
              {manager.name}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          ) : null}
        </Prop>
        <Prop icon={Building2} label="الفرع">{branch?.name}</Prop>
        <Prop icon={Building2} label="القسم">{department?.name}</Prop>
        {primaryAssignment?.jobTitleNameAr ? (
          <Prop icon={Briefcase} label="المسمى (من الإسناد)">{primaryAssignment.jobTitleNameAr}</Prop>
        ) : null}
        {primaryAssignment?.companyNameAr ? (
          <Prop icon={Building2} label="الشركة (الإسناد الرئيسي)">{primaryAssignment.companyNameAr}</Prop>
        ) : null}
      </FieldGroup>

      <FieldGroup
        title="سجل الإسنادات التنظيمية"
        hint={`${hrAssignments.length} سجل`}
      >
        <EmployeeAssignmentList
          assignments={hrAssignments}
          loading={assignmentsLoading}
          error={assignmentsError}
          onEdit={(row) => setEditAssignment(row)}
          onDelete={(row) => setDeleteAssignmentTarget(row)}
        />
      </FieldGroup>

      <FieldGroup title="العقد">
        <EmployeeProfileField draft={draft} editingPersonal={false} updateField={updateField} icon={Calendar} field="startDate" label="تاريخ التعيين" type="date" format={(v) => formatDate(v as string)} />
        <Prop icon={Calendar} label="نهاية العقد (السجل الرئيسي)">
          {draft.endDate ? formatDate(draft.endDate) : <span className="text-muted-foreground">غير محدد</span>}
        </Prop>
        <Prop icon={Sparkles} label="مدة الخدمة" accent="gold">{yearsOfService} سنة</Prop>
        <Prop icon={FileSignature} label="نوع العقد">
          <ContractTypeLabel type={draft.contractType} />
        </Prop>
        <Prop icon={CircleDot} label="حالة العقد">
          <StatusBadge status={draft.contractStatus} />
        </Prop>
      </FieldGroup>

      <FieldGroup title="نماذج مؤسسة روز للتجارة" hint="معاينة ثم تحميل PDF">
        <div className="col-span-full grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs" onClick={() => openHrPdfPrep('resignation')}>
            <Eye className="h-3.5 w-3.5 shrink-0" />
            نموذج استقالة
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs" onClick={() => openHrPdfPrep('clearance')}>
            <Eye className="h-3.5 w-3.5 shrink-0" />
            نموذج إخلاء طرف
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs" onClick={() => openSettlementPdfQuick()}>
            <Eye className="h-3.5 w-3.5 shrink-0" />
            مخالصة نهائية
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs" onClick={() => openHrPdfPrep('experience')}>
            <Eye className="h-3.5 w-3.5 shrink-0" />
            شهادة خبرة
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs sm:col-span-2" onClick={() => openHrPdfPrep('cash-receipt')}>
            <Banknote className="h-3.5 w-3.5 shrink-0" />
            سند استلام نقدي للراتب
          </Button>
        </div>
      </FieldGroup>
    </section>
  );
}
