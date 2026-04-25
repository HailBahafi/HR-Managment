import * as React from 'react';
import { ClipboardList } from 'lucide-react';
import { RequestsNav } from '@/components/hr-requests/requests-nav';
import { SetPageTitle } from '@/components/set-page-title';

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <SetPageTitle titleAr="إدارة الطلبات" descriptionAr="الطلبات العامة، الأنواع، القوالب، وسلاسل الموافقة" icon={ClipboardList} />
      <RequestsNav />
      {children}
    </div>
  );
}
