'use client';

import * as React from 'react';
import { FileText, Loader2, LogOut, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DisplayDate } from '@/components/ui/table-cells';
import { cn } from '@/shared/utils';
import { statusPillClass } from '@/shared/status-pill-classes';
import type { Employee } from '@/features/hr/organization/employees/types';
import type { EmployeeResignationDto } from '@/features/hr/organization/employees/lib/api/employee-resignations';
import { useEmployeeResignations } from '@/features/hr/organization/employees/hooks/useEmployeeResignations';
import { EmployeeResignationCreateDialog } from '@/features/hr/organization/employees/components/dialogs/employee-resignation-create-dialog';

function statusLabel(status: string) {
  switch (status) {
    case 'issued':
      return 'صادر';
    case 'revoked':
      return 'ملغى';
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

type Props = {
  employee: Employee;
  onOpenPdfPrep: () => void;
};

export function EmployeeResignationsPanel({ employee, onOpenPdfPrep }: Props) {
  const { items, total, loading, error, saving, reload, create, getById } =
    useEmployeeResignations(employee, true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<EmployeeResignationDto | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  React.useEffect(() => {
    if (selectedId && !items.some((item) => item.id === selectedId)) {
      setSelectedId(null);
      setDetail(null);
    }
  }, [items, selectedId]);

  const selectItem = async (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      setDetail(null);
      return;
    }
    setSelectedId(id);
    const fromList = items.find((item) => item.id === id) ?? null;
    setDetail(fromList);
    setDetailLoading(true);
    const fresh = await getById(id);
    if (fresh) setDetail(fresh);
    setDetailLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">طلبات الاستقالة</p>
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
            استقالة جديدة
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
          جاري تحميل طلبات الاستقالة…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center">
          <LogOut className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">لا توجد طلبات استقالة بعد</p>
          <p className="text-xs text-muted-foreground">أنشئ مسودة جديدة لربطها بهذا الموظف</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void selectItem(item.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border bg-background p-3.5 text-right transition-colors',
                  selectedId === item.id
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/70 hover:border-primary/30 hover:bg-muted/30',
                )}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <LogOut className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground" dir="ltr">
                      {item.resignationNumber}
                    </span>
                    <span className={statusPillClass(statusTone(item.status))}>
                      {statusLabel(item.status)}
                    </span>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.jobTitle || '—'}
                    {item.branchNameAr ? ` · ${item.branchNameAr}` : ''}
                  </span>
                  <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span>
                      التقديم: <DisplayDate value={item.submissionDate} />
                    </span>
                    <span>
                      السريان: <DisplayDate value={item.effectiveDateGregorian} />
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedId && detailLoading && !detail ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري تحميل التفاصيل…
        </div>
      ) : null}

      {detail ? <EmployeeResignationDetail card={detail} /> : null}

      <EmployeeResignationCreateDialog
        open={createOpen}
        employee={employee}
        saving={saving}
        onOpenChange={setCreateOpen}
        onSubmit={create}
      />
    </div>
  );
}

function EmployeeResignationDetail({ card }: { card: EmployeeResignationDto }) {
  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-foreground">تفاصيل طلب الاستقالة</p>
        <span className={statusPillClass(statusTone(card.status))}>{statusLabel(card.status)}</span>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <DetailItem label="رقم الاستقالة" value={card.resignationNumber} mono />
        <DetailItem label="المسمى الوظيفي" value={card.jobTitle || '—'} />
        <DetailItem label="تاريخ التقديم" value={<DisplayDate value={card.submissionDate} />} />
        <DetailItem
          label="تاريخ السريان (ميلادي)"
          value={<DisplayDate value={card.effectiveDateGregorian} />}
        />
        <DetailItem label="تاريخ السريان (هجري)" value={card.effectiveDateHijri || '—'} mono />
        <DetailItem label="الفرع" value={card.branchNameAr || '—'} />
        <DetailItem label="الجنسية" value={card.nationality || '—'} />
        <DetailItem label="مقدّم الطلب" value={card.applicantName || '—'} />
        <DetailItem label="اسم التوقيع" value={card.signatureName || '—'} />
        <DetailItem label="أصدره" value={card.issuedByEmployeeNameAr || '—'} />
        <DetailItem
          label="تاريخ الإصدار الفعلي"
          value={card.issuedAt ? <DisplayDate value={card.issuedAt} mode="datetime" /> : '—'}
        />
        <DetailItem label="الأسباب" value={card.reasons || '—'} className="sm:col-span-2 whitespace-pre-wrap" />
        <DetailItem label="ملاحظات" value={card.notes || '—'} className="sm:col-span-2" />
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
