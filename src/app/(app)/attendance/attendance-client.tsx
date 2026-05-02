'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Download, RotateCcw } from 'lucide-react';
import { useSetPageTitle } from '@/components/page-title-context';
import { Button } from '@/components/ui/button';
import { getAttendanceSectionFromParams } from '@/components/attendance/attendance-section-nav';
import { ShiftTemplatesPanel } from '@/components/attendance/shift-templates-panel';
import { AssignmentsPanel } from '@/components/attendance/assignments-panel';
import { DailyAttendancePanel } from '@/components/attendance/daily-attendance-panel';
import { CheckpointsPanel } from '@/components/attendance/checkpoints-panel';
import { CheckpointLinksPanel } from '@/components/attendance/checkpoint-links-panel';
import { useAttendanceStore } from '@/lib/attendance/store';
import type { AttendanceSection } from '@/lib/attendance/types';

const SECTION_COPY: Record<AttendanceSection, { title: string; desc: string }> = {
  templates: { title: 'قوالب الشفت', desc: 'تعريف الجداول الأسبوعية والفترات والنوافذ.' },
  assignment: { title: 'ربط الشيفتات بالموظفين', desc: 'ربط الشيفتات بالموظفين أو الأقسام أو الفروع.' },
  daily: { title: 'الحضور اليومي', desc: 'متابعة السجلات ضمن نطاق زمني.' },
  checkpoints: { title: 'نقاط التسجيل', desc: 'إدارة المواقع الجغرافية المعتمدة للتسجيل.' },
  'checkpoint-links': { title: 'ربط النقاط بالموظفين  ', desc: 'ربط الموظفين بنقاط محددة' },
};

export function AttendanceClient() {
  const searchParams = useSearchParams();
  const section = getAttendanceSectionFromParams(searchParams.get('section'));
  const resetToSeed = useAttendanceStore((s) => s.resetToSeed);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const copy = SECTION_COPY[section];
  useSetPageTitle({ titleAr: 'إدارة الحضور', descriptionAr: copy.desc, iconName: 'Clock' });

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-lg bg-muted/40" />
        <div className="h-12 rounded-full bg-muted/30" />
        <div className="h-96 rounded-lg bg-muted/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg">
        <div className="rounded-md">
          <div>
            {section === 'templates' && <ShiftTemplatesPanel />}
            {section === 'assignment' && <AssignmentsPanel />}
            {section === 'daily' && <DailyAttendancePanel />}
            {section === 'checkpoints' && <CheckpointsPanel />}
            {section === 'checkpoint-links' && <CheckpointLinksPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}

