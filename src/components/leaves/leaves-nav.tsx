'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ListChecks, CalendarDays, LayoutList, BarChart3 } from 'lucide-react';

const TABS = [
  { href: '/hr/leaves/analytics', label: 'التحليلات', icon: BarChart3 },
  { href: '/hr/leaves/unified-management', label: 'إدارة الطلبات', icon: LayoutList },
  { href: '/hr/leaves/leave-types', label: 'أنواع الإجازات', icon: ListChecks },
  { href: '/hr/leaves/public-holidays', label: 'العطل الرسمية', icon: CalendarDays },
];

export function LeavesNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/30 p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
              active
                ? 'bg-background text-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
