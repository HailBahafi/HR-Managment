import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MOCK_APP_SESSION } from '@/lib/app-session';
import type { HRDisciplineInvestigationRecord } from './types';
import { INVESTIGATION_RESULT_LABELS } from './types';
import { summarizeInvestigation } from './discipline-audit-log';
import { appendDisciplineAuditLog } from './discipline-audit-log-store';

const SEED: HRDisciplineInvestigationRecord[] = [
  {
    id:'inv-1', caseId:'case-3', caseNumber:'VIO-2026-0003',
    employeeId:'e3', employeeNameAr:'فهد العنزي',
    investigatorName:'محمد الزهراني', date:'2026-03-05',
    employeeStatement:'أنكر المخالفة وقال إن النقاش كان في سياق مهني معتاد.',
    witnessStatement:'شهد ثلاثة زملاء بوقوع الحادثة وأكدوا مضمون الشتائم وحدة.',
    result:'upheld', recommendation:'توجيه إنذار رسمي أول مع خصم يوم من الراتب.',
    createdAt:'2026-03-05T10:00:00Z', updatedAt:'2026-03-07T12:00:00Z',
  },
  {
    id:'inv-2', caseId:'case-5', caseNumber:'VIO-2026-0005',
    employeeId:'e4', employeeNameAr:'لينا الحربي',
    investigatorName:'سارة القحطاني', date:'2026-03-12',
    employeeStatement:'أقرت باستخدام الهاتف لكنها نفت إفشاء معلومات سرية وقالت إن الحديث كان عامًا.',
    witnessStatement:'مدير قسم IT أكد سماعه لتفاصيل سرية خلال الاجتماع.',
    result:'upheld', recommendation:'خصم 500 ريال وإنذار خطي مع تقييد صلاحية الوصول.',
    createdAt:'2026-03-12T11:00:00Z', updatedAt:'2026-03-14T09:00:00Z',
  },
  {
    id:'inv-3', caseId:'case-6', caseNumber:'VIO-2026-0006',
    employeeId:'e5', employeeNameAr:'سلطان الدوسري',
    investigatorName:'خالد العتيبي', date:'2026-03-17',
    employeeStatement:'ادعى أن البيانات كانت صحيحة وقت الكتابة لكن أجري تعديلات بعد ذلك.',
    witnessStatement:'التدقيق المحاسبي أكد وجود فجوة بين البيانات المقدمة والواقع.',
    result:'upheld', recommendation:'خصم يومين من الراتب وتحذير خطي رسمي.',
    createdAt:'2026-03-17T09:00:00Z', updatedAt:'2026-03-19T11:00:00Z',
  },
  {
    id:'inv-4', caseId:'case-9', caseNumber:'VIO-2026-0009',
    employeeId:'e3', employeeNameAr:'فهد العنزي',
    investigatorName:'محمد الزهراني', date:'2026-03-25',
    employeeStatement:'أكد رفضه للتعليمات قائلاً إنها كانت غير مختصة بمهامه الوظيفية.',
    witnessStatement:'شهدتان تأكدان صدور التعليمات بشكل صريح ورفضها علناً.',
    result:'upheld', recommendation:'إنذار نهائي مع توصية بخصم ثلاثة أيام.',
    createdAt:'2026-03-25T08:00:00Z', updatedAt:'2026-03-27T10:00:00Z',
  },
  {
    id:'inv-5', caseId:'case-10', caseNumber:'VIO-2026-0010',
    employeeId:'e5', employeeNameAr:'سلطان الدوسري',
    investigatorName:'خالد العتيبي', date:'2026-03-27',
    employeeStatement:'ادعى أن استخدام الوسائل كان ضمن نطاق العمل المسموح به.',
    witnessStatement:'سجلات الشبكة تثبت تصفحًا مستمرًا لمواقع غير متعلقة بالعمل.',
    result:'upheld', recommendation:'غرامة 1000 ريال وتقييد وصول الإنترنت.',
    createdAt:'2026-03-27T09:00:00Z', updatedAt:'2026-03-29T11:00:00Z',
  },
  {
    id:'inv-6', caseId:'case-18', caseNumber:'VIO-2026-0018',
    employeeId:'e6', employeeNameAr:'هدى العمري',
    investigatorName:'سارة القحطاني', date:'2026-04-11',
    employeeStatement:'أقرت بحدوث نقاش لكنها نفت استخدام ألفاظ غير لائقة.',
    witnessStatement:'شهد مدير المشاريع تصاعد النقاش وسمع ألفاظًا غير لائقة أمام عملاء.',
    result:'to_warning', recommendation:'توجيه إنذار رسمي مع خصم 300 ريال.',
    createdAt:'2026-04-11T10:00:00Z', updatedAt:'2026-04-13T09:00:00Z',
  },
  {
    id:'inv-7', caseId:'case-19', caseNumber:'VIO-2026-0019',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي',
    investigatorName:'محمد الزهراني', date:'2026-04-12',
    employeeStatement:'أكد أن التواصل مع المورد كان لاستيضاح بعض التفاصيل التقنية فقط.',
    witnessStatement:'رسائل البريد الإلكتروني تثبت تفاوضًا صريحًا حول الأسعار والشروط.',
    result:'upheld', recommendation:'خصم 1500 ريال وإنذار نهائي.',
    createdAt:'2026-04-12T08:00:00Z', updatedAt:'2026-04-14T10:00:00Z',
  },
  {
    id:'inv-8', caseId:'case-21', caseNumber:'VIO-2026-0021',
    employeeId:'e3', employeeNameAr:'فهد العنزي',
    investigatorName:'خالد العتيبي', date:'2026-04-06',
    employeeStatement:'أنكر التعمد وقال إن الدخول كان بسبب خطأ في بيانات التسجيل وليس قصدًا.',
    witnessStatement:'سجل الدخول يبين طلبات متعددة لملفات موظفين آخرين بشكل مقصود.',
    result:'upheld', recommendation:'خصم 700 ريال وتقييد صلاحيات النظام.',
    createdAt:'2026-04-06T11:00:00Z', updatedAt:'2026-04-08T13:00:00Z',
  },
];

