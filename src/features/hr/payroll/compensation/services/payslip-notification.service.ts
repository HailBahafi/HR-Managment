import { hrPayrollSalaryApprovalsQueryHref } from '@/features/hr/payroll/constants/routes';
import {
  notificationsApi,
  type SendNotificationDto,
} from '@/features/hr/notifications/lib/api/notifications';
import type { PayrollNotifyDeliveryMode } from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';

export type PayslipGeneratedNotificationInput = {
  companyId: string;
  periodId: string;
  periodNameAr: string;
  employeeIds: string[];
  createdBy?: string | null;
};

export type CashReceiptSignatureNotificationInput = {
  companyId: string;
  periodId: string;
  periodNameAr: string;
  employeeIds: string[];
  createdBy?: string | null;
};

export async function sendPayslipGeneratedNotification(input: PayslipGeneratedNotificationInput) {
  const uniqueEmployeeIds = [...new Set(input.employeeIds.filter(Boolean))];
  if (uniqueEmployeeIds.length === 0) return null;

  const dto: SendNotificationDto = {
    companyId: input.companyId,
    category: 'payroll',
    severity: 'info',
    titleAr: `قسيمة راتب — ${input.periodNameAr}`,
    bodyAr: `تم إعداد قسيمة راتبكم لفترة ${input.periodNameAr}. يرجى مراجعتها والموافقة عليها من خلال النظام.`,
    audienceKind: 'employee',
    employeeIds: uniqueEmployeeIds,
    deliveryChannel: 'in_app',
    sourceKind: 'payroll_payslip',
    sourceTable: 'hr_payroll_periods',
    sourceId: input.periodId,
    actionUrl: hrPayrollSalaryApprovalsQueryHref(input.periodId),
    actionLabelAr: 'عرض القسيمة',
    requiresAcknowledgment: true,
    createdBy: input.createdBy ?? null,
  };

  return notificationsApi.send(dto);
}

export async function sendCashReceiptSignatureNotification(
  input: CashReceiptSignatureNotificationInput,
) {
  const uniqueEmployeeIds = [...new Set(input.employeeIds.filter(Boolean))];
  if (uniqueEmployeeIds.length === 0) return null;

  const dto: SendNotificationDto = {
    companyId: input.companyId,
    category: 'payroll',
    severity: 'info',
    titleAr: `سند استلام راتب — ${input.periodNameAr}`,
    bodyAr: `يرجى فتح سند استلام الراتب لفترة ${input.periodNameAr}، قراءته بالكامل، ثم التوقيع عليه (رسم التوقيع أو رفع ملف موقّع).`,
    audienceKind: 'employee',
    employeeIds: uniqueEmployeeIds,
    deliveryChannel: 'in_app',
    sourceKind: 'cash_receipt_signature',
    sourceTable: 'hr_payroll_periods',
    sourceId: input.periodId,
    actionLabelAr: 'فتح السند والتوقيع',
    requiresAcknowledgment: true,
    createdBy: input.createdBy ?? null,
  };

  return notificationsApi.send(dto);
}

export function deliveryIncludesPayslipNotify(mode: PayrollNotifyDeliveryMode): boolean {
  return mode === 'notify_only' || mode === 'both';
}

export function deliveryIncludesPdfSign(mode: PayrollNotifyDeliveryMode): boolean {
  return mode === 'pdf_sign' || mode === 'both';
}
