'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Download, RotateCcw, Clock as ClockIcon } from 'lucide-react';
import { useSetPageTitle } from '@/components/page-title-context';
import { Button } from '@/components/ui/button';
import { AttendanceSectionNav, getAttendanceSectionFromParams } from '@/components/attendance/attendance-section-nav';
import { ShiftTemplatesPanel } from '@/components/attendance/shift-templates-panel';
import { AssignmentsPanel } from '@/components/attendance/assignments-panel';
import { DailyAttendancePanel } from '@/components/attendance/daily-attendance-panel';
import { CheckpointsPanel } from '@/components/attendance/checkpoints-panel';
import { CheckpointLinksPanel } from '@/components/attendance/checkpoint-links-panel';
import { useAttendanceStore } from '@/lib/attendance/store';
import { todayIso } from '@/lib/attendance/utils';
import type { AttendanceSection } from '@/lib/attendance/types';

const SECTION_COPY: Record<AttendanceSection, { title: string; desc: string }> = {
  templates: { title: 'قوالب الشفت', desc: 'تعريف الجداول الأسبوعية والفترات والنوافذ.' },
  assignment: { title: 'تعيين القوالب', desc: 'ربط القوالب بالموظفين أو الأقسام أو الفروع.' },
  daily: { title: 'الحضور اليومي', desc: 'متابعة السجلات والانحرافات ضمن نطاق زمني.' },
  checkpoints: { title: 'نقاط التسجيل', desc: 'إدارة المواقع الجغرافية المعتمدة للتسجيل.' },
  'checkpoint-links': { title: 'ربط النقاط بالموظفين', desc: 'دفعات ربط الموظفين بنقاط محددة.' },
};

export function AttendanceClient() {
  const searchParams = useSearchParams();
  const section = getAttendanceSectionFromParams(searchParams.get('section'));
  const resetToSeed = useAttendanceStore((s) => s.resetToSeed);
  const daySummaries = useAttendanceStore((s) => s.daySummaries);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const t = todayIso();
  const todayStats = React.useMemo(() => {
    const rows = daySummaries.filter((s) => s.date === t);
    return {
      present: rows.filter((s) => s.status === 'present').length,
      late: rows.filter((s) => s.status === 'late').length,
      absent: rows.filter((s) => s.status === 'absent').length,
      other: rows.filter((s) => !['present', 'late', 'absent'].includes(s.status)).length,
    };
  }, [daySummaries, t]);

  const copy = SECTION_COPY[section];
  useSetPageTitle({ titleAr: 'إدارة الحضور', descriptionAr: copy.desc, icon: ClockIcon });

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
      <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="outline"
            className="gap-2"
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.confirm('إعادة تحميل البيانات التجريبية؟ سيتم فقدان التعديلات المحفوظة محلياً.')) {
                resetToSeed();
              }
            }}
          >
            <RotateCcw className="h-4 w-4" />
            استعادة البيانات
          </Button>
          <Button variant="outline" className="gap-2" type="button" disabled>
            <Calendar className="h-4 w-4" />
            تقويم
          </Button>
          <Button variant="outline" className="gap-2" type="button" disabled>
            <Download className="h-4 w-4" />
            تصدير عام
          </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="حاضر اليوم" value={todayStats.present} />
        <MiniStat label="متأخر" value={todayStats.late} />
        <MiniStat label="غائب" value={todayStats.absent} />
        <MiniStat label="آخر" value={todayStats.other} />
      </div>

      <AttendanceSectionNav />

      <div className="rounded-lg border border-border bg-card/50 p-1 shadow-soft">
        <div className="rounded-md border border-border/60 bg-card p-4 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">{copy.title}</h2>
          <div className="mt-4">
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-soft">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-2xl font-bold number-ar">{value}</p>
    </div>
  );
}
