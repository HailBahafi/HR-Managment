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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, ContractTypeLabel } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import { Prop, FieldGroup, SectionH } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import { EmployeeProfileField } from '@/features/hr/organization/employees/components/employee-profile-field';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';

export function EmployeeEmploymentSection({ model }: { model: EmployeeProfileModel }) {
  const {
    draft,
    updateField,
    branch,
    department,
    manager,
    yearsOfService,
    setRosePdfPreviewKind,
  } = model;

  return (
    <section>
      <SectionH icon={Briefcase} title="بيانات التوظيف" subtitle="تفاصيل الوظيفة والتسلسل الإداري" />

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
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs" onClick={() => setRosePdfPreviewKind('resignation')}>
            <Eye className="h-3.5 w-3.5 shrink-0" />
            نموذج استقالة
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs" onClick={() => setRosePdfPreviewKind('clearance')}>
            <Eye className="h-3.5 w-3.5 shrink-0" />
            نموذج إخلاء طرف
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs" onClick={() => setRosePdfPreviewKind('settlement')}>
            <Eye className="h-3.5 w-3.5 shrink-0" />
            مخالصة نهائية
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs" onClick={() => setRosePdfPreviewKind('experience')}>
            <Eye className="h-3.5 w-3.5 shrink-0" />
            شهادة خبرة
          </Button>
        </div>
      </FieldGroup>
    </section>
  );
}
