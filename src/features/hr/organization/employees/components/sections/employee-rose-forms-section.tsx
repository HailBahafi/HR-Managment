'use client';

import { Award, Banknote, ChevronLeft, ClipboardCheck, FileSignature, FileStack, LogOut, Smartphone } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

const FORM_ACTIONS = [
  {
    key: 'resignation' as const,
    label: 'نموذج استقالة',
    description: 'طلب استقالة الموظف من العمل',
    icon: LogOut,
  },
  {
    key: 'clearance' as const,
    label: 'نموذج إخلاء طرف',
    description: 'تأكيد عدم وجود التزامات متبادلة',
    icon: ClipboardCheck,
  },
  {
    key: 'settlement' as const,
    label: 'مخالصة نهائية',
    description: 'تسوية المستحقات المالية النهائية',
    icon: FileSignature,
  },
  {
    key: 'experience' as const,
    label: 'شهادة خبرة',
    description: 'إثبات مدة وطبيعة الخبرة العملية',
    icon: Award,
  },
  {
    key: 'cash-receipt' as const,
    label: 'سند استلام نقدي للراتب',
    description: 'إثبات استلام الراتب نقداً',
    icon: Banknote,
  },
  {
    key: 'mobile-circular' as const,
    label: 'تعميم استخدام الجوال',
    description: 'سياسة استخدام الجوال والعقوبات مع تعهد الموظف',
    icon: Smartphone,
  },
] satisfies Array<{
  key: 'resignation' | 'clearance' | 'settlement' | 'experience' | 'cash-receipt' | 'mobile-circular';
  label: string;
  description: string;
  icon: typeof Award;
}>;

export function EmployeeRoseFormsSection({ model }: { model: EmployeeProfileModel }) {
  const { openHrPdfPrep } = model;

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
        <div className="pointer-events-none absolute inset-0 dotted-bg opacity-25" aria-hidden />
        <div className="relative p-5 sm:p-6 space-y-5">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <FileStack className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                النماذج الرسمية
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                معاينة وتحميل نماذج الموارد البشرية المعتمدة للموظف — استقالة، إخلاء طرف، مخالصة،
                شهادة خبرة، سند استلام الراتب، وتعميم استخدام الجوال.
              </p>
            </div>
          </div>

          <div className="h-px bg-border/70" />

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">النماذج المتاحة</p>
            <div className="grid grid-cols-2 gap-3">
              {FORM_ACTIONS.map(({ key, label, description, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => openHrPdfPrep(key)}
                  className={cn(
                    'group relative flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-background p-3.5 text-right transition-all duration-200',
                    'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated',
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{label}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{description}</span>
                  </span>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:-translate-x-0.5 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
