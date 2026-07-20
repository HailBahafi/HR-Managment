'use client';

import * as React from 'react';
import {
  Award,
  Banknote,
  ClipboardCheck,
  FileSignature,
  FileStack,
  LogOut,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { EmployeeExperienceCertificatesPanel } from '@/features/hr/organization/employees/components/sections/employee-experience-certificates-panel';
import { EmployeeClearancesPanel } from '@/features/hr/organization/employees/components/sections/employee-clearances-panel';

type FormTabKey = 'resignation' | 'clearance' | 'settlement' | 'experience' | 'cash-receipt';

const FORM_TABS = [
  {
    key: 'resignation' as const,
    shortLabel: 'استقالة',
    label: 'نموذج استقالة',
    description: 'طلب استقالة الموظف من العمل',
    icon: LogOut,
  },
  {
    key: 'clearance' as const,
    shortLabel: 'إخلاء طرف',
    label: 'نموذج إخلاء طرف',
    description: 'تأكيد عدم وجود التزامات متبادلة',
    icon: ClipboardCheck,
  },
  {
    key: 'settlement' as const,
    shortLabel: 'مخالصة',
    label: 'مخالصة نهائية',
    description: 'تسوية المستحقات المالية النهائية',
    icon: FileSignature,
  },
  {
    key: 'experience' as const,
    shortLabel: 'شهادة خبرة',
    label: 'شهادة خبرة',
    description: 'إثبات مدة وطبيعة الخبرة العملية',
    icon: Award,
  },
  {
    key: 'cash-receipt' as const,
    shortLabel: 'سند راتب',
    label: 'سند استلام نقدي للراتب',
    description: 'إثبات استلام الراتب نقداً',
    icon: Banknote,
  },
] satisfies Array<{
  key: FormTabKey;
  shortLabel: string;
  label: string;
  description: string;
  icon: typeof Award;
}>;

export function EmployeeRoseFormsSection({ model }: { model: EmployeeProfileModel }) {
  const { employee, openHrPdfPrep, openRoseTemplateSettings } = model;
  const [activeTab, setActiveTab] = React.useState<FormTabKey>('resignation');

  const active = FORM_TABS.find((tab) => tab.key === activeTab) ?? FORM_TABS[0];
  const ActiveIcon = active.icon;

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
        <div className="pointer-events-none absolute inset-0 dotted-bg opacity-25" aria-hidden />
        <div className="relative p-5 sm:p-6 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                  شهادة خبرة، وسند استلام الراتب.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full shrink-0 gap-2 text-xs sm:w-auto sm:self-start"
              onClick={() =>
                openRoseTemplateSettings(
                  activeTab === 'cash-receipt' ? 'resignation' : activeTab,
                )
              }
            >
              <Settings2 className="h-4 w-4 shrink-0" />
              إعدادات القوالب
            </Button>
          </div>

          <div className="h-px bg-border/70" />

          {/* Pill header tabs */}
          <div
            className="flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="أنواع النماذج الرسمية"
          >
            {FORM_TABS.map((tab) => {
              const selected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                    selected
                      ? 'border-foreground/80 bg-muted text-primary shadow-sm'
                      : 'border-border bg-background text-foreground/80 hover:bg-muted/50',
                  )}
                >
                  {tab.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Active form details */}
          <div
            role="tabpanel"
            className="rounded-xl border border-border/70 bg-background/80 p-4 sm:p-5"
          >
            {activeTab === 'experience' ? (
              <EmployeeExperienceCertificatesPanel
                employee={employee}
                onOpenPdfPrep={() => openHrPdfPrep('experience')}
              />
            ) : activeTab === 'clearance' ? (
              <EmployeeClearancesPanel
                employee={employee}
                onOpenPdfPrep={() => openHrPdfPrep('clearance')}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <ActiveIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{active.label}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {active.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="luxe"
                    size="sm"
                    className="gap-2"
                    onClick={() => openHrPdfPrep(active.key)}
                  >
                    <ActiveIcon className="h-4 w-4" />
                    فتح وإعداد النموذج
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
