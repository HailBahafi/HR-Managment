'use client';

import * as React from 'react';
import { FileText, Loader2, LogOut, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DisplayDate } from '@/components/ui/table-cells';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { cn } from '@/shared/utils';
import { statusPillClass } from '@/shared/status-pill-classes';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { usePdfCompanyLetterhead } from '@/components/pdf/hooks/use-pdf-company-letterhead';
import type { Employee } from '@/features/hr/organization/employees/types';
import type { EmployeeResignationDto } from '@/features/hr/organization/employees/lib/api/employee-resignations';
import { useEmployeeResignations } from '@/features/hr/organization/employees/hooks/useEmployeeResignations';
import { EmployeeResignationCreateDialog } from '@/features/hr/organization/employees/components/dialogs/employee-resignation-create-dialog';
import {
  RoseResignationPrintHtml,
} from '@/components/pdf/rose-trading/rose-resignation-print-html';
import { buildResignationPrintFields } from '@/features/hr/organization/employees/lib/rose-document-templates/build-print-fields';

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
  const { data: activeCompany } = useActiveCompany();
  const pdfCompany = usePdfCompanyLetterhead();
  const companyNameAr = activeCompany?.nameAr ?? pdfCompany.companyNameAr;
  const companyNameEn = activeCompany?.nameEn ?? pdfCompany.companyNameEn;

  const [createOpen, setCreateOpen] = React.useState(false);
  const [previewCard, setPreviewCard] = React.useState<EmployeeResignationDto | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  const openVoucherPdf = async (id: string) => {
    const fromList = items.find((item) => item.id === id) ?? null;
    if (fromList) setPreviewCard(fromList);
    setPreviewLoading(true);
    const fresh = await getById(id);
    if (fresh) setPreviewCard(fresh);
    setPreviewLoading(false);
  };

  const printable = React.useMemo(() => {
    if (!previewCard) return null;
    return (
      <RoseResignationPrintHtml
        companyNameAr={companyNameAr}
        companyNameEn={companyNameEn}
        fields={buildResignationPrintFields(previewCard, {
          employee,
          companyNameAr,
        })}
      />
    );
  }, [previewCard, companyNameAr, companyNameEn, employee]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">طلبات الاستقالة</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            السجلات المحفوظة ({total}) — اضغط سجلاً لفتح معاينة PDF
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
            نموذج فارغ
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
                onClick={() => void openVoucherPdf(item.id)}
                className="flex w-full items-start gap-3 rounded-xl border border-border/70 bg-background p-3.5 text-right transition-colors hover:border-primary/30 hover:bg-muted/30"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
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
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span>
                      التقديم: <DisplayDate value={item.submissionDate} />
                    </span>
                    <span>
                      السريان: <DisplayDate value={item.effectiveDateGregorian} />
                    </span>
                    <span className="inline-flex items-center gap-1 text-primary">
                      <FileText className="h-3 w-3" />
                      فتح PDF
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {previewLoading && !previewCard ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري تحضير معاينة PDF…
        </div>
      ) : null}

      <PdfPreviewExportDialog
        open={!!previewCard}
        onOpenChange={(openNext) => {
          if (!openNext) setPreviewCard(null);
        }}
        title={
          previewCard
            ? `طلب استقالة — ${previewCard.resignationNumber}`
            : 'طلب استقالة'
        }
        fileName={
          previewCard
            ? `resignation-${previewCard.resignationNumber}.pdf`
            : 'resignation.pdf'
        }
        printable={printable}
      />

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
