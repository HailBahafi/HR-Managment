import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRDisciplineAuditLogEntry } from './discipline-audit-log';

function uid() {
  return `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const SEED: HRDisciplineAuditLogEntry[] = [
  {
    id: 'aud-seed-1',
    occurredAt: '2026-04-28T14:30:00.000Z',
    actorNameAr: 'سارة القحطاني',
    category: 'violation_case',
    actionType: 'submit',
    recordId: 'case-e1-r15',
    recordRefAr: 'VIO-2026-0315',
    recordStatusAfterAr: 'قيد الاعتماد',
    previousSnapshotAr: 'رقم القضية: VIO-2026-0315\nالحالة: مسودة',
    currentSnapshotAr:
      'رقم القضية: VIO-2026-0315\nالموظف: عبدالرحمن المالكي\nالحالة: قيد الاعتماد — تم التقديم للموافقات',
  },
  {
    id: 'aud-seed-2',
    occurredAt: '2026-04-27T09:15:00.000Z',
    actorNameAr: 'محمد الزهراني',
    category: 'investigation',
    actionType: 'update',
    recordId: 'inv-6',
    recordRefAr: 'VIO-2026-0018',
    recordStatusAfterAr: 'طلب تحقيق محدّث',
    previousSnapshotAr: 'النتيجة: ثبتت المخالفة\nالتوصية: توجيه إنذار رسمي مع خصم 300 ريال.',
    currentSnapshotAr:
      'النتيجة: توجيه إنذار\nالتوصية: توجيه إنذار رسمي مع خصم 300 ريال — مراجعة صياغة التوصية.',
  },
  {
    id: 'aud-seed-3',
    occurredAt: '2026-04-10T11:00:00.000Z',
    actorNameAr: 'خالد العتيبي',
    category: 'appeal',
    actionType: 'create',
    recordId: 'apl-demo',
    recordRefAr: 'VIO-2026-0003',
    recordStatusAfterAr: 'مُقدَّم',
    previousSnapshotAr: '—',
    currentSnapshotAr:
      'رقم القضية: VIO-2026-0003\nالقناة: الموارد البشرية\nالحالة: مُقدَّم\nأسباب التظلم: طلب مراجعة قرار الخصم.',
  },
  {
    id: 'aud-seed-4',
    occurredAt: '2026-04-09T16:45:00.000Z',
    actorNameAr: 'عبدالرحمن المالكي',
    category: 'violation_case',
    actionType: 'payroll_posted',
    recordId: 'case-1',
    recordRefAr: 'VIO-2026-0001',
    recordStatusAfterAr: 'مُدرَج في الرواتب',
    previousSnapshotAr: 'حالة السجل: معتمد — لم يُدرَج بعد في الرواتب',
    currentSnapshotAr: 'حالة السجل: معتمد — تم الإشارة إلى الإدراج في الرواتب',
  },
];

interface AuditLogState {
  entries: HRDisciplineAuditLogEntry[];
  append: (payload: Omit<HRDisciplineAuditLogEntry, 'id' | 'occurredAt'>) => void;
}

export const useHRDisciplineAuditLogStore = create<AuditLogState>()(
  persist(
    (set) => ({
      entries: SEED,
      append: (payload) =>
        set((s) => ({
          entries: [
            {
              ...payload,
              id: uid(),
              occurredAt: new Date().toISOString(),
            },
            ...s.entries,
          ],
        })),
    }),
    {
      name: 'hr_discipline_audit_log_v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/** تسجيل حدث من خارج المكوّنات (مخازن zustand) */
export function appendDisciplineAuditLog(payload: Omit<HRDisciplineAuditLogEntry, 'id' | 'occurredAt'>): void {
  useHRDisciplineAuditLogStore.getState().append(payload);
}
