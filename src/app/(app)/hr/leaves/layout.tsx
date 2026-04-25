import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { LeavesNav } from '@/components/leaves/leaves-nav';
import { SetPageTitle } from '@/components/set-page-title';

export default function LeavesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <SetPageTitle titleAr="إجازات الموظفين" descriptionAr="إدارة طلبات الإجازات والعطل الرسمية والإعدادات" icon={CalendarDays} />
      <LeavesNav />
      {children}
    </div>
  );
}
