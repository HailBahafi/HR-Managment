'use client';

import * as React from 'react';
import { Banknote, FileText, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DisplayDate } from '@/components/ui/table-cells';
import { cn } from '@/shared/utils';
import { statusPillClass } from '@/shared/status-pill-classes';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  CASH_RECEIPT_VOUCHER_PURPOSE_LABELS,
  type CashReceiptVoucherDto,
  type CashReceiptVoucherPurpose,
} from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';
import { useEmployeeCashReceiptVouchers } from '@/features/hr/organization/employees/hooks/useEmployeeCashReceiptVouchers';
import { EmployeeCashReceiptVoucherCreateDialog } from '@/features/hr/organization/employees/components/dialogs/employee-cash-receipt-voucher-create-dialog';

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

function purposeLabel(purpose: string) {
  return CASH_RECEIPT_VOUCHER_PURPOSE_LABELS[purpose as CashReceiptVoucherPurpose] ?? purpose;
}

function formatAmount(amount: string | number) {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Props = {
  employee: Employee;
  onOpenPdfPrep: () => void;
};

export function EmployeeCashReceiptVouchersPanel({ employee, onOpenPdfPrep }: Props) {
  const { items, total, loading, error, saving, reload, create, getById } =
    useEmployeeCashReceiptVouchers(employee, true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<CashReceiptVoucherDto | null>(null);
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
          <p className="text-sm font-semibold text-foreground">سندات الاستلام النقدي</p>
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
            سند جديد
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
          جاري تحميل السندات…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center">
          <Banknote className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">لا توجد سندات استلام بعد</p>
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
                  <Banknote className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground" dir="ltr">
                      {item.voucherNumber}
                    </span>
                    <span className={statusPillClass(statusTone(item.status))}>
                      {statusLabel(item.status)}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {purposeLabel(item.purpose)}
                    </Badge>
                  </span>
                  <span className="block text-xs font-medium text-foreground" dir="ltr">
                    {formatAmount(item.amount)} ر.س
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    التاريخ: <DisplayDate value={item.receiptDate} />
                    {item.branchNameAr ? ` · ${item.branchNameAr}` : ''}
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

      {detail ? <CashReceiptVoucherDetail card={detail} /> : null}

      <EmployeeCashReceiptVoucherCreateDialog
        open={createOpen}
        employee={employee}
        saving={saving}
        onOpenChange={setCreateOpen}
        onSubmit={create}
      />
    </div>
  );
}

function CashReceiptVoucherDetail({ card }: { card: CashReceiptVoucherDto }) {
  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-foreground">تفاصيل السند</p>
        <span className={statusPillClass(statusTone(card.status))}>{statusLabel(card.status)}</span>
        <Badge variant="secondary" className="text-[10px]">
          {purposeLabel(card.purpose)}
        </Badge>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <DetailItem label="رقم السند" value={card.voucherNumber} mono />
        <DetailItem label="تاريخ الاستلام" value={<DisplayDate value={card.receiptDate} />} />
        <DetailItem label="المبلغ" value={`${formatAmount(card.amount)} ر.س`} mono />
        <DetailItem label="المبلغ كتابةً" value={card.amountInWords || '—'} />
        <DetailItem label="المستلم" value={card.recipientNameAr || '—'} />
        <DetailItem label="المؤسسة" value={card.institutionNameAr || '—'} />
        <DetailItem label="الفرع" value={card.branchNameAr || '—'} />
        <DetailItem label="توقيع المستلم" value={card.signatureName || '—'} />
        {card.purposeMonth != null || card.purposeYear != null ? (
          <DetailItem
            label="الشهر / السنة"
            value={`${card.purposeMonth ?? '—'} / ${card.purposeYear ?? '—'}`}
            mono
          />
        ) : null}
        {card.overtimeDays != null ? (
          <DetailItem label="أيام الإضافي" value={String(card.overtimeDays)} mono />
        ) : null}
        {card.otherDescription ? (
          <DetailItem label="وصف إضافي" value={card.otherDescription} className="sm:col-span-2" />
        ) : null}
        <DetailItem label="مدير الفرع" value={card.branchManagerSignatureName || '—'} />
        <DetailItem label="شؤون الموظفين" value={card.hrAffairsSignatureName || '—'} />
        <DetailItem label="المشرف العام" value={card.generalSupervisorSignatureName || '—'} />
        <DetailItem label="المدير المالي" value={card.financialManagerSignatureName || '—'} />
        <DetailItem
          label="تاريخ الإصدار الفعلي"
          value={card.issuedAt ? <DisplayDate value={card.issuedAt} mode="datetime" /> : '—'}
        />
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
