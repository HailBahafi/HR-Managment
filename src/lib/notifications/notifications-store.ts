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
    bodyAr: 'غداً الساعة 10:00 صباحاً.',
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
    recipientEmployeeId: 'e2',
    createdAt: '2026-04-25T11:20:00Z',
    readAt: null,
    dismissedAt: null,
  },
  {
    id: 'n-seed-5',
    titleAr: 'انتهاء عقد تجريبي لموظف',
    bodyAr: 'يرجى مراجعة قائمة العقود.',
    recipientEmployeeId: 'e3',
    createdAt: '2026-04-24T09:45:00Z',
    readAt: null,
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
      version: 1,
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
