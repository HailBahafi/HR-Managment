import * as React from 'react';
import Link from 'next/link';
import { LeavesNav } from '@/components/leaves/leaves-nav';

export default function LeavesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
          <div className="h-px w-6 bg-gold" />
          الموارد البشرية
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">إجازات الموظفين</h1>
        <p className="mt-1 text-muted-foreground">إدارة طلبات الإجازات والعطل الرسمية والإعدادات</p>
      </div>
      <LeavesNav />
      {children}
    </div>
  );
}
