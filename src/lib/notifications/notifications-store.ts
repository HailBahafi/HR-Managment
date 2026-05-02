import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface HRNotificationRecord {
  id: string;
  titleAr: string;
  bodyAr?: string;
  recipientEmployeeId: string;
  createdAt: string;
  readAt: string | null;
  /** إخفاء من القائمة المنبثقة ومن صندوق المستخدم — السجل يبقى للمسؤول */
  dismissedAt: string | null;
}

function now() {
  return new Date().toISOString();
}

/** بيانات افتراضية للعرض التجريبي — كلها ظاهرة في الصندوق حتى يخفيها المستخدم يدوياً */
const SEED: HRNotificationRecord[] = [
  {
    id: 'n-seed-1',
    titleAr: 'طلب إجازة يحتاج اعتمادك',
    bodyAr: 'موظف من قسمك قدّم طلب إجازة سنوية.',
    recipientEmployeeId: 'e1',
    createdAt: '2026-04-28T09:00:00Z',
    readAt: null,
    dismissedAt: null,
  },
  {
    id: 'n-seed-2',
    titleAr: 'تذكير: اجتماع لجنة الانضباط',
    bodyAr: 'غداً الساعة 10:00 صباحاً في قاعة الشؤون الإدارية.',
    recipientEmployeeId: 'e1',
    createdAt: '2026-04-27T14:30:00Z',
    readAt: '2026-04-27T15:00:00Z',
    dismissedAt: null,
  },
  {
    id: 'n-seed-3',
    titleAr: 'تم اعتماد كشف راتب أبريل',
    bodyAr: 'يمكنك الاطلاع على التفاصيل من قسم الرواتب.',
    recipientEmployeeId: 'e1',
    createdAt: '2026-04-26T08:00:00Z',
    readAt: null,
    dismissedAt: null,
  },
  {
    id: 'n-seed-4',
    titleAr: 'مخالفة مسجلة تحتاج مراجعتك',
    bodyAr: 'سجل انضباط جديد مرتبط بموظف في فريقك.',
    recipientEmployeeId: 'e2',
    createdAt: '2026-04-25T11:20:00Z',
    readAt: null,
    dismissedAt: null,
  },
  {
    id: 'n-seed-5',
    titleAr: 'انتهاء عقد تجريبي لموظف',
    bodyAr: 'يرجى مراجعة قائمة العقود وتحديث الحالة.',
    recipientEmployeeId: 'e3',
    createdAt: '2026-04-24T09:45:00Z',
    readAt: '2026-04-24T10:00:00Z',
    dismissedAt: null,
  },
  {
    id: 'n-seed-6',
    titleAr: 'طلب انتداب في انتظار الموافقة',
    recipientEmployeeId: 'e4',
    createdAt: '2026-04-23T07:15:00Z',
    readAt: null,
    dismissedAt: null,
  },
  {
    id: 'n-seed-7',
    titleAr: 'تحديث سياسة الحضور والانصراف',
    bodyAr: 'تم نشر التعميم رقم 2026/04 على البوابة الداخلية.',
    recipientEmployeeId: 'e5',
    createdAt: '2026-04-22T16:00:00Z',
    readAt: null,
    dismissedAt: null,
  },
  {
    id: 'n-seed-8',
    titleAr: 'موعد مقابلة شخصية — مرشح جديد',
    bodyAr: 'الأربعاء 11:00 صباحاً، قسم الموارد البشرية.',
    recipientEmployeeId: 'e1',
    createdAt: '2026-04-21T13:20:00Z',
    readAt: '2026-04-21T14:00:00Z',
    dismissedAt: null,
  },
  {
    id: 'n-seed-9',
    titleAr: 'تذكير: إغلاق نافذة تقييم الأداء',
    bodyAr: 'آخر موعد لتسليم النماذج نهاية الأسبوع.',
    recipientEmployeeId: 'e6',
    createdAt: '2026-04-10T08:30:00Z',
    readAt: null,
    dismissedAt: null,
  },
  {
    id: 'n-seed-10',
    titleAr: 'صرف مستحقات نهاية الخدمة — مراجعة',
    recipientEmployeeId: 'e2',
    createdAt: '2026-04-05T10:00:00Z',
    readAt: null,
    dismissedAt: null,
  },
  {
    id: 'n-seed-11',
    titleAr: 'ورشة عمل الأمن السيبراني',
    bodyAr: 'إلزامية لجميع منسوبي تقنية المعلومات.',
    recipientEmployeeId: 'e7',
    createdAt: '2026-03-30T09:00:00Z',
    readAt: '2026-03-30T09:30:00Z',
    dismissedAt: null,
  },
  {
    id: 'n-seed-12',
    titleAr: 'استلام مستندات التأمينات الاجتماعية',
    bodyAr: 'يرجى التأكد من اكتمال البيانات قبل نهاية الشهر.',
    recipientEmployeeId: 'e8',
    createdAt: '2026-03-18T11:45:00Z',
    readAt: null,
    dismissedAt: null,
  },
  {
    id: 'n-seed-13',
    titleAr: 'تجديد رخصة عمل وشيك الاستحقاق',
    recipientEmployeeId: 'e3',
    createdAt: '2026-03-12T08:00:00Z',
    readAt: null,
    dismissedAt: null,
  },
  {
    id: 'n-seed-14',
    titleAr: 'إشعار صيانة نظام الرواتب',
    bodyAr: 'النظام غير متاح يوم الجمعة من 22:00 إلى 02:00.',
    recipientEmployeeId: 'e1',
    createdAt: '2026-03-08T07:00:00Z',
    readAt: '2026-03-08T07:05:00Z',
    dismissedAt: null,
  },
];

