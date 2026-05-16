import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRDisciplineCircularRecord } from './types';
import { data } from '@/features/hr/lib/data';

const SEED: HRDisciplineCircularRecord[] = [
  {
    id: 'crc-1',
    date: '2026-03-01',
    titleAr: 'سياسة الحضور خلال شهر رمضان',
    bodyAr: 'تعميم إلى جميع الموظفين: يُرجى الالتزام بأوقات الدوام المعتمدة خلال شهر رمضان المبارك، مع مراعاة التنسيق مع المدير المباشر لأي استثناءات.',
    audience: 'all',
    targetEmployeeIds: [],
    branchIds: [],
    branchNamesArSnapshot: '',
    departmentIds: [],
    departmentNamesArSnapshot: '',
    audienceSummaryAr: 'جميع الموظفين',
    sentAt: '2026-03-01T08:05:00Z',
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'crc-2',
    date: '2026-03-10',
    titleAr: 'تعميم خاص بفرعي الرياض وجدة',
    bodyAr: 'إلى جميع موظفي الفرعين: سيتم صيانة أنظمة الطاقة يوم الخميس القادم. يُرجى إغلاق الأجهزة قبل المغادرة.',
    audience: 'branch',
    targetEmployeeIds: [],
    branchIds: ['b1', 'b2'],
    branchNamesArSnapshot: 'المقر الرئيسي - الرياض، فرع جدة',
    departmentIds: [],
    departmentNamesArSnapshot: '',
    audienceSummaryAr: 'فروع (2): المقر الرئيسي - الرياض، فرع جدة',
    sentAt: null,
    createdAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 'crc-3',
    date: '2026-03-18',
    titleAr: 'تدريب إلزامي — تقنية المعلومات والمالية',
    bodyAr: 'جلسة توعية أمنية إلزامية لمنسوبي الأقسام المحددة يوم الأحد القادم الساعة العاشرة صباحاً.',
    audience: 'department',
    targetEmployeeIds: [],
    branchIds: [],
    branchNamesArSnapshot: '',
    departmentIds: ['d2', 'd3'],
    departmentNamesArSnapshot: 'تقنية المعلومات، المالية والمحاسبة',
    audienceSummaryAr: 'أقسام (2): تقنية المعلومات، المالية والمحاسبة',
    sentAt: '2026-03-18T10:35:00Z',
    createdAt: '2026-03-18T10:30:00Z',
  },
  {
    id: 'crc-4',
    date: '2026-04-02',
    titleAr: 'متابعة شخصية — ثلاثة موظفين',
    bodyAr: 'مرفق تنويه خاص للموظفين المعنيين بخصوص استكمال مستندات الترقية المعلقة. يُرجى مراجعة الموارد البشرية خلال أسبوع.',
    audience: 'employees',
    targetEmployeeIds: ['e1', 'e2', 'e3'],
    branchIds: [],
    branchNamesArSnapshot: '',
    departmentIds: [],
    departmentNamesArSnapshot: '',
    audienceSummaryAr: '3 موظفين محددين',
    sentAt: null,
    createdAt: '2026-04-02T11:00:00Z',
  },
];

function uid() {
  return `crc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function now() {
  return new Date().toISOString();
}

/** ترقية السجل القديم (فرع/قسم واحد) إلى مصفوفات */
function normalizeCircular(c: unknown): HRDisciplineCircularRecord {
  const x = c as Record<string, unknown>;
  const legacyBranch = x.branchId as string | null | undefined;
  const legacyDept = x.departmentId as string | null | undefined;
  let branchIds = Array.isArray(x.branchIds) ? (x.branchIds as string[]) : legacyBranch ? [legacyBranch] : [];
  let departmentIds = Array.isArray(x.departmentIds) ? (x.departmentIds as string[]) : legacyDept ? [legacyDept] : [];
  let branchNamesArSnapshot = typeof x.branchNamesArSnapshot === 'string' ? x.branchNamesArSnapshot : '';
  let departmentNamesArSnapshot = typeof x.departmentNamesArSnapshot === 'string' ? x.departmentNamesArSnapshot : '';
  if (!branchNamesArSnapshot && branchIds.length > 0) {
    branchNamesArSnapshot = branchIds
      .map((id) => data.branches.find((b) => b.id === id)?.name ?? id)
      .join('، ');
  }
  if (!departmentNamesArSnapshot && departmentIds.length > 0) {
    departmentNamesArSnapshot = departmentIds
      .map((id) => data.departments.find((d) => d.id === id)?.name ?? id)
      .join('، ');
  }
  const {
    id, date, titleAr, bodyAr, audience, targetEmployeeIds, audienceSummaryAr, createdAt, sentAt,
  } = x;
  const created = String(createdAt ?? now());
  const sent: string | null =
    typeof sentAt === 'string' && sentAt.trim() !== '' ? String(sentAt) : null;
  return {
    id: String(id),
    date: String(date),
    titleAr: String(titleAr ?? ''),
    bodyAr: String(bodyAr ?? ''),
    audience: audience as HRDisciplineCircularRecord['audience'],
    targetEmployeeIds: Array.isArray(targetEmployeeIds) ? (targetEmployeeIds as string[]) : [],
    branchIds,
    branchNamesArSnapshot,
    departmentIds,
    departmentNamesArSnapshot,
    audienceSummaryAr: String(audienceSummaryAr ?? ''),
    sentAt: sent,
    createdAt: created,
  };
}

interface CircularsState {
  circulars: HRDisciplineCircularRecord[];
  add: (d: Omit<HRDisciplineCircularRecord, 'id' | 'createdAt'>) => void;
  remove: (id: string) => void;
  markSent: (id: string) => void;
}

export const useHRDisciplineCircularsStore = create<CircularsState>()(
  persist(
    (set) => ({
      circulars: SEED,
      add: (d) =>
        set((s) => ({
          circulars: [...s.circulars, { ...d, id: uid(), createdAt: now() }],
        })),
      remove: (id) => set((s) => ({ circulars: s.circulars.filter((c) => c.id !== id) })),
      markSent: (id) =>
        set((s) => ({
          circulars: s.circulars.map((c) => (c.id === id ? { ...c, sentAt: now() } : c)),
        })),
    }),
    {
      name: 'hr_discipline_circulars_v1',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persisted: unknown, fromVersion: number) => {
        const p = persisted as { circulars?: unknown[] } | undefined;
        const list = Array.isArray(p?.circulars) ? p.circulars : [];
        const mapped = list.map((c) => normalizeCircular(c));
        /** ترقية من v2: لم يكن الحقل موجوداً — نفترض أن التعميمات السابقة كانت قد أُرسلت */
        if (fromVersion < 3) {
          return {
            circulars: mapped.map((row, i) => {
              const raw = list[i] as Record<string, unknown> | undefined;
              if (raw && 'sentAt' in raw && raw.sentAt === null) return row;
              if (typeof raw?.sentAt === 'string' && raw.sentAt.trim() !== '') return row;
              return { ...row, sentAt: row.sentAt ?? row.createdAt };
            }),
          };
        }
        return { circulars: mapped };
      },
    },
  ),
);