function uid() { return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function now() { return new Date().toISOString(); }

interface InvestigationsState {
  investigations: HRDisciplineInvestigationRecord[];
  add: (d: Omit<HRDisciplineInvestigationRecord,'id'|'createdAt'|'updatedAt'>) => void;
  update: (id: string, patch: Partial<HRDisciplineInvestigationRecord>) => void;
  remove: (id: string) => void;
}

export const useHRDisciplineInvestigationsStore = create<InvestigationsState>()(
  persist(
    (set, get) => ({
      investigations: SEED,
      add: (d) => {
        const rec: HRDisciplineInvestigationRecord = { ...d, id: uid(), createdAt: now(), updatedAt: now() };
        set(s => ({ investigations: [...s.investigations, rec] }));
        appendDisciplineAuditLog({
          actorNameAr: MOCK_APP_SESSION.employeeNameAr,
          category: 'investigation',
          actionType: 'create',
          recordId: rec.id,
          recordRefAr: rec.caseNumber,
          recordStatusAfterAr: INVESTIGATION_RESULT_LABELS[rec.result],
          previousSnapshotAr: '—',
          currentSnapshotAr: summarizeInvestigation(rec),
        });
      },
      update: (id, patch) => {
        const prev = get().investigations.find(i => i.id === id);
        if (!prev) return;
        const merged: HRDisciplineInvestigationRecord = { ...prev, ...patch, updatedAt: now() };
        set(s => ({ investigations: s.investigations.map(i => i.id === id ? merged : i) }));
        appendDisciplineAuditLog({
          actorNameAr: MOCK_APP_SESSION.employeeNameAr,
          category: 'investigation',
          actionType: 'update',
          recordId: id,
          recordRefAr: merged.caseNumber,
          recordStatusAfterAr: INVESTIGATION_RESULT_LABELS[merged.result],
          previousSnapshotAr: summarizeInvestigation(prev),
          currentSnapshotAr: summarizeInvestigation(merged),
        });
      },
      remove: (id) => {
        const prev = get().investigations.find(i => i.id === id);
        set(s => ({ investigations: s.investigations.filter(i => i.id !== id) }));
        if (prev) {
          appendDisciplineAuditLog({
            actorNameAr: MOCK_APP_SESSION.employeeNameAr,
            category: 'investigation',
            actionType: 'delete',
            recordId: id,
            recordRefAr: prev.caseNumber,
            recordStatusAfterAr: 'محذوف',
            previousSnapshotAr: summarizeInvestigation(prev),
            currentSnapshotAr: '—',
          });
        }
      },
    }),
    { name:'hr_discipline_investigations_v1', storage: createJSONStorage(() => localStorage), version:2, migrate: () => ({ investigations: SEED }) },
  ),
);
