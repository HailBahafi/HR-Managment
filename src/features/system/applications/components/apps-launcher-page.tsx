'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
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
      className="group outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
    >
      <div className="glass-card flex flex-col items-center gap-3 rounded-2xl p-4 text-center transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-elevated">
        <span
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-soft transition-shadow group-hover:shadow-elevated sm:h-16 sm:w-16',
            tileClass,
          )}
        >
          <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.75} />
        </span>
        <span className="max-w-[7rem] text-xs font-medium leading-snug text-foreground sm:text-sm">
          {app.nameAr}
        </span>
      </div>
    </Link>
  );
}

export function AppsLauncherPage() {
  useSetPageTitle({
    titleAr: 'التطبيقات',
    descriptionAr: 'اختر التطبيق للبدء',
    iconName: 'LayoutGrid',
  });

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-1 pb-8 pt-2 sm:px-2 sm:pt-4">
        {loading ? (
          <div className="flex min-h-[40vh] flex-1 items-center justify-center">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
              role="status"
              aria-label="جاري التحميل"
            />
          </div>
        ) : apps.length === 0 ? (
          <div className="flex min-h-[40vh] flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <p className="text-sm">لا توجد تطبيقات متاحة لحسابك.</p>
            <p className="text-xs text-muted-foreground/70">تواصل مع مسؤول النظام لمنح الصلاحيات.</p>
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {apps.map((app, index) => (
              <AppTile key={app.id} app={app} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
