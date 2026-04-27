import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRDisciplineNoticeRecord } from './types';

const SEED: HRDisciplineNoticeRecord[] = [
  { id:'ntc-1', employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', kind:'verbal',  reasonAr:'تأخر متكرر عن الدوام الرسمي لأكثر من ثلاثة أيام',          date:'2026-01-15', linkedCaseId:'case-1',  attachmentsNote:'',                    createdAt:'2026-01-15T09:00:00Z' },
  { id:'ntc-2', employeeId:'e2', employeeNameAr:'ريم الشهراني',      kind:'first',   reasonAr:'غياب يوم كامل بدون إذن مسبق أو تقديم عذر',                 date:'2026-03-06', linkedCaseId:'case-4',  attachmentsNote:'',                    createdAt:'2026-03-06T10:00:00Z' },
  { id:'ntc-3', employeeId:'e3', employeeNameAr:'فهد العنزي',         kind:'first',   reasonAr:'سوء سلوك مع زميل في العمل وشتائم لفظية',                   date:'2026-03-02', linkedCaseId:'case-3',  attachmentsNote:'تقرير الشهود',        createdAt:'2026-03-02T10:00:00Z' },
  { id:'ntc-4', employeeId:'e4', employeeNameAr:'لينا الحربي',        kind:'verbal',  reasonAr:'إفشاء معلومات سرية للعميل عبر الهاتف الشخصي',              date:'2026-03-11', linkedCaseId:'case-5',  attachmentsNote:'لقطة شاشة',          createdAt:'2026-03-11T09:00:00Z' },
  { id:'ntc-5', employeeId:'e5', employeeNameAr:'سلطان الدوسري',      kind:'second',  reasonAr:'تقديم تقرير يحتوي بيانات مضللة للإدارة',                   date:'2026-03-16', linkedCaseId:'case-6',  attachmentsNote:'نسخة التقرير',       createdAt:'2026-03-16T09:00:00Z' },
  { id:'ntc-6', employeeId:'e6', employeeNameAr:'هدى العمري',         kind:'verbal',  reasonAr:'غياب بدون إذن وعدم الرد على محاولات التواصل',              date:'2026-02-04', linkedCaseId:'case-2',  attachmentsNote:'',                    createdAt:'2026-02-04T08:30:00Z' },
  { id:'ntc-7', employeeId:'e7', employeeNameAr:'يوسف الزهراني',      kind:'first',   reasonAr:'الانصراف المبكر عن العمل مرتين خلال أسبوعين',             date:'2026-03-19', linkedCaseId:'case-7',  attachmentsNote:'سجل بصمة مرفق',     createdAt:'2026-03-19T09:30:00Z' },
  { id:'ntc-8', employeeId:'e8', employeeNameAr:'مها السبيعي',        kind:'first',   reasonAr:'تكرار التأخر عن الدوام ست مرات في شهر مارس',               date:'2026-03-22', linkedCaseId:'case-8',  attachmentsNote:'',                    createdAt:'2026-03-22T08:00:00Z' },
  { id:'ntc-9', employeeId:'e3', employeeNameAr:'فهد العنزي',         kind:'final',   reasonAr:'رفض تنفيذ تعليمات مباشرة من المدير وتجاهل صريح',          date:'2026-03-24', linkedCaseId:'case-9',  attachmentsNote:'المحضر الرسمي',      createdAt:'2026-03-24T11:00:00Z' },
  { id:'ntc-10',employeeId:'e5', employeeNameAr:'سلطان الدوسري',      kind:'second',  reasonAr:'إساءة استخدام ممتلكات الشركة لأغراض شخصية',               date:'2026-03-28', linkedCaseId:'case-10', attachmentsNote:'سجلات الشبكة',      createdAt:'2026-03-28T10:00:00Z' },
];

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
      notices: SEED,
      add: (d) => set(s => ({ notices: [...s.notices, { ...d, id:uid(), createdAt:now() }] })),
      remove: (id) => set(s => ({ notices: s.notices.filter(n => n.id !== id) })),
    }),
    { name:'hr_discipline_notices_v1', storage: createJSONStorage(() => localStorage), version:2, migrate: () => ({ notices: SEED }) },
  ),
);
