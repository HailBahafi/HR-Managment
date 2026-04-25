'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hrDisciplineNavGroups } from '@/lib/hr-discipline/types';
import { cn } from '@/lib/utils';

export function DisciplineNav() {
  const pathname = usePathname();

  const allItems = hrDisciplineNavGroups.flatMap(g => g.items);

  return (
    <>
      {/* Mobile: horizontal scrollable pills */}
      <nav className="flex overflow-x-auto gap-1.5 pb-1 sm:hidden">
        {allItems.map(item => {
          const active = pathname.includes('/hr/discipline/' + item.slug);
          return (
            <Link
              key={item.slug}
              href={`/hr/discipline/${item.slug}`}
              className={cn(
                'flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
              )}
            >
              {item.labelAr}
            </Link>
          );
        })}
      </nav>

      {/* Desktop: grouped vertical sidebar */}
      <nav className="hidden sm:block">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/30 p-1 flex-wrap">
          {hrDisciplineNavGroups.map(group => (
            <div key={group.labelAr} className="flex items-center gap-1">
              <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 whitespace-nowrap">
                {group.labelAr}
              </span>
              {group.items.map(item => {
                const active = pathname.includes('/hr/discipline/' + item.slug);
                return (
                  <Link
                    key={item.slug}
                    href={`/hr/discipline/${item.slug}`}
                    className={cn(
                      'flex items-center rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all',
                      active
                        ? 'bg-background text-foreground shadow-soft'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.labelAr}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
