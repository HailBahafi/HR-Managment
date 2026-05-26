'use client';

import {
  User,
  Hash,
  UserRound,
  Heart,
  Calendar,
  Building2,
  Briefcase,
  Sparkles,
  Edit3,
  Check,
  X,
  Globe,
  Phone,
  MapPin,
  AtSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, formatDate, getInitials } from '@/shared/utils';
import type { Employee } from '@/features/hr/organization/employees/types';
import { Prop, FieldGroup } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import { EmployeeProfileField } from '@/features/hr/organization/employees/components/employee-profile-field';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeePersonalSection({ model }: { model: EmployeeProfileModel }) {
  const {
    employee,
    branch,
    department,
    draft,
    editingPersonal,
    setEditingPersonal,
    saving,
    handleSavePersonal,
    handleCancelPersonal,
    updateField,
    yearsOfService,
  } = model;

  return (
    <section>
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-linear-to-bl from-primary/6 via-card to-gold/4 mb-8">
        <div className="absolute inset-0 dotted-bg opacity-5" />
        <div className="relative p-6 md:p-7">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 mb-6">
            <Avatar className="h-20 w-20 ring-4 ring-background shadow-sm">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback className="text-xl font-arabic-display bg-primary text-primary-foreground">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h1 className="font-arabic-display text-3xl font-semibold tracking-tight text-foreground">
                  {employee.name}
                </h1>
                <StatusBadge status={employee.contractStatus} />
              </div>
              <p className="text-sm text-muted-foreground">
                {employee.position}
                <span className="text-muted-foreground/40 mx-2">·</span>
                {department?.name}
                <span className="text-muted-foreground/40 mx-2">·</span>
                {branch?.name}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3 w-3" />
                  <span className="font-mono">{employee.employeeCode}</span>
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  انضم في {formatDate(employee.startDate)}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="flex items-center gap-1.5 text-gold">
                  <Sparkles className="h-3 w-3" />
                  {yearsOfService} سنة
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="min-w-0">
          <h2 className="font-arabic-display text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <User className="h-5 w-5 shrink-0 text-primary" />
            البيانات الشخصية
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xl">
            المعلومات الأساسية وبيانات الاتصال للموظف
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editingPersonal ? (
            <>
              <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs" onClick={handleCancelPersonal}>
                <X className="h-3.5 w-3.5" />
                إلغاء
              </Button>
              <Button size="sm" className="h-9 gap-1.5 text-xs" disabled={saving} onClick={() => void handleSavePersonal()}>
                <Check className="h-3.5 w-3.5" />
                {saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
              </Button>
            </>
          ) : (
            <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => setEditingPersonal(true)}>
              <Edit3 className="h-3.5 w-3.5" />
              تعديل
            </Button>
          )}
        </div>
      </div>

      <FieldGroup title="الهوية">
        <Prop icon={Hash} label="رقم الموظف" mono>{draft.employeeCode}</Prop>
        <EmployeeProfileField draft={draft} editingPersonal={editingPersonal} updateField={updateField} editable icon={User} field="name" label="الاسم" />
        <EmployeeProfileField draft={draft} editingPersonal={editingPersonal} updateField={updateField} editable icon={User} field="nameEn" label="الاسم بالإنجليزية" />
        <EmployeeProfileField draft={draft} editingPersonal={editingPersonal} updateField={updateField} editable icon={Hash} field="nationalId" label="رقم الهوية" mono />
        <EmployeeProfileField draft={draft} editingPersonal={editingPersonal} updateField={updateField} editable icon={Globe} field="nationality" label="الجنسية" />
        <EmployeeProfileField draft={draft} editingPersonal={editingPersonal} updateField={updateField} editable icon={Calendar} field="birthDate" label="تاريخ الميلاد" type="date" format={(v) => formatDate(v as string)} />
        {editingPersonal ? (
          <>
            <div className="group relative flex items-start gap-3 py-3 px-3.5 rounded-xl border border-primary/30 bg-card transition-all">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserRound className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="emp-gender" className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/80 mb-1 font-medium block">الجنس</label>
                <select
                  id="emp-gender"
                  value={draft.gender}
                  onChange={(e) => updateField('gender', e.target.value as Employee['gender'])}
                  className={cn(
                    'mt-0.5 w-full bg-transparent text-sm font-medium text-foreground border-0 border-b border-primary/30 px-0 py-1 focus:outline-none focus:border-primary transition-colors cursor-pointer',
                  )}
                >
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
            </div>
            <div className="group relative flex items-start gap-3 py-3 px-3.5 rounded-xl border border-primary/30 bg-card transition-all">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Heart className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="emp-marital" className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/80 mb-1 font-medium block">الحالة الاجتماعية</label>
                <select
                  id="emp-marital"
                  value={draft.maritalStatus}
                  onChange={(e) => updateField('maritalStatus', e.target.value as Employee['maritalStatus'])}
                  className={cn(
                    'mt-0.5 w-full bg-transparent text-sm font-medium text-foreground border-0 border-b border-primary/30 px-0 py-1 focus:outline-none focus:border-primary transition-colors cursor-pointer',
                  )}
                >
                  <option value="single">أعزب</option>
                  <option value="married">متزوج</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <Prop icon={UserRound} label="الجنس">{draft.gender === 'male' ? 'ذكر' : 'أنثى'}</Prop>
            <Prop icon={Heart} label="الحالة الاجتماعية">
              {draft.maritalStatus === 'married' ? 'متزوج' : 'أعزب'}
            </Prop>
          </>
        )}
      </FieldGroup>

      <FieldGroup title="بيانات الاتصال">
        <EmployeeProfileField
          draft={draft}
          editingPersonal={editingPersonal}
          updateField={updateField}
          editable
          icon={AtSign}
          field="email"
          label="البريد الإلكتروني"
          type="email"
          format={(v) => (
            <a href={`mailto:${v as string}`} className="hover:text-primary hover:underline underline-offset-4">
              {v as string}
            </a>
          )}
        />
        <EmployeeProfileField draft={draft} editingPersonal={editingPersonal} updateField={updateField} editable icon={Phone} field="phone" label="رقم الجوال" type="tel" mono />
        <EmployeeProfileField draft={draft} editingPersonal={editingPersonal} updateField={updateField} editable icon={MapPin} field="address" label="العنوان" />
      </FieldGroup>

      <FieldGroup title="الموقع الوظيفي">
        <Prop icon={Building2} label="الفرع">{branch?.name}</Prop>
        <Prop icon={Briefcase} label="القسم">{department?.name}</Prop>
        <Prop icon={Sparkles} label="مدة الخدمة" accent="gold">{yearsOfService} سنة</Prop>
      </FieldGroup>
    </section>
  );
}
