'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ListChecks, CalendarDays, LayoutList, BarChart3, CirclePlus } from 'lucide-react';

type LeavesTab = {
  href: string;
  label: string;
  icon: React.ElementType;
  /** إن وُجدت، يُفعَّل التبويب فقط عند تطابق المسار بالكامل (مثل إدارة الطلبات دون صفحة إضافة الرصيد) */
  activeExact?: boolean;
};

const TABS: LeavesTab[] = [
  { href: '/hr/leaves/analytics', label: 'التحليلات', icon: BarChart3 },
  { href: '/hr/leaves/unified-management', label: 'إدارة الطلبات', icon: LayoutList, activeExact: true },
  { href: '/hr/leaves/unified-management/balance-credit', label: 'إضافة رصيد إجازات', icon: CirclePlus },
  { href: '/hr/leaves/leave-types', label: 'أنواع الإجازات', icon: ListChecks },
  { href: '/hr/leaves/public-holidays', label: 'العطل الرسمية', icon: CalendarDays },
];

function isTabActive(pathname: string, tab: LeavesTab): boolean {
  if (tab.activeExact) return pathname === tab.href;
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export function LeavesNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/30 p-1">
      {TABS.map((tab) => {
        const active = isTabActive(pathname, tab);
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
