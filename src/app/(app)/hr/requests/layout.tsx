import * as React from 'react';
import { RequestsNav } from '@/components/hr-requests/requests-nav';

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
          <div className="h-px w-6 bg-gold" />
          الموارد البشرية
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">إدارة الطلبات</h1>
        <p className="mt-1 text-muted-foreground">الطلبات العامة، الأنواع، القوالب، وسلاسل الموافقة</p>
      </div>
      <RequestsNav />
      {children}
    </div>
  );
}
