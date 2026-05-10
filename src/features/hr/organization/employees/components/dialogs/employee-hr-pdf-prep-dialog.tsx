'use client';

import * as React from 'react';
import type { Employee } from '@/types';
import type { EmployeeHrPdfPrepKind } from '@/features/hr/organization/employees/hooks/useEmployeeProfileRosePdf';
import type { RoseTradingHrPdfOverrides } from '@/lib/pdf/build-rose-trading-hr-pdf-props';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MinimalDropdown } from '@/components/hr-requests/shared-ui';
import { REASON_LABELS, type CashReceiptReason } from '@/features/hr/contracts/reports/components/pdf-cash-receipt';

type Props = {
  open: boolean;
  prepKind: EmployeeHrPdfPrepKind;
  employee: Employee;
  onCancel: () => void;
  onApplyResignation: (patch: Pick<RoseTradingHrPdfOverrides, 'absenceStartIso' | 'resignationAddressedToAr' | 'resignationReasonLines'>) => void;
  onApplyClearance: (patch: Pick<RoseTradingHrPdfOverrides, 'clearanceReasonAr'>) => void;
  onApplyCashReceipt: (payload: {
    receipt: {
      amount: number;
      amountWritten: string;
      reason: CashReceiptReason;
      reasonDetail: string;
      date: string;
    };
  }) => void;
  onApplyExperience: (patch: Pick<RoseTradingHrPdfOverrides, 'certificateEndIso' | 'certificateIssueIso'>) => void;
};

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

const CASH_REASON_OPTIONS = (Object.keys(REASON_LABELS) as CashReceiptReason[]).map((k) => ({
  value: k,
  label: REASON_LABELS[k],
}));

