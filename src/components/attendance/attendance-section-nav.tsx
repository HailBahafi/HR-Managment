'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, Link2, MapPin, CalendarRange, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttendanceSection } from '@/lib/attendance/types';

const SECTIONS: { id: AttendanceSection; label: string; icon: React.ElementType }[] = [
  { id: 'templates', label: 'قوالب الشفت', icon: LayoutGrid },
  { id: 'assignment', label: 'تعيين القوالب', icon: ClipboardList },
  { id: 'daily', label: 'الحضور اليومي', icon: CalendarRange },
  { id: 'checkpoints', label: 'نقاط التسجيل', icon: MapPin },
  { id: 'checkpoint-links', label: 'ربط النقاط', icon: Link2 },
];

export function AttendanceSectionNav() {
  const searchParams = useSearchParams();
  const raw = searchParams.get('section') as AttendanceSection | null;
  const current: AttendanceSection =
    raw && SECTIONS.some((s) => s.id === raw) ? raw : 'templates';

  return (
    <nav className="flex flex-wrap gap-2" aria-label="أقسام الحضور">
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const active = current === id;
        return (
          <Link
            key={id}
            href={`/attendance?section=${id}`}
            scroll={false}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-accent/60 hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-90" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function getAttendanceSectionFromParams(section: string | null): AttendanceSection {
  const ids: AttendanceSection[] = ['templates', 'assignment', 'daily', 'checkpoints', 'checkpoint-links'];
  if (section && ids.includes(section as AttendanceSection)) return section as AttendanceSection;
  return 'templates';
}
