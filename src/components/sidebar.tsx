'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Clock,
  Wallet,
  BarChart3,
  Settings,
  LifeBuoy,
  CalendarDays,
  ClipboardList,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from '@/components/sidebar-context';

const nav: { href: string; label: string; icon: React.ElementType; badge?: string }[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/hr/employees', label: 'الموظفين والأقسام', icon: Users },
  { href: '/attendance', label: 'الحضور والانصراف', icon: Clock },
  { href: '/hr/leaves', label: 'الإجازات', icon: CalendarDays },
  { href: '/hr/requests', label: 'إدارة الطلبات', icon: ClipboardList },
  { href: '/payroll', label: 'الرواتب', icon: Wallet },
  { href: '/reports', label: 'التقارير', icon: BarChart3 },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
];

function SidebarInner({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  // Close on navigation (mobile)
  const prevPathname = React.useRef(pathname);
  React.useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onClose?.();
    }
  }, [pathname, onClose]);

  return (
    <div className="flex h-full flex-col">
      {/* Logo header */}
      <div className="relative flex items-center justify-between border-b border-sidebar-border/50 p-5">
        <div className="flex items-center gap-3">
          <Logo size={34} />
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">نواة</span>
            <span className="text-[10px] text-sidebar-foreground/60 tracking-[0.2em] uppercase">NAWA HR</span>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-border/40 hover:text-sidebar-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="absolute bottom-0 left-5 right-5 h-px bg-gold/20" />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <div className="mb-2 px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">
          القائمة الرئيسية
        </div>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-gold/15 text-gold'
                  : 'text-sidebar-foreground/75 hover:bg-sidebar-border/40 hover:text-sidebar-foreground',
              )}
            >
              {active && (
                <span className="absolute right-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-l-full bg-gold" />
              )}
              <item.icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-gold' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80')} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant="gold" className="h-5 min-w-[20px] justify-center px-1.5 text-[10px]">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Support footer */}
      <div className="border-t border-sidebar-border/50 p-3">
        <Link
          href="/support"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-border/40 hover:text-sidebar-foreground"
        >
          <LifeBuoy className="h-[18px] w-[18px]" />
          <span>الدعم الفني</span>
        </Link>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* ── Desktop: fixed sidebar ── */}
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 border-l border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
        <SidebarInner />
      </aside>

      {/* ── Mobile: overlay + slide-in drawer ── */}
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground shadow-luxe transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <SidebarInner onClose={() => setOpen(false)} />
      </aside>
    </>
  );
}
