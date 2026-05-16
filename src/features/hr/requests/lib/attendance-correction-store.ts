import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  AttendanceCorrectionRequest,
  AttendanceCorrectionRequestStatus,
} from '@/features/hr/requests/lib/attendance-correction-types';

function uid() {
  return `acr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

const SEED: AttendanceCorrectionRequest[] = [
  {
    id: 'acr-seed-1',
    employeeId: 'e2',
    employeeNameAr: 'ريم الشهراني',
    departmentId: 'd2',
    approverId: 'e1',
    approverNameAr: 'عبدالرحمن المالكي',
    workDate: '2026-04-28',
    previousCheckIn: '09:42',
    previousCheckOut: '17:58',
    correctedCheckIn: '09:00',
    correctedCheckOut: '18:00',
    previousStatusAr: 'تأخر وصول',
    status: 'pending',
    reasonAr: 'نسيان بصمة الدخول — التواجد في الاجتماع مع الإدارة.',
    createdAt: '2026-04-28T11:20:00.000Z',
  },
  {
    id: 'acr-seed-2',
    employeeId: 'e3',
    employeeNameAr: 'فهد العنزي',
    departmentId: 'd3',
    approverId: 'e1',
    approverNameAr: 'عبدالرحمن المالكي',
    workDate: '2026-04-25',
    previousCheckIn: '08:05',
    previousCheckOut: '14:00',
    correctedCheckIn: '08:05',
    correctedCheckOut: '17:30',
    previousStatusAr: 'انصراف مبكر',
    status: 'approved',
    reasonAr: 'الخروج للموقع الخارجي دون تسجيل خروج ثانٍ.',
    createdAt: '2026-04-25T09:00:00.000Z',
    decidedAt: '2026-04-25T14:10:00.000Z',
  },
];

interface State {
  items: AttendanceCorrectionRequest[];
  submit: (input: Omit<AttendanceCorrectionRequest, 'id' | 'status' | 'createdAt' | 'decidedAt'>) => { ok: true } | { ok: false; error: string };
  approve: (id: string) => void;
  reject: (id: string) => void;
}

export const useAttendanceCorrectionRequestsStore = create<State>()(
  persist(
    (set, get) => ({
      items: SEED,

      submit: (input) => {
        if (!input.employeeId.trim()) return { ok: false, error: 'اختر الموظف.' };
        if (!input.approverId.trim()) return { ok: false, error: 'اختر المعتمد.' };
        if (!input.workDate.trim()) return { ok: false, error: 'أدخل تاريخ اليوم.' };
        const rec: AttendanceCorrectionRequest = {
          ...input,
          id: uid(),
          status: 'pending',
          createdAt: nowIso(),
        };
        set((s) => ({ items: [rec, ...s.items] }));
        return { ok: true };
      },

      approve: (id) => {
        set((s) => ({
          items: s.items.map((r) =>
            r.id === id && r.status === 'pending'
              ? { ...r, status: 'approved' as const, decidedAt: nowIso() }
              : r,
          ),
        }));
      },

      reject: (id) => {
        set((s) => ({
          items: s.items.map((r) =>
            r.id === id && r.status === 'pending'
              ? { ...r, status: 'rejected' as const, decidedAt: nowIso() }
              : r,
          ),
        }));
      },
    }),
    {
      name: 'hr_attendance_correction_requests_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
      version: 1,
    },
  ),
);

export function attendanceCorrectionStatusLabelAr(s: AttendanceCorrectionRequestStatus): string {
  if (s === 'pending') return 'قيد الموافقة';
  if (s === 'approved') return 'معتمد';
  return 'مرفوض';
}
