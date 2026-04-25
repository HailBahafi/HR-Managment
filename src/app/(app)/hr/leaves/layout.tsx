import * as React from 'react';
import { LeavesNav } from '@/components/leaves/leaves-nav';
import { LeavesPageTitle } from '@/components/leaves/leaves-page-title';

export default function LeavesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <LeavesPageTitle />
      <LeavesNav />
      {children}
    </div>
  );
}
