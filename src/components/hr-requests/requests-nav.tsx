'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { InboxIcon, ListChecks, FileText, ShieldCheck } from 'lucide-react';
import type {
  HR_REQUESTS_GENERAL_PATH,
  HR_REQUESTS_TYPES_PATH,
  HR_REQUESTS_FORM_TEMPLATES_PATH,
  HR_REQUESTS_APPROVAL_ASSIGNMENT_PATH,
} from '@/lib/hr-requests/types';

const TABS = [
  { href: '/hr/requests/general', label: 'إدارة الطلبات', icon: InboxIcon },
  { href: '/hr/requests/request-types', label: 'أنواع الطلبات', icon: ListChecks },
  { href: '/hr/requests/form-templates', label: 'قوالب النماذج', icon: FileText },
  { href: '/hr/requests/approval-assignment', label: 'إسناد الموافقة', icon: ShieldCheck },
];

export function RequestsNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/30 p-1">
      {TABS.map(tab => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
        return (
          <Link key={tab.href} href={tab.href}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
              active ? 'bg-background text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
            )}>
            <tab.icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
