import * as React from 'react';
import { RequestsNav } from '@/components/hr-requests/requests-nav';
import { HRRequestsPageTitle } from '@/components/hr-requests/hr-requests-page-title';

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <HRRequestsPageTitle />
      <RequestsNav />
      {children}
    </div>
  );
}
