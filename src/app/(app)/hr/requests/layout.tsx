import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { RequestsNav } from '@/features/hr/requests/components/requests-nav';

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <SetPageTitle titleAr="إدارة الطلبات" descriptionAr="الطلبات العامة، تصحيح الحضور، وإدارة طلبات الإجازات، الأنواع، القوالب، وسلاسل الموافقة" iconName="ClipboardList" />
      <RequestsNav />
      {children}
    </div>
  );
}