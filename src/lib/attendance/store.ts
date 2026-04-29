import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildInitialAttendanceState } from './seed-state';
import type {
  AssignmentTargetType,
  AttendanceCheckInPoint,
  AttendanceCheckInPointLink,
  AttendanceDaySummary,
  AttendanceEvent,
  ShiftAssignment,
  ShiftTemplate,
} from './types';
import { genId } from './utils';

const STORAGE_KEY = 'rose-hr-attendance-v2';

export type AssignmentBatchItem = {
  targetType: AssignmentTargetType;
  targetId: string;
  targetLabel: string;
};

type PersistedSlice = Pick<
  ReturnType<typeof buildInitialAttendanceState>,
  'shiftTemplates' | 'assignments' | 'events' | 'daySummaries' | 'checkpoints' | 'checkpointLinks'
>;

export type AttendanceStore = PersistedSlice & {
  resetToSeed: () => void;
  upsertTemplate: (t: ShiftTemplate) => void;
  removeTemplate: (id: string) => void;
  addAssignmentBatch: (args: {
    templateId: string;
    effectiveFrom: string;
    items: AssignmentBatchItem[];
    openShiftHours?: number;
  }) => void;
  removeAssignment: (id: string) => void;
  removeAssignmentBatch: (batchId: string) => void;
  addEvent: (e: Omit<AttendanceEvent, 'id'> & { id?: string }) => void;
  removeEvent: (id: string) => void;
  upsertDaySummary: (s: AttendanceDaySummary) => void;
  removeDaySummary: (id: string) => void;
  upsertCheckpoint: (c: AttendanceCheckInPoint) => void;
  removeCheckpoint: (id: string) => void;
  addCheckpointLinkBatch: (args: {
    effectiveFrom?: string;
    pairs: { employeeId: string; checkInPointId: string }[];
  }) => void;
  removeCheckpointLink: (id: string) => void;
  removeCheckpointLinkBatch: (batchId: string) => void;
};

const seed = (): PersistedSlice => buildInitialAttendanceState();

export const useAttendanceStore = create<AttendanceStore>()(
  persist(
    (set) => ({
      ...seed(),
      resetToSeed: () => set(seed()),

      upsertTemplate: (t) =>
        set((s) => ({
          shiftTemplates: s.shiftTemplates.some((x) => x.id === t.id)
            ? s.shiftTemplates.map((x) => (x.id === t.id ? t : x))
            : [...s.shiftTemplates, t],
        })),

      removeTemplate: (id) =>
        set((s) => ({
          shiftTemplates: s.shiftTemplates.filter((x) => x.id !== id),
          assignments: s.assignments.filter((a) => a.templateId !== id),
        })),

      addAssignmentBatch: ({ templateId, effectiveFrom, items, openShiftHours }) => {
        const batchId = genId('batch');
        const rows: ShiftAssignment[] = items.map((it) => ({
          id: genId('asg'),
          templateId,
          ...(openShiftHours !== undefined && { openShiftHours }),
          targetType: it.targetType,
          targetId: it.targetId,
          targetLabel: it.targetLabel,
          effectiveFrom,
          batchId,
        }));
        set((s) => ({ assignments: [...rows, ...s.assignments] }));
      },

      removeAssignment: (id) => set((s) => ({ assignments: s.assignments.filter((a) => a.id !== id) })),

      removeAssignmentBatch: (batchId) =>
        set((s) => ({ assignments: s.assignments.filter((a) => a.batchId !== batchId) })),

      addEvent: (e) =>
        set((s) => ({
          events: [{ ...e, id: e.id ?? genId('ev') } as AttendanceEvent, ...s.events],
        })),

      removeEvent: (id) => set((s) => ({ events: s.events.filter((x) => x.id !== id) })),

      upsertDaySummary: (summary) =>
        set((s) => ({
          daySummaries: s.daySummaries.some((x) => x.id === summary.id)
            ? s.daySummaries.map((x) => (x.id === summary.id ? summary : x))
            : [...s.daySummaries, summary],
        })),

      removeDaySummary: (id) => set((s) => ({ daySummaries: s.daySummaries.filter((x) => x.id !== id) })),

      upsertCheckpoint: (c) =>
        set((s) => ({
          checkpoints: s.checkpoints.some((x) => x.id === c.id)
            ? s.checkpoints.map((x) => (x.id === c.id ? c : x))
            : [...s.checkpoints, c],
        })),

      removeCheckpoint: (id) =>
        set((s) => ({
          checkpoints: s.checkpoints.filter((x) => x.id !== id),
          checkpointLinks: s.checkpointLinks.filter((l) => l.checkInPointId !== id),
        })),

      addCheckpointLinkBatch: ({ effectiveFrom, pairs }) => {
        const batchId = genId('batch');
        const rows: AttendanceCheckInPointLink[] = pairs.map((p) => ({
          id: genId('lnk'),
          employeeId: p.employeeId,
          checkInPointId: p.checkInPointId,
          batchId,
          effectiveFrom,
          linkActive: true,
        }));
        set((s) => ({ checkpointLinks: [...rows, ...s.checkpointLinks] }));
      },

      removeCheckpointLink: (id) => set((s) => ({ checkpointLinks: s.checkpointLinks.filter((l) => l.id !== id) })),

      removeCheckpointLinkBatch: (batchId) =>
        set((s) => ({ checkpointLinks: s.checkpointLinks.filter((l) => l.batchId !== batchId) })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        shiftTemplates: s.shiftTemplates,
        assignments: s.assignments,
        events: s.events,
        daySummaries: s.daySummaries,
        checkpoints: s.checkpoints,
        checkpointLinks: s.checkpointLinks,
      }),
    },
  ),
);
