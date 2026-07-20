import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type CashReceiptVoucherStatus = 'draft' | 'issued' | 'revoked';

/** الغرض: راتب / مواصلات / إضافي / عجز مخزون / سحب نقدي / أخرى */
export type CashReceiptVoucherPurpose =
  | 'salary'
  | 'transport'
  | 'overtime'
  | 'storage_deficit'
  | 'cash_withdrawal'
  | 'other';

export const CASH_RECEIPT_VOUCHER_PURPOSE_LABELS: Record<CashReceiptVoucherPurpose, string> = {
  salary: 'راتب',
  transport: 'مواصلات',
  overtime: 'إضافي',
  storage_deficit: 'عجز مخزون',
  cash_withdrawal: 'سحب نقدي',
  other: 'أخرى',
};

export type CashReceiptVoucherDto = {
  id: string;
  companyId: string;
  employeeId: string;
  recipientNameAr: string | null;
  institutionNameAr: string | null;
  branchNameAr: string | null;
  issuedByEmployeeId: string | null;
  issuedByEmployeeNameAr: string | null;
  voucherNumber: string;
  amount: string | number;
  amountInWords: string | null;
  purpose: CashReceiptVoucherPurpose | string;
  purposeMonth: number | null;
  purposeYear: number | null;
  overtimeDays: number | null;
  otherDescription: string | null;
  signatureName: string | null;
  receiptDate: string;
  branchManagerSignatureName: string | null;
  hrAffairsSignatureName: string | null;
  generalSupervisorSignatureName: string | null;
  financialManagerSignatureName: string | null;
  status: CashReceiptVoucherStatus | string;
  notes: string | null;
  attachments: unknown[] | null;
  issuedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateCashReceiptVoucherDto = {
  companyId: string;
  employeeId: string;
  issuedByEmployeeId?: string | null;
  voucherNumber: string;
  receiptDate: string;
  amount: number;
  amountInWords: string;
  purpose: CashReceiptVoucherPurpose | string;
  purposeMonth?: number | null;
  purposeYear?: number | null;
  overtimeDays?: number | null;
  otherDescription?: string | null;
  branchNameAr?: string | null;
  institutionNameAr?: string | null;
  signatureName?: string | null;
  branchManagerSignatureName?: string | null;
  hrAffairsSignatureName?: string | null;
  generalSupervisorSignatureName?: string | null;
  financialManagerSignatureName?: string | null;
  notes?: string | null;
  attachments?: unknown[] | null;
  createdBy?: string | null;
};

export type CashReceiptVoucherListParams = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  issuedByEmployeeId?: string;
  status?: string;
  purpose?: string;
  voucherNumber?: string;
  receiptDateFrom?: string;
  receiptDateTo?: string;
};

export const cashReceiptVouchersApi = {
  getAll(query?: CashReceiptVoucherListParams) {
    return apiRequest<PaginatedResult<CashReceiptVoucherDto>>('/hr/cash-receipt-vouchers', {
      query,
    });
  },

  getById(id: string) {
    return apiRequest<CashReceiptVoucherDto>(`/hr/cash-receipt-vouchers/${id}`);
  },

  create(payload: CreateCashReceiptVoucherDto) {
    return apiRequest<CashReceiptVoucherDto>('/hr/cash-receipt-vouchers', {
      method: 'POST',
      body: payload,
    });
  },
};
