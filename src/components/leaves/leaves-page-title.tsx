'use client';

import { CalendarDays } from 'lucide-react';
import { SetPageTitle } from '@/components/set-page-title';

export function LeavesPageTitle() {
  return (
    <SetPageTitle
      titleAr="إجازات الموظفين"
      descriptionAr="إدارة طلبات الإجازات والعطل الرسمية والإعدادات"
      icon={CalendarDays}
    />
  );
}
