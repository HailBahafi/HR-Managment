'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthenticatedShell } from '@/components/layouts/authenticated-shell';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { useAuthUserDisplay } from '@/features/auth/hooks/use-auth-user-display';
import { useDefaultCompanyBranding } from '@/features/auth/hooks/use-default-company-branding';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  applicationsApi,
  resolveApplicationLaunchPath,
  type ApplicationResponseDto,
} from '@/features/system/applications/lib/api/applications';
import {
  resolveApplicationIcon,
  resolveApplicationTileClass,
} from '@/features/system/applications/lib/application-tile-config';
import { useThemeStore } from '@/shared/store/theme-store';
import { cn } from '@/shared/utils';

function AppTile({
  app,
  index,
}: {
  app: ApplicationResponseDto;
  index: number;
}) {
  const Icon = resolveApplicationIcon(app);
  const href = resolveApplicationLaunchPath(app);
  const tileClass = resolveApplicationTileClass(app, index);

  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-3 rounded-2xl p-2 text-center outline-none transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <span
        className={cn(
          'flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl text-white shadow-lg transition-shadow group-hover:shadow-xl sm:h-20 sm:w-20',
          tileClass,
        )}
      >
        <Icon className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.75} />
      </span>
      <span className="max-w-[6.5rem] text-xs font-medium leading-snug text-white/90 sm:text-sm">
        {app.nameAr}
      </span>
    </Link>
  );
}

function LauncherHeader() {
  const { logout, loading: logoutLoading } = useLogout();
  const userDisplay = useAuthUserDisplay();
  const branding = useDefaultCompanyBranding();
  const themeMode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white/90">
          {branding.companyNameAr ?? 'نظام الموارد'}
        </p>
        <p className="truncate text-xs text-white/50">اختر التطبيق</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white/80 hover:bg-white/10 hover:text-white"
          onClick={toggleTheme}
          aria-label="تبديل السمة"
        >
          {themeMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 sm:flex">
          <Avatar className="h-7 w-7">
            <AvatarImage src={userDisplay.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-[10px]">{userDisplay.avatarFallback}</AvatarFallback>
          </Avatar>
          <span className="max-w-[8rem] truncate text-xs text-white/80">{userDisplay.displayName}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          disabled={logoutLoading}
          onClick={() => void logout()}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">خروج</span>
        </Button>
      </div>
    </header>
  );
}

export function AppsLauncherPage() {
  const [apps, setApps] = React.useState<ApplicationResponseDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const items = await applicationsApi.getLauncher();
        if (!cancelled) setApps(items);
      } catch (err) {
        handleApiError(err, 'applications.launcher');
        if (!cancelled) setApps([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthenticatedShell>
      <div className="min-h-screen bg-[#2f3447] text-white">
        <LauncherHeader />
        <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white"
                role="status"
                aria-label="جاري التحميل"
              />
            </div>
          ) : apps.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center text-white/70">
              <p className="text-sm">لا توجد تطبيقات متاحة لحسابك.</p>
              <p className="text-xs text-white/45">تواصل مع مسؤول النظام لمنح الصلاحيات.</p>
            </div>
          ) : (
            <div className="grid w-full grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {apps.map((app, index) => (
                <AppTile key={app.id} app={app} index={index} />
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthenticatedShell>
  );
}