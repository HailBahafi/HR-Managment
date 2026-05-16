import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MOCK_APP_SESSION } from '@/shared/app-session';
import type { HRDisciplineAppealRecord } from './types';
import { APPEAL_STATUS_LABELS } from './types';
import { summarizeAppeal } from './discipline-audit-log';
import { appendDisciplineAuditLog } from './discipline-audit-log-store';

function uid() { return `apl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function now() { return new Date().toISOString(); }

const SEED: HRDisciplineAppealRecord[] = [
  {
    id:'apl-1', caseId:'case-2', caseNumber:'VIO-2026-0002',
    employeeId:'e2', employeeNameAr:'فاطمة علي',
    date:'2026-02-10', channel:'hr', status:'in_review',
    grounds:'كانت غائبة لظروف طارئة عائلية ولم تتمكن من الإبلاغ', responseNote:'',
    createdAt:'2026-02-10T00:00:00Z', updatedAt:'2026-02-10T00:00:00Z',
  },
  {
    id:'apl-2', caseId:'case-1', caseNumber:'VIO-2026-0001',
    employeeId:'e1', employeeNameAr:'أحمد محمد',
    date:'2026-01-15', channel:'manager', status:'rejected',
    grounds:'كان التأخير بسبب عطل في المواصلات', responseNote:'لا تُقبل الأعذار بدون وثائق رسمية',
    createdAt:'2026-01-15T00:00:00Z', updatedAt:'2026-01-20T00:00:00Z',
  },
];

interface AppealsState {
  appeals: HRDisciplineAppealRecord[];
  add: (d: Omit<HRDisciplineAppealRecord,'id'|'createdAt'|'updatedAt'>) => void;
  update: (id: string, patch: Partial<HRDisciplineAppealRecord>) => void;
  remove: (id: string) => void;
}

export const useHRDisciplineAppealsStore = create<AppealsState>()(
  persist(
    (set, get) => ({
      appeals: SEED,
      add: (d) => {
        const rec: HRDisciplineAppealRecord = { ...d, id: uid(), createdAt: now(), updatedAt: now() };
        set(s => ({ appeals: [...s.appeals, rec] }));
        appendDisciplineAuditLog({
          actorNameAr: MOCK_APP_SESSION.employeeNameAr,
          category: 'appeal',
          actionType: 'create',
          recordId: rec.id,
          recordRefAr: rec.caseNumber,
          recordStatusAfterAr: APPEAL_STATUS_LABELS[rec.status],
          previousSnapshotAr: '—',
          currentSnapshotAr: summarizeAppeal(rec),
        });
      },
      update: (id, patch) => {
        const prev = get().appeals.find(a => a.id === id);
        if (!prev) return;
        const merged: HRDisciplineAppealRecord = { ...prev, ...patch, updatedAt: now() };
        set(s => ({ appeals: s.appeals.map(a => a.id === id ? merged : a) }));
        appendDisciplineAuditLog({
          actorNameAr: MOCK_APP_SESSION.employeeNameAr,
          category: 'appeal',
          actionType: 'update',
          recordId: id,
          recordRefAr: merged.caseNumber,
          recordStatusAfterAr: APPEAL_STATUS_LABELS[merged.status],
          previousSnapshotAr: summarizeAppeal(prev),
          currentSnapshotAr: summarizeAppeal(merged),
        });
      },
      remove: (id) => {
        const prev = get().appeals.find(a => a.id === id);
        set(s => ({ appeals: s.appeals.filter(a => a.id !== id) }));
        if (prev) {
          appendDisciplineAuditLog({
            actorNameAr: MOCK_APP_SESSION.employeeNameAr,
            category: 'appeal',
            actionType: 'delete',
            recordId: id,
            recordRefAr: prev.caseNumber,
            recordStatusAfterAr: 'محذوف',
            previousSnapshotAr: summarizeAppeal(prev),
            currentSnapshotAr: '—',
          });
        }
      },
    }),
    { name:'hr_discipline_appeals_v1', storage: createJSONStorage(() => localStorage), version:1 },
  ),
);