export function EmployeeHrPdfPrepDialog(props: Props) {
  const { open, prepKind, employee, onCancel } = props;
  const [absenceIso, setAbsenceIso] = React.useState(todayYmd());
  const [toWhom, setToWhom] = React.useState('إدارة الموارد البشرية — مؤسسة روز للتجارة');
  const [reasonLines, setReasonLines] = React.useState('');
  const [clearanceReason, setClearanceReason] = React.useState('');
  const [cashAmt, setCashAmt] = React.useState('');
  const [cashWritten, setCashWritten] = React.useState('');
  const [cashDetail, setCashDetail] = React.useState('—');
  const [cashReason, setCashReason] = React.useState<CashReceiptReason>('salary');
  const [cashDate, setCashDate] = React.useState(todayYmd());
  const [certEnd, setCertEnd] = React.useState(employee.endDate?.slice(0, 10) || todayYmd());
  const [certIssued, setCertIssued] = React.useState(todayYmd());

  React.useEffect(() => {
    if (!open) return;
    setAbsenceIso(todayYmd());
    setCertEnd(employee.endDate?.slice(0, 10) || todayYmd());
    setCertIssued(todayYmd());
    setCashDate(todayYmd());
  }, [open, employee.endDate]);

  if (!prepKind || !open) return null;

  const title =
    prepKind === 'resignation'
      ? 'بيانات نموذج الاستقالة'
      : prepKind === 'clearance'
        ? 'سبب إخلاء الطرف'
        : prepKind === 'cash-receipt'
          ? 'سند استلام نقدي للراتب'
          : 'شهادة خبرة — التواريخ';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-lg border-border">
        <DialogHeader className="text-right">
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription className="sr-only">أدخل الحقول المطلوبة ثم ولِّد المعاينة</DialogDescription>
          <p className="text-xs text-muted-foreground">
            تم التعبئة الأولية من بيانات الموظف: <span className="font-medium text-foreground">{employee.name}</span>
          </p>
        </DialogHeader>

        {prepKind === 'resignation' ? (
          <div className="grid gap-3 py-2 text-right">
            <div className="space-y-1.5">
              <Label htmlFor="hr-prep-to">إلى / لمَ يُوجَّه الطلب</Label>
              <Input id="hr-prep-to" value={toWhom} onChange={(e) => setToWhom(e.target.value)} className="text-right" dir="rtl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hr-prep-reason">أسباب الاستقالة (كل سطر = نقطة)</Label>
              <Textarea
                id="hr-prep-reason"
                value={reasonLines}
                onChange={(e) => setReasonLines(e.target.value)}
                placeholder={`مثال:\nاستكمال مسار مهني خارج المؤسسة\nظروف عائلية تستدعي الانتقال`}
                rows={5}
                className="resize-y text-right text-sm leading-relaxed"
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hr-prep-abs">تاريخ بداية اعتبار الغياب (ميلادي)</Label>
              <Input id="hr-prep-abs" type="date" value={absenceIso} onChange={(e) => setAbsenceIso(e.target.value)} className="text-right font-mono" dir="ltr" />
              <p className="text-[10px] text-muted-foreground">يُحوَّل الهجري تلقائياً في PDF.</p>
            </div>
          </div>
        ) : null}

        {prepKind === 'clearance' ? (
          <div className="grid gap-2 py-2 text-right">
            <Label htmlFor="hr-clr">سبب إخلاء الطرف (سيظهر في النموذج)</Label>
            <Textarea id="hr-clr" rows={5} value={clearanceReason} onChange={(e) => setClearanceReason(e.target.value)} placeholder="صف سبب الخروج وبنود الذمة …" dir="rtl" />
          </div>
        ) : null}

        {prepKind === 'cash-receipt' ? (
          <div className="grid gap-3 py-2 text-right">
            <div className="space-y-1.5">
              <Label htmlFor="hr-c-amt">المبلغ (رقماً)</Label>
              <Input id="hr-c-amt" type="number" min="0" value={cashAmt} onChange={(e) => setCashAmt(e.target.value)} className="font-mono" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hr-c-w">المبلغ كتابة (اختياري)</Label>
              <Input id="hr-c-w" value={cashWritten} onChange={(e) => setCashWritten(e.target.value)} className="text-right" dir="rtl" />
            </div>
            <div className="space-y-1.5">
              <Label>نوع الاستلام</Label>
              <MinimalDropdown value={cashReason} onChange={(v) => setCashReason(v as CashReceiptReason)} options={CASH_REASON_OPTIONS} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hr-c-det">التفاصيل (شهر أو وصف مختصر)</Label>
              <Input id="hr-c-det" value={cashDetail} onChange={(e) => setCashDetail(e.target.value)} dir="rtl" className="text-right" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hr-c-dt">التاريخ</Label>
              <Input id="hr-c-dt" type="date" value={cashDate} onChange={(e) => setCashDate(e.target.value)} className="font-mono" dir="ltr" />
            </div>
          </div>
        ) : null}

        {prepKind === 'experience' ? (
          <div className="grid gap-3 py-2 text-right">
            <div className="space-y-1.5">
              <Label htmlFor="hr-e-end">تاريخ نهاية الخدمة المعروض في الشهادة (ميلادي)</Label>
              <Input id="hr-e-end" type="date" value={certEnd} onChange={(e) => setCertEnd(e.target.value)} className="font-mono" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hr-e-iss">تاريخ إصدار الشهادة</Label>
              <Input id="hr-e-iss" type="date" value={certIssued} onChange={(e) => setCertIssued(e.target.value)} className="font-mono" dir="ltr" />
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex flex-row-reverse flex-wrap gap-2 sm:justify-start">
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button
            type="button"
            variant="luxe"
            onClick={() => {
              if (prepKind === 'resignation') {
                props.onApplyResignation({
                  absenceStartIso: absenceIso,
                  resignationAddressedToAr: toWhom.trim(),
                  resignationReasonLines: reasonLines.split('\n').map((x) => x.trim()).filter(Boolean),
                });
                return;
              }
              if (prepKind === 'clearance') {
                if (!clearanceReason.trim()) {
                  toast.error('أدخل سبب إخلاء الطرف');
                  return;
                }
                props.onApplyClearance({ clearanceReasonAr: clearanceReason.trim() });
                return;
              }
              if (prepKind === 'cash-receipt') {
                const amt = Number(cashAmt);
                if (!Number.isFinite(amt) || amt <= 0) {
                  toast.error('أدخل مبلغاً صالحاً');
                  return;
                }
                props.onApplyCashReceipt({
                  receipt: {
                    amount: amt,
                    amountWritten: cashWritten.trim(),
                    reason: cashReason,
                    reasonDetail: cashDetail.trim() || '—',
                    date: cashDate,
                  },
                });
                return;
              }
              if (prepKind === 'experience') {
                props.onApplyExperience({ certificateEndIso: certEnd, certificateIssueIso: certIssued });
              }
            }}
          >
            إنشاء معاينة PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
