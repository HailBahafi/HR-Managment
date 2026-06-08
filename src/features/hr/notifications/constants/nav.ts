import { Bell, Inbox, Send } from 'lucide-react';

export const hrNotificationsNavGroups: {
  labelAr: string;
  items: { labelAr: string; href: string; icon: typeof Bell }[];
}[] = [
  {
    labelAr: 'الإدارة',
    items: [
      {
        labelAr: 'إرسال وإدارة الإشعارات',
        href: '/hr/notifications/admin',
        icon: Send,
      },
    ],
  },
  {
    labelAr: 'الصندوق',
    items: [
      {
        labelAr: 'تنبيهات الموظفين',
        href: '/hr/notifications',
        icon: Inbox,
      },
    ],
  },
];

export function isHrNotificationsNavPath(pathname: string): boolean {
  return pathname === '/hr/notifications' || pathname.startsWith('/hr/notifications/');
}