interface NotificationsState {
  items: HRNotificationRecord[];
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  markAllReadForRecipient: (employeeId: string) => void;
  dismissFromInbox: (id: string) => void;
  dismissAllVisibleForRecipient: (employeeId: string) => void;
}

export const useHRNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      items: SEED,

      markRead: (id) =>
        set((s) => ({
          items: s.items.map((x) => (x.id === id ? { ...x, readAt: x.readAt ?? now() } : x)),
        })),

      markUnread: (id) =>
        set((s) => ({
          items: s.items.map((x) => (x.id === id ? { ...x, readAt: null } : x)),
        })),

      markAllReadForRecipient: (employeeId) =>
        set((s) => ({
          items: s.items.map((x) =>
            x.recipientEmployeeId === employeeId && !x.dismissedAt && !x.readAt
              ? { ...x, readAt: now() }
              : x,
          ),
        })),

      dismissFromInbox: (id) =>
        set((s) => ({
          items: s.items.map((x) => (x.id === id ? { ...x, dismissedAt: x.dismissedAt ?? now() } : x)),
        })),

      dismissAllVisibleForRecipient: (employeeId) =>
        set((s) => ({
          items: s.items.map((x) =>
            x.recipientEmployeeId === employeeId && !x.dismissedAt ? { ...x, dismissedAt: now() } : x,
          ),
        })),
    }),
    {
      name: 'hr_notifications_v1',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted: unknown, fromVersion: number) => {
        if (fromVersion < 2) {
          return { items: SEED.map((x) => ({ ...x })) };
        }
        const p = persisted as { items?: HRNotificationRecord[] };
        return { items: Array.isArray(p?.items) ? p.items : SEED.map((x) => ({ ...x })) };
      },
    },
  ),
);

export function selectInboxForRecipient(items: HRNotificationRecord[], employeeId: string) {
  return items
    .filter((x) => x.recipientEmployeeId === employeeId && !x.dismissedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function countUnreadInbox(items: HRNotificationRecord[], employeeId: string) {
  return selectInboxForRecipient(items, employeeId).filter((x) => !x.readAt).length;
}
