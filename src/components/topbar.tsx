'use client';

import * as React from 'react';
import { Bell, Moon, Sun, LogOut, User, Settings, Menu } from 'lucide-react';
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
import Link from 'next/link';
import { useSidebar } from '@/components/sidebar-context';
import { usePageTitle } from '@/components/page-title-context';

export function Topbar() {
  const [dark, setDark] = React.useState(false);
  const { toggle } = useSidebar();
  const { meta } = usePageTitle();
  const Icon = meta.icon;

  React.useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  return (
    <header className="sticky top-0 z-20 flex h-16 min-w-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">

      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 lg:hidden"
        onClick={toggle}
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title + description */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {Icon && (
          <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
        )}
        <div className="min-w-0">
          {meta.titleAr ? (
            <>
              <h1 className="truncate font-display text-base font-bold leading-none tracking-tight sm:text-lg">
                {meta.titleAr}
              </h1>
              {meta.descriptionAr && (
                <p className="mt-0.5 hidden truncate text-[11px] text-muted-foreground sm:block">
                  {meta.descriptionAr}
                </p>
              )}
            </>
          ) : (
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {/* Dark mode */}
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setDark(!dark)}>
          {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute left-2 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
          </span>
        </Button>

        <div className="mx-0.5 h-7 w-px bg-border" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-full p-1 transition-colors hover:bg-muted/60">
              <Avatar className="h-8 w-8 ring-2 ring-gold/30">
                <AvatarImage src="https://i.pravatar.cc/100?img=12" />
                <AvatarFallback>ع</AvatarFallback>
              </Avatar>
              <div className="hidden flex-col text-right leading-tight md:flex">
                <span className="text-sm font-semibold">عبدالرحمن المالكي</span>
                <span className="text-[11px] text-muted-foreground">مدير الموارد البشرية</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">عبدالرحمن المالكي</span>
                <span className="text-xs font-normal text-muted-foreground">abdulrahman.m@nawa.sa</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4" />
              <span>الملف الشخصي</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4" />
              <span>الإعدادات</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
              <Link href="/login">
                <LogOut className="h-4 w-4" />
                <span>تسجيل الخروج</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
