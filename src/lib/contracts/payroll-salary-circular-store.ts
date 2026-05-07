import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** وصول التعميم / كشف الراتب للموظف */
export type PayrollSalaryCircularSendStatus = 'not_sent' | 'sent';

/** هل اطلع الموظف على التفاصيل */
export type PayrollSalaryCircularReadStatus = 'not_read' | 'read';

/** موافقة الموظف على صحة المستحق قبل إصدار المسير */
export type PayrollSalaryCircularApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'ignored';

export interface PayrollSalaryCircularEntry {
  sendStatus: PayrollSalaryCircularSendStatus;
  sentAt: string | null;
  readStatus: PayrollSalaryCircularReadStatus;
  readAt: string | null;
  approvalStatus: PayrollSalaryCircularApprovalStatus;
  respondedAt: string | null;
}

const DEFAULT_ENTRY: PayrollSalaryCircularEntry = {
  sendStatus: 'not_sent',
  sentAt: null,
  readStatus: 'not_read',
  readAt: null,
  approvalStatus: 'pending',
  respondedAt: null,
};

function key(periodId: string, employmentLineId: string) {
  return `${periodId}::${employmentLineId}`;
}

function nowIso() {
  return new Date().toISOString();
}

interface State {
  /** مفتاح: periodId::employmentLineId */
  entries: Record<string, PayrollSalaryCircularEntry>;
  getEntry: (periodId: string, employmentLineId: string) => PayrollSalaryCircularEntry;
  setSendStatus: (periodId: string, employmentLineId: string, status: PayrollSalaryCircularSendStatus) => void;
  markAllSent: (periodId: string, employmentLineIds: string[]) => void;
  setReadStatus: (periodId: string, employmentLineId: string, status: PayrollSalaryCircularReadStatus) => void;
  setApprovalStatus: (
    periodId: string,
    employmentLineId: string,
    status: PayrollSalaryCircularApprovalStatus,
  ) => void;
  resetLine: (periodId: string, employmentLineId: string) => void;
}

export const usePayrollSalaryCircularStore = create<State>()(
  persist(
    (set, get) => ({
      entries: {},

      getEntry: (periodId, employmentLineId) => ({
        ...DEFAULT_ENTRY,
        ...get().entries[key(periodId, employmentLineId)],
      }),

      setSendStatus: (periodId, employmentLineId, status) => {
        const k = key(periodId, employmentLineId);
        set((s) => {
          const prev = { ...DEFAULT_ENTRY, ...s.entries[k] };
          return {
            entries: {
              ...s.entries,
              [k]: {
                ...prev,
                sendStatus: status,
                sentAt: status === 'sent' ? (prev.sentAt ?? nowIso()) : null,
              },
            },
          };
        });
      },

      markAllSent: (periodId, employmentLineIds) => {
        const t = nowIso();
        set((s) => {
          const next = { ...s.entries };
          for (const lineId of employmentLineIds) {
            const k = key(periodId, lineId);
            const prev = { ...DEFAULT_ENTRY, ...next[k] };
            next[k] = { ...prev, sendStatus: 'sent' as const, sentAt: prev.sentAt ?? t };
          }
          return { entries: next };
        });
      },

      setReadStatus: (periodId, employmentLineId, status) => {
        const k = key(periodId, employmentLineId);
        set((s) => {
          const prev = { ...DEFAULT_ENTRY, ...s.entries[k] };
          return {
            entries: {
              ...s.entries,
              [k]: {
                ...prev,
                readStatus: status,
                readAt: status === 'read' ? (prev.readAt ?? nowIso()) : null,
              },
            },
          };
        });
      },

      setApprovalStatus: (periodId, employmentLineId, status) => {
        const k = key(periodId, employmentLineId);
        set((s) => {
          const prev = { ...DEFAULT_ENTRY, ...s.entries[k] };
          return {
            entries: {
              ...s.entries,
              [k]: {
                ...prev,
                approvalStatus: status,
                respondedAt: status === 'pending' ? null : (prev.respondedAt ?? nowIso()),
              },
            },
          };
        });
      },

      resetLine: (periodId, employmentLineId) => {
        const k = key(periodId, employmentLineId);
        set((s) => {
          const next = { ...s.entries };
          delete next[k];
          return { entries: next };
        });
      },
    }),
    {
      name: 'hr_payroll_salary_circular_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
);

export const SEND_STATUS_LABELS_AR: Record<PayrollSalaryCircularSendStatus, string> = {
  not_sent: 'لم يُرسل',
  sent: 'تم الإرسال',
};

export const READ_STATUS_LABELS_AR: Record<PayrollSalaryCircularReadStatus, string> = {
  not_read: 'لم تُقرأ',
  read: 'تمت القراءة',
};

export const APPROVAL_STATUS_LABELS_AR: Record<PayrollSalaryCircularApprovalStatus, string> = {
  pending: 'بانتظار الرد',
  approved: 'موافق',
  rejected: 'مرفوض',
  ignored: 'تجاهل',
};
