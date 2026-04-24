'use client';

import * as React from 'react';
import { Bell, Search, Moon, Sun, LogOut, User, Settings, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export function Topbar() {
  const [dark, setDark] = React.useState(false);
  const { toggle } = useSidebar();

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
        className="h-10 w-10 shrink-0 lg:hidden"
        onClick={toggle}
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div className="relative min-w-0 flex-1">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ابحث…"
          className="h-10 w-full border-border/80 bg-muted/40 pr-10 text-sm focus-visible:bg-background sm:placeholder:content-['ابحث_عن_موظف،_طلب،_تقرير…']"
        />
        <kbd className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:flex">
          ⌘ K
        </kbd>
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
