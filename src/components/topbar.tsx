'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Bell, Moon, Sun, LogOut, User, Settings, Shield, Menu,
  LayoutDashboard, Users, Clock, CalendarDays, ClipboardList,
  ShieldAlert, Wallet, BarChart3, Building2, ChevronDown,
  LayoutGrid, MapPin, Link2, CalendarRange,
  InboxIcon, ListChecks, FileText, ShieldCheck, LayoutList,
  Banknote, FileSignature, BookOpen, FileSpreadsheet,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/sidebar-context';
import { usePageTitle } from '@/components/page-title-context';
import { FilterTrigger } from '@/components/filter-panel';
import { Logo } from '@/components/logo';
import { NotificationBellPopover } from '@/components/notifications/notification-bell-popover';
import { cn } from '@/lib/utils';
import { hrDisciplineNavGroups } from '@/lib/hr-discipline/types';

/* ── Icon registry ────────────────────────────────────────────────────── */
export const PAGE_ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Clock, CalendarDays, ClipboardList,
  ShieldAlert, Wallet, BarChart3, Building2, Settings,
  CalendarRange, Banknote, FileSignature, BookOpen, FileSpreadsheet, Bell,
};

/* ── Nav data ──────────────────────────────────────────────────────────── */
type SubItem  = { label: string; href: string; icon?: React.ElementType };
type NavGroup = { labelAr?: string; items: SubItem[] };
type NavItem  = {
  key: string; label: string; href?: string;
  icon: React.ElementType; groups?: NavGroup[];
};

