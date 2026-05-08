import * as React from 'react';
import { DisciplineNav } from '@/features/hr/discipline/components/discipline-nav';

export default function DisciplineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <DisciplineNav />
      {children}
    </div>
  );
}
