'use client';

import * as React from 'react';
import { Award, FileText, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DisplayDate } from '@/components/ui/table-cells';
import { cn } from '@/shared/utils';
import { statusPillClass } from '@/shared/status-pill-classes';
import type { Employee } from '@/features/hr/organization/employees/types';
import type { ExperienceCertificateDto } from '@/features/hr/organization/employees/lib/api/experience-certificates';
import { useEmployeeExperienceCertificates } from '@/features/hr/organization/employees/hooks/useEmployeeExperienceCertificates';
import { EmployeeExperienceCertificateCreateDialog } from '@/features/hr/organization/employees/components/dialogs/employee-experience-certificate-create-dialog';

function statusLabel(status: string) {
  switch (status) {
    case 'issued':
      return 'صادرة';
    case 'revoked':
      return 'ملغاة';
    case 'draft':
    default:
      return 'مسودة';
  }
}

function statusTone(status: string): 'active' | 'rejected' | 'pending' {
  if (status === 'issued') return 'active';
  if (status === 'revoked') return 'rejected';
  return 'pending';
}

function languageLabel(language: string) {
  if (language === 'en') return 'EN';
  if (language === 'both') return 'AR/EN';
  return 'عربي';
}

type Props = {
  employee: Employee;
  onOpenPdfPrep: () => void;
};

export function EmployeeExperienceCertificatesPanel({ employee, onOpenPdfPrep }: Props) {
  const { items, total, loading, error, saving, reload, create } =
    useEmployeeExperienceCertificates(employee, true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  React.useEffect(() => {
    if (selectedId && !items.some((item) => item.id === selectedId)) {
      setSelectedId(null);
    }
  }, [items, selectedId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">شهادات الخبرة</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            السجلات المحفوظة عبر الـ API ({total}) — اضغط سجلاً لعرض التفاصيل
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => void reload()}
            disabled={loading}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            تحديث
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={onOpenPdfPrep}
          >
            <FileText className="h-3.5 w-3.5" />
            معاينة PDF
          </Button>
          <Button
            type="button"
            variant="luxe"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            شهادة جديدة
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري تحميل الشهادات…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center">
          <Award className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">لا توجد شهادات خبرة بعد</p>
          <p className="text-xs text-muted-foreground">أنشئ مسودة جديدة لربطها بهذا الموظف</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedId((prev) => (prev === item.id ? null : item.id))}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border bg-background p-3.5 text-right transition-colors',
                  selectedId === item.id
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/70 hover:border-primary/30 hover:bg-muted/30',
                )}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Award className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground" dir="ltr">
                      {item.certificateNumber}
                    </span>
                    <span className={statusPillClass(statusTone(item.status))}>
                      {statusLabel(item.status)}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {languageLabel(item.language)}
                    </Badge>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.jobTitleOnCertificate}
                  </span>
                  <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span>
                      الإصدار: <DisplayDate value={item.issuanceDate} />
                    </span>
                    <span>
                      الخدمة: <DisplayDate value={item.serviceStartDate} />
                      {item.serviceEndDate ? (
                        <>
                          {' — '}
                          <DisplayDate value={item.serviceEndDate} />
                        </>
                      ) : null}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected ? <ExperienceCertificateDetail card={selected} /> : null}

      <EmployeeExperienceCertificateCreateDialog
        open={createOpen}
        employee={employee}
        saving={saving}
        onOpenChange={setCreateOpen}
        onSubmit={create}
      />
    </div>
  );
}

function ExperienceCertificateDetail({ card }: { card: ExperienceCertificateDto }) {
  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-foreground">تفاصيل الشهادة</p>
        <span className={statusPillClass(statusTone(card.status))}>{statusLabel(card.status)}</span>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <DetailItem label="رقم الشهادة" value={card.certificateNumber} mono />
        <DetailItem label="المسمى الوظيفي" value={card.jobTitleOnCertificate} />
        <DetailItem label="تاريخ الإصدار" value={<DisplayDate value={card.issuanceDate} />} />
        <DetailItem label="اللغة" value={languageLabel(card.language)} />
        <DetailItem label="بداية الخدمة" value={<DisplayDate value={card.serviceStartDate} />} />
        <DetailItem
          label="نهاية الخدمة"
          value={card.serviceEndDate ? <DisplayDate value={card.serviceEndDate} /> : '—'}
        />
        <DetailItem label="الغرض" value={card.purpose || '—'} />
        <DetailItem label="موجّهة إلى" value={card.addressedTo || '—'} />
        <DetailItem
          label="ملخص المهام"
          value={card.dutiesSummary || '—'}
          className="sm:col-span-2"
        />
        <DetailItem label="ملاحظات" value={card.notes || '—'} className="sm:col-span-2" />
        <DetailItem
          label="أصدرها"
          value={card.issuedByEmployeeNameAr || '—'}
        />
        <DetailItem
          label="تاريخ الإصدار الفعلي"
          value={card.issuedAt ? <DisplayDate value={card.issuedAt} mode="datetime" /> : '—'}
        />
      </dl>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className={cn('mt-0.5 text-foreground', mono && 'font-mono text-xs')} dir={mono ? 'ltr' : undefined}>
        {value}
      </dd>
    </div>
  );
}