export const navConfig: NavItem[] = [
  { key: 'dashboard', label: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard },
  {
    key: 'employees', label: 'الهيكل الإداري', icon: Users,
    groups: [{ items: [
      { label: 'سجل الموظفين',     href: '/employees',      icon: Users },
      { label: 'الفروع',           href: '/branches',       icon: Building2 },
      { label: 'الأقسام',          href: '/departments',    icon: Building2 },
      { label: 'الهيكل التنظيمي', href: '/organization',   icon: Building2 },
    ]}],
  },
  {
    key: 'attendance', label: 'الحضور', icon: Clock,
    groups: [
      { labelAr: 'المتابعة', items: [
        { label: 'إدارة الحضور', href: '/attendance?section=daily', icon: CalendarRange },
      ]},
      { labelAr: 'الإسناد', items: [
        { label: 'ربط الشيفتات بالموظفين',        href: '/attendance?section=assignment',       icon: ClipboardList },
        { label: 'ربط النقاط بالموظفين  ', href: '/attendance?section=checkpoint-links', icon: Link2 },
      ]},
      { labelAr: 'الإعداد', items: [
        { label: 'قوالب الشفت',  href: '/attendance?section=templates',   icon: LayoutGrid },
        { label: 'نقاط التسجيل', href: '/attendance?section=checkpoints', icon: MapPin },
      ]},
    ],
  },
  {
    key: 'leaves', label: 'الإجازات', icon: CalendarDays,
    groups: [
      { labelAr: 'المتابعة', items: [
        { label: 'التحليلات',     href: '/hr/leaves/analytics',         icon: BarChart3 },
        { label: 'إدارة الطلبات', href: '/hr/leaves/unified-management', icon: LayoutList },
      ]},
      { labelAr: 'الإعداد', items: [
        { label: 'أنواع الإجازات', href: '/hr/leaves/leave-types',     icon: ListChecks },
        { label: 'العطل الرسمية',  href: '/hr/leaves/public-holidays', icon: CalendarDays },
      ]},
    ],
  },
  {
    key: 'requests', label: 'الطلبات', icon: ClipboardList,
    groups: [
      { labelAr: 'الطلبات', items: [{ label: 'إدارة الطلبات', href: '/hr/requests/general', icon: InboxIcon }] },
      { labelAr: 'الإعداد', items: [
        { label: 'أنواع الطلبات', href: '/hr/requests/request-types',   icon: ListChecks },
        { label: 'قوالب النماذج', href: '/hr/requests/form-templates',  icon: FileText },
      ]},
      { labelAr: 'الموافقات', items: [{ label: 'إسناد الموافقة', href: '/hr/requests/approval-assignment', icon: ShieldCheck }] },
    ],
  },
  {
    key: 'discipline', label: 'الانضباط الوظيفي', icon: ShieldAlert,
    groups: hrDisciplineNavGroups.map(g => ({
      labelAr: g.labelAr,
      items: g.items.map(item => ({ label: item.labelAr, href: `/hr/discipline/${item.slug}` })),
    })),
  },
  {
    key: 'contracts', label: 'الرواتب والعقود', icon: Wallet,
    groups: [
      { labelAr: 'الراتب', items: [
        { label: 'فترات الراتب',  href: '/hr/contracts/payroll-periods',  icon: CalendarRange },
        { label: 'سلف الموظفين', href: '/hr/contracts/employee-advances', icon: Banknote },
      ]},
      { labelAr: 'العقود', items: [
        { label: 'عقود العمل',  href: '/hr/contracts/employment', icon: FileSignature },
        { label: 'مواد العقود', href: '/hr/contracts/articles',   icon: BookOpen },
      ]},
      { labelAr: 'التقارير', items: [
        { label: 'كشف مسيرات الرواتب', href: '/hr/contracts/reports', icon: FileSpreadsheet },
      ]},
    ],
  },
  { key: 'permissions', label: 'الصلاحيات', href: '/permissions', icon: Shield },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */
function parentIsActive(pathname: string, item: NavItem) {
  if (item.href) return pathname === item.href || pathname.startsWith(item.href + '/');
  return item.groups?.some(g =>
    g.items.some(s => {
      const base = s.href.split('?')[0];
      return pathname === base || pathname.startsWith(base + '/');
    }),
  ) ?? false;
}

/* ── NavDropdown — needs useSearchParams for query-aware active state ── */
function NavDropdownContent({
  groups, itemKey, onOpen, onClose,
}: {
  groups: NavGroup[];
  itemKey: string;
  onOpen: () => void;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const multiGroup = groups.length > 1;

  function subIsActive(href: string) {
    const [hrefPath, hrefQuery] = href.split('?');
    const base = hrefPath;
    if (pathname !== base && !pathname.startsWith(base + '/')) return false;
    if (!hrefQuery) return true;
    const params = new URLSearchParams(hrefQuery);
    for (const [k, v] of params) {
      if (searchParams.get(k) !== v) return false;
    }
    return true;
  }

  return (
    <div
      className={cn(
        'nav-dropdown absolute right-0 top-[calc(100%+6px)] z-50 rounded-2xl border border-border/60 bg-popover/95 p-2 shadow-elevated backdrop-blur-xl min-w-[220px]',
      )}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      {groups.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {gi > 0 && <div className="my-1 border-t border-border/40" />}
          {group.labelAr && (
            <p className="mb-1 px-3 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50">
              {group.labelAr}
            </p>
          )}
          {group.items.map(sub => {
            const SubIcon = sub.icon;
            const active  = subIsActive(sub.href);
            return (
              <Link
                key={sub.href}
                href={sub.href}
                className={cn(
                  'group/sub relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
                  active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground/70 hover:bg-muted/70 hover:text-foreground',
                )}
              >
                {active && (
                  <span className="absolute inset-e-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                )}
                {SubIcon && (
                  <span className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted/60 text-muted-foreground group-hover/sub:bg-primary/10 group-hover/sub:text-primary',
                  )}>
                    <SubIcon className="h-3.5 w-3.5" />
                  </span>
                )}
                <span className="flex-1 leading-tight">{sub.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ── Main Topbar ─────────────────────────────────────────────────────── */
export function Topbar() {
  const [dark, setDark] = React.useState(false);
  const { toggle } = useSidebar();
  const { meta } = usePageTitle();
  const pathname = usePathname();

  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMenu   = (key: string) => { if (closeTimer.current) clearTimeout(closeTimer.current); setActiveMenu(key); };
  const delayClose = () => { closeTimer.current = setTimeout(() => setActiveMenu(null), 150); };

  React.useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  React.useEffect(() => { setActiveMenu(null); }, [pathname]);

  const PageIcon = meta.iconName ? PAGE_ICONS[meta.iconName] : null;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex flex-col border-b backdrop-blur-xl',
        'border-border/60',
        /* Light: crisp glass bar — cool white → parchment → whisper of primary teal */
        'bg-linear-to-b from-card via-background to-primary-50/35',
        'shadow-[inset_0_1px_0_0_rgb(255_255_255_/0.92),0_10px_40px_-18px_hsl(var(--primary)/0.09)]',
        /* Dark: flat frosted surface (unchanged character) */
        'dark:bg-none dark:bg-background/95 dark:shadow-none dark:backdrop-blur-2xl',
      )}
    >

      {/* ── Row 1: logo + nav + actions ── */}
      <div className="flex h-[54px] items-center gap-2 px-4 sm:px-5">

        {/* Logo */}
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-muted/50">
          <Logo size={28} />
          <div className="hidden flex-col leading-none sm:flex">
            <span className="font-display text-[15px] font-bold tracking-tight">روز</span>
            <span className="text-[9px] font-medium tracking-[0.22em] text-muted-foreground uppercase">rose HR</span>
          </div>
        </Link>

        <div className="mx-0.5 hidden h-5 w-px bg-border/70 lg:block" />

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-0.5 lg:flex" aria-label="التنقل الرئيسي">
          {navConfig.map(item => {
            const active  = parentIsActive(pathname, item);
            const isOpen  = activeMenu === item.key;
            const hasDrop = !!item.groups;

            const btnClass = cn(
              'relative flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[13px] font-medium outline-none',
              'transition-all duration-200 ease-out',
              active  ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/65 hover:bg-muted/70 hover:text-foreground',
              isOpen && !active && 'bg-muted/70 text-foreground',
            );

            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => { if (hasDrop) openMenu(item.key); }}
                onMouseLeave={() => { if (hasDrop) delayClose(); }}
              >
                {item.href && !hasDrop ? (
                  <Link href={item.href} className={btnClass}>
                    <item.icon className="h-[14px] w-[14px] shrink-0" />
                    {item.label}
                  </Link>
                ) : (
                  <button type="button" className={btnClass}>
                    <item.icon className="h-[14px] w-[14px] shrink-0" />
                    {item.label}
                    <ChevronDown className={cn(
                      'h-3 w-3 opacity-60 transition-transform duration-200',
                      isOpen && 'rotate-180',
                    )} />
                  </button>
                )}

                {/* Dropdown — wrapped in Suspense so useSearchParams is safe */}
                {isOpen && hasDrop && (
                  <React.Suspense fallback={null}>
                    <NavDropdownContent
                      groups={item.groups!}
                      itemKey={item.key}
                      onOpen={() => openMenu(item.key)}
                      onClose={delayClose}
                    />
                  </React.Suspense>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex-1 lg:hidden" />

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">

          {/* Filter trigger */}
          <FilterTrigger />

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setDark(d => !d)}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <NotificationBellPopover />

          <div className="mx-1 h-5 w-px bg-border/70" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-muted/60">
                <Avatar className="h-7 w-7 ring-2 ring-gold/40">
                  <AvatarImage src="https://i.pravatar.cc/100?img=12" />
                  <AvatarFallback>ع</AvatarFallback>
                </Avatar>
                <div className="hidden flex-col text-right leading-tight md:flex">
                  <span className="text-[12px] font-semibold">عبدالرحمن المالكي</span>
                  <span className="text-[10px] text-muted-foreground">مدير الموارد البشرية</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">عبدالرحمن المالكي</span>
                  <span className="text-xs font-normal text-muted-foreground">abdulrahman.m@rose.sa</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><User className="h-4 w-4" /><span>الملف الشخصي</span></DropdownMenuItem>
              <DropdownMenuItem><Settings className="h-4 w-4" /><span>الإعدادات</span></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
                <Link href="/login"><LogOut className="h-4 w-4" /><span>تسجيل الخروج</span></Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl lg:hidden" onClick={toggle} aria-label="القائمة">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Row 2: page title ── */}
      <div
        className={cn(
          'flex h-8 items-center gap-2.5 border-t px-4 sm:px-5',
          'border-border/25 bg-white/45 backdrop-blur-sm dark:border-border/30 dark:bg-muted/10',
        )}
      >
        {PageIcon && <PageIcon className="h-3.5 w-3.5 shrink-0 text-primary/80" />}
        {meta.titleAr ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[12px] font-semibold text-foreground/80 leading-none">{meta.titleAr}</span>
            {meta.descriptionAr && (
              <span className="hidden text-[11px] text-muted-foreground/70 sm:block">· {meta.descriptionAr}</span>
            )}
          </div>
        ) : (
          <div className="h-2.5 w-28 animate-pulse rounded-full bg-muted" />
        )}
      </div>
    </header>
  );
}
