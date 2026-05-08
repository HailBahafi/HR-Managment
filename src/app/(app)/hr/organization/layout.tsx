import * as React from 'react';
import { SetPageTitle } from '@/components/set-page-title';

export default function OrganizationModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <SetPageTitle
        titleAr="الهيكل الإداري"
        descriptionAr="الموظفون، جهات الاتصال، المسميات، الفروع، الأقسام، والهيكل التنظيمي"
        iconName="Users"
      />
      {children}
    </div>
  );
}