import { create } from 'zustand';
import { correctionRequestsApi, type ApiCorrectionRequest, type CorrectionRequestStatus } from './api/correction-requests';
import { useAuthStore } from '@/features/auth/lib/auth-store';

export type AttendanceCorrectionRequest = {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  /** Department display name returned by the backend (not an ID). */
  departmentNameAr: string;
  /** kept for UI compat — derived from requestTypeNameAr */
  requestTypeId: string;
  requestTypeNameAr: string;
  workDate: string;
  previousCheckIn: string;
  previousCheckOut: string;
  correctedCheckIn: string;
  correctedCheckOut: string;
  previousStatusAr: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reasonAr: string;
  decisionNotesAr: string;
  createdAt: string;
  decidedAt: string | null;
  decidedByEmployeeId: string | null;
};

function isoToTime(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toTimeString().slice(0, 5);
  } catch {
    return '';
  }
}

function dateTimeIso(workDate: string, time: string): string | undefined {
  if (!time) return undefined;
  return `${workDate}T${time}:00`;
}

function mapApi(r: ApiCorrectionRequest): AttendanceCorrectionRequest {
  return {
    id: r.id,
    employeeId: r.employeeId,
    employeeNameAr: r.employeeNameAr,
    departmentNameAr: r.departmentNameAr ?? '',
    requestTypeId: r.requestTypeId,
    requestTypeNameAr: r.requestTypeNameAr,
    workDate: r.workDate,
    previousCheckIn: isoToTime(r.previousCheckInAt),
    previousCheckOut: isoToTime(r.previousCheckOutAt),
    correctedCheckIn: isoToTime(r.correctedCheckInAt),
    correctedCheckOut: isoToTime(r.correctedCheckOutAt),
    previousStatusAr: r.previousStatus ?? '',
    status: r.status as AttendanceCorrectionRequest['status'],
    reasonAr: r.reasonAr ?? '',
    decisionNotesAr: r.decisionNotesAr ?? '',
    createdAt: r.createdAt,
    decidedAt: r.decidedAt,
    decidedByEmployeeId: r.decidedByEmployeeId,
  };
}

interface State {
  items: AttendanceCorrectionRequest[];
  isLoading: boolean;
  error: string | null;
  fetch: (params?: { employeeId?: string; status?: string; workDateFrom?: string; workDateTo?: string }) => Promise<void>;
  submit: (input: {
    employeeId: string;
    requestTypeId: string;
    workDate: string;
    correctedCheckIn?: string;
    correctedCheckOut?: string;
    previousStatusAr?: string;
    reasonAr?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  approve: (id: string) => Promise<void>;
  reject: (id: string) => Promise<void>;
  cancel: (id: string, notes?: string) => Promise<void>;
}

export const useAttendanceCorrectionRequestsStore = create<State>()((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async (params) => {
    const companyId = useAuthStore.getState().activeCompanyId;
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await correctionRequestsApi.list({ companyId, limit: 200, ...params });
      set({ items: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  submit: async (input) => {
    const companyId = useAuthStore.getState().activeCompanyId ?? '';
    if (!input.employeeId.trim()) return { ok: false, error: 'اختر الموظف.' };
    if (!input.requestTypeId.trim()) return { ok: false, error: 'اختر نوع الطلب.' };
    if (!input.workDate.trim()) return { ok: false, error: 'أدخل تاريخ اليوم.' };
    try {
      const created = await correctionRequestsApi.create({
        companyId,
        employeeId: input.employeeId,
        requestTypeId: input.requestTypeId,
        workDate: input.workDate,
        previousStatus: input.previousStatusAr,
        correctedCheckInAt: dateTimeIso(input.workDate, input.correctedCheckIn ?? ''),
        correctedCheckOutAt: dateTimeIso(input.workDate, input.correctedCheckOut ?? ''),
        reasonAr: input.reasonAr,
      });
      set(s => ({ items: [mapApi(created), ...s.items] }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },

  approve: async (id) => {
    const userId = useAuthStore.getState().user?.id ?? '';
    const updated = await correctionRequestsApi.decide(id, {
      decision: 'approve',
      decidedByEmployeeId: userId,
    });
    set(s => ({ items: s.items.map(r => r.id === id ? mapApi(updated) : r) }));
  },

  reject: async (id) => {
    const userId = useAuthStore.getState().user?.id ?? '';
    const updated = await correctionRequestsApi.decide(id, {
      decision: 'reject',
      decidedByEmployeeId: userId,
    });
    set(s => ({ items: s.items.map(r => r.id === id ? mapApi(updated) : r) }));
  },

  cancel: async (id, notes) => {
    const updated = await correctionRequestsApi.cancel(id, { decisionNotesAr: notes });
    set(s => ({ items: s.items.map(r => r.id === id ? mapApi(updated) : r) }));
  },
}));

export function attendanceCorrectionStatusLabelAr(s: AttendanceCorrectionRequest['status']): string {
  if (s === 'pending') return 'قيد الموافقة';
  if (s === 'approved') return 'معتمد';
  if (s === 'cancelled') return 'ملغى';
  return 'مرفوض';
}
