import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { genId } from '@/lib/attendance/utils';
import type {
  RoseClearanceRecord,
  RoseEmployeeFormBucket,
  RoseExperienceRecord,
  RoseResignationRecord,
  RoseSettlementRecord,
} from './types';

const STORAGE_KEY = 'rose-hr-employee-rose-forms-v1';

function nowIso() {
  return new Date().toISOString();
}

/** Stable empty bucket for `getBucket` + setters’ `??` fallback (new object each time breaks React subscribe snapshot). */
const EMPTY_BUCKET: RoseEmployeeFormBucket = {
  resignations: [],
  clearances: [],
  settlements: [],
  experiences: [],
};

type State = {
  buckets: Record<string, RoseEmployeeFormBucket>;
  getBucket: (employeeId: string) => RoseEmployeeFormBucket;
  /** إجمالي عدد النماذج المحفوظة لموظف */
  totalCountFor: (employeeId: string) => number;

  addResignation: (employeeId: string, input: Omit<RoseResignationRecord, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) => string;
  updateResignation: (employeeId: string, id: string, patch: Partial<Omit<RoseResignationRecord, 'id' | 'employeeId' | 'createdAt'>>) => void;
  removeResignation: (employeeId: string, id: string) => void;

  addClearance: (employeeId: string, input: Omit<RoseClearanceRecord, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) => string;
  updateClearance: (employeeId: string, id: string, patch: Partial<Omit<RoseClearanceRecord, 'id' | 'employeeId' | 'createdAt'>>) => void;
  removeClearance: (employeeId: string, id: string) => void;

  addSettlement: (employeeId: string, input: Omit<RoseSettlementRecord, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) => string;
  updateSettlement: (employeeId: string, id: string, patch: Partial<Omit<RoseSettlementRecord, 'id' | 'employeeId' | 'createdAt'>>) => void;
  removeSettlement: (employeeId: string, id: string) => void;

  addExperience: (employeeId: string, input: Omit<RoseExperienceRecord, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) => string;
  updateExperience: (employeeId: string, id: string, patch: Partial<Omit<RoseExperienceRecord, 'id' | 'employeeId' | 'createdAt'>>) => void;
  removeExperience: (employeeId: string, id: string) => void;
};

export const useEmployeeRoseFormsStore = create<State>()(
  persist(
    (set, get) => ({
      buckets: {},

      getBucket: (employeeId) => get().buckets[employeeId] ?? EMPTY_BUCKET,

      totalCountFor: (employeeId) => {
        const b = get().buckets[employeeId];
        if (!b) return 0;
        return b.resignations.length + b.clearances.length + b.settlements.length + b.experiences.length;
      },

      addResignation: (employeeId, input) => {
        const id = genId('rose-res');
        const t = nowIso();
        const row: RoseResignationRecord = {
          ...input,
          id,
          employeeId,
          createdAt: t,
          updatedAt: t,
        };
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, resignations: [row, ...prev.resignations] },
            },
          };
        });
        return id;
      },
      updateResignation: (employeeId, id, patch) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: {
                ...prev,
                resignations: prev.resignations.map((r) =>
                  r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r,
                ),
              },
            },
          };
        });
      },
      removeResignation: (employeeId, id) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, resignations: prev.resignations.filter((r) => r.id !== id) },
            },
          };
        });
      },

      addClearance: (employeeId, input) => {
        const id = genId('rose-clr');
        const t = nowIso();
        const row: RoseClearanceRecord = { ...input, id, employeeId, createdAt: t, updatedAt: t };
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, clearances: [row, ...prev.clearances] },
            },
          };
        });
        return id;
      },
      updateClearance: (employeeId, id, patch) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: {
                ...prev,
                clearances: prev.clearances.map((r) =>
                  r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r,
                ),
              },
            },
          };
        });
      },
      removeClearance: (employeeId, id) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, clearances: prev.clearances.filter((r) => r.id !== id) },
            },
          };
        });
      },

      addSettlement: (employeeId, input) => {
        const id = genId('rose-set');
        const t = nowIso();
        const row: RoseSettlementRecord = { ...input, id, employeeId, createdAt: t, updatedAt: t };
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, settlements: [row, ...prev.settlements] },
            },
          };
        });
        return id;
      },
      updateSettlement: (employeeId, id, patch) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: {
                ...prev,
                settlements: prev.settlements.map((r) =>
                  r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r,
                ),
              },
            },
          };
        });
      },
      removeSettlement: (employeeId, id) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, settlements: prev.settlements.filter((r) => r.id !== id) },
            },
          };
        });
      },

      addExperience: (employeeId, input) => {
        const id = genId('rose-exp');
        const t = nowIso();
        const row: RoseExperienceRecord = { ...input, id, employeeId, createdAt: t, updatedAt: t };
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, experiences: [row, ...prev.experiences] },
            },
          };
        });
        return id;
      },
      updateExperience: (employeeId, id, patch) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: {
                ...prev,
                experiences: prev.experiences.map((r) =>
                  r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r,
                ),
              },
            },
          };
        });
      },
      removeExperience: (employeeId, id) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, experiences: prev.experiences.filter((r) => r.id !== id) },
            },
          };
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
