import * as React from 'react';
import { SetPageTitle } from '@/components/set-page-title';
import { LeavesNav } from '@/components/leaves/leaves-nav';

export default function LeavesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <SetPageTitle titleAr="إجازات الموظفين" descriptionAr="إدارة طلبات الإجازات والعطل الرسمية والإعدادات" iconName="CalendarDays" />
      <LeavesNav />
      {children}
    </div>
  );
}
