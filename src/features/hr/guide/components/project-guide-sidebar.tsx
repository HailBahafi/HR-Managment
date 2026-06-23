'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils';
import { GUIDE_CATEGORIES, GUIDE_PAGES } from '@/features/hr/guide/constants/project-guide-content';

export function ProjectGuideSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn('space-y-6 text-sm', className)} aria-label="فهرس الدليل">
      {GUIDE_CATEGORIES.map((category) => {
        const pages = GUIDE_PAGES.filter((p) => p.categoryId === category.id);
        if (pages.length === 0) return null;

        return (
          <div key={category.id}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {category.label}
            </p>
            <ul className="space-y-0.5">
              {pages.map((page) => {
                const href = `/hr/guide/${page.slug}`;
                const active = pathname === href;
                return (
                  <li key={page.slug}>
                    <Link
                      href={href}
                      className={cn(
                        'block rounded-lg px-3 py-2 leading-snug transition-colors',
                        active
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-foreground/75 hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      {page.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
