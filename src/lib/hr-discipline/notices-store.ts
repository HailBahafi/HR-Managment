import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRDisciplineNoticeRecord } from './types';

function uid() { return `ntc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function now() { return new Date().toISOString(); }

interface NoticesState {
  notices: HRDisciplineNoticeRecord[];
  add: (d: Omit<HRDisciplineNoticeRecord,'id'|'createdAt'>) => void;
  remove: (id: string) => void;
}

export const useHRDisciplineNoticesStore = create<NoticesState>()(
  persist(
    (set) => ({
      notices: [],
      add: (d) => set(s => ({ notices: [...s.notices, { ...d, id:uid(), createdAt:now() }] })),
      remove: (id) => set(s => ({ notices: s.notices.filter(n => n.id !== id) })),
    }),
    { name:'hr_discipline_notices_v1', storage: createJSONStorage(() => localStorage), version:1 },
  ),
);
