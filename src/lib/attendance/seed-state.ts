import type { Shift } from '@/types';
import { data } from '@/lib/data';
import { defaultCheckInWindow, defaultCheckOutWindow } from './defaults';
import type {
  AttendanceCheckInPoint,
  AttendanceCheckInPointLink,
  AttendanceDaySummary,
  AttendanceEvent,
  ShiftAssignment,
  ShiftPeriod,
  ShiftTemplate,
  TemplateDayConfig,
  WeekDayIndex,
} from './types';
import { buildSummariesFromTodayJson, genId, minutesFromMidnight } from './utils';

function periodFromMock(shiftId: string, day: WeekDayIndex, idx: number, p: { start: string; end: string; label: string }): ShiftPeriod {
  return {
    id: `${shiftId}-d${day}-p${idx}`,
    startTime: p.start,
    endTime: p.end,
    breakEnabled: false,
    breakStart: '12:00',
    breakEnd: '13:00',
    flexibilityEnabled: true,
    flexibilityMinutes: 10,
    checkIn: defaultCheckInWindow(),
    checkOut: defaultCheckOutWindow(),
    checkOutNotRequired: false,
    autoOvertime: false,
  };
}

function shiftToWeekDays(shift: Shift): TemplateDayConfig[] {
  const days: WeekDayIndex[] = [6, 0, 1, 2, 3, 4, 5];
  return days.map((day) => {
    if (day === 5 || day === 6) return { day, isRest: true, periods: [] };
    return {
      day,
      isRest: false,
      periods: shift.periods.map((p, i) => periodFromMock(shift.id, day, i, p)),
    };
  });
}

function shiftToTemplate(shift: Shift): ShiftTemplate {
  return {
    id: `tpl-${shift.id}`,
    nameAr: shift.name,
    nameEn: shift.name,
    colorHex: shift.color,
    effectiveFrom: '2025-01-01',
    isActive: true,
    weekDays: shiftToWeekDays(shift),
  };
}

function seedAssignments(templates: ShiftTemplate[]): ShiftAssignment[] {
  const tplMorning = templates.find((t) => t.id === 'tpl-s1');
  if (!tplMorning) return [];
  const batch1 = 'batch-seed-1';
  const emps = data.employees.slice(0, 8);
  return emps.map((e) => ({
    id: genId('asg'),
    templateId: tplMorning.id,
    targetType: 'employee' as const,
    targetId: e.id,
    targetLabel: e.name,
    effectiveFrom: '2025-01-01',
    batchId: batch1,
  }));
}

function seedEventsFromToday(employees: { id: string; name: string }[]): AttendanceEvent[] {
  const out: AttendanceEvent[] = [];
  for (const row of data.attendanceToday) {
    const emp = employees.find((x) => x.id === row.employeeId);
    const name = emp?.name ?? row.employeeId;
    if (row.checkIn) {
      out.push({
        id: genId('ev'),
        employeeId: row.employeeId,
        employeeName: name,
        date: row.date,
        type: 'check_in',
        at: formatHmFromIso(row.checkIn),
        source: row.geoPointId ? 'gps' : 'manual',
      });
    }
    if (row.checkOut) {
      out.push({
        id: genId('ev'),
        employeeId: row.employeeId,
        employeeName: name,
        date: row.date,
        type: 'check_out',
        at: formatHmFromIso(row.checkOut),
        source: 'manual',
      });
    }
  }
  return out;
}

function formatHmFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '00:00';
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function seedCheckpoints(): AttendanceCheckInPoint[] {
  return data.geoPoints.map((g) => ({
    id: g.id,
    nameAr: g.name,
    nameEn: g.name,
    latitude: g.lat,
    longitude: g.lng,
    radiusMeters: g.radius,
    isActive: true,
  }));
}

function seedLinks(): AttendanceCheckInPointLink[] {
  const links: AttendanceCheckInPointLink[] = [];
  const batch = 'batch-links-seed';
  for (const g of data.geoPoints) {
    for (const eid of g.assignedEmployees) {
      links.push({
        id: genId('lnk'),
        employeeId: eid,
        checkInPointId: g.id,
        batchId: batch,
        effectiveFrom: '2025-01-01',
        linkActive: true,
      });
    }
  }
  return links;
}

export interface AttendanceSeedState {
  shiftTemplates: ShiftTemplate[];
  assignments: ShiftAssignment[];
  events: AttendanceEvent[];
  daySummaries: AttendanceDaySummary[];
  checkpoints: AttendanceCheckInPoint[];
  checkpointLinks: AttendanceCheckInPointLink[];
}

// ─── Comprehensive e1 attendance seed (Jan–Apr 2026) ────────────────────────

type E1DaySpec = {
  date: string;
  status: 'present' | 'late' | 'absent' | 'early_leave' | 'overtime';
  checkIn?: string;
  checkOut?: string;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  overtimeMinutes?: number;
  workedMinutes?: number;
  notes?: string;
};

const E1_DAYS: E1DaySpec[] = [
  // ── Jan 2026 (20 working days, Sun-Thu) ──
  { date:'2026-01-04', status:'present',     checkIn:'07:58', checkOut:'17:05', workedMinutes:547 },
  { date:'2026-01-05', status:'present',     checkIn:'08:02', checkOut:'17:00', workedMinutes:538 },
  { date:'2026-01-06', status:'late',        checkIn:'08:47', checkOut:'17:10', lateMinutes:47, workedMinutes:503 },
  { date:'2026-01-07', status:'present',     checkIn:'07:55', checkOut:'17:00', workedMinutes:545 },
  { date:'2026-01-08', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-01-11', status:'present',     checkIn:'08:01', checkOut:'17:05', workedMinutes:544 },
  { date:'2026-01-12', status:'absent',      notes:'غياب بدون إذن', workedMinutes:0 },
  { date:'2026-01-13', status:'present',     checkIn:'07:59', checkOut:'17:00', workedMinutes:541 },
  { date:'2026-01-14', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-01-15', status:'late',        checkIn:'09:15', checkOut:'17:30', lateMinutes:75, workedMinutes:495 },
  { date:'2026-01-18', status:'present',     checkIn:'07:50', checkOut:'17:00', workedMinutes:550 },
  { date:'2026-01-19', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-01-20', status:'present',     checkIn:'08:05', checkOut:'17:00', workedMinutes:535 },
  { date:'2026-01-21', status:'present',     checkIn:'07:58', checkOut:'17:05', workedMinutes:547 },
  { date:'2026-01-22', status:'early_leave', checkIn:'08:00', checkOut:'14:30', earlyLeaveMinutes:150, workedMinutes:390 },
  { date:'2026-01-25', status:'present',     checkIn:'08:00', checkOut:'17:05', workedMinutes:545 },
  { date:'2026-01-26', status:'present',     checkIn:'07:55', checkOut:'17:00', workedMinutes:545 },
  { date:'2026-01-27', status:'absent',      notes:'إجازة مرضية', workedMinutes:0 },
  { date:'2026-01-28', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-01-29', status:'present',     checkIn:'08:02', checkOut:'17:00', workedMinutes:538 },
  // ── Feb 2026 (20 working days) ──
  { date:'2026-02-01', status:'present',     checkIn:'07:58', checkOut:'17:00', workedMinutes:542 },
  { date:'2026-02-02', status:'present',     checkIn:'08:00', checkOut:'17:05', workedMinutes:545 },
  { date:'2026-02-03', status:'late',        checkIn:'08:35', checkOut:'17:10', lateMinutes:35, workedMinutes:515 },
  { date:'2026-02-04', status:'present',     checkIn:'07:55', checkOut:'17:00', workedMinutes:545 },
  { date:'2026-02-05', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-02-08', status:'present',     checkIn:'08:02', checkOut:'17:00', workedMinutes:538 },
  { date:'2026-02-09', status:'present',     checkIn:'07:59', checkOut:'17:05', workedMinutes:546 },
  { date:'2026-02-10', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-02-11', status:'absent',      notes:'إجازة مرضية موثقة', workedMinutes:0 },
  { date:'2026-02-12', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-02-15', status:'overtime',    checkIn:'07:30', checkOut:'19:30', overtimeMinutes:150, workedMinutes:720 },
  { date:'2026-02-16', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-02-17', status:'present',     checkIn:'08:03', checkOut:'17:05', workedMinutes:542 },
  { date:'2026-02-18', status:'present',     checkIn:'07:58', checkOut:'17:00', workedMinutes:542 },
  { date:'2026-02-19', status:'early_leave', checkIn:'08:00', checkOut:'13:00', earlyLeaveMinutes:240, workedMinutes:300, notes:'ظرف طارئ عائلي' },
  { date:'2026-02-22', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-02-23', status:'late',        checkIn:'09:00', checkOut:'17:30', lateMinutes:60, workedMinutes:510 },
  { date:'2026-02-24', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-02-25', status:'present',     checkIn:'07:55', checkOut:'17:05', workedMinutes:550 },
  { date:'2026-02-26', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  // ── Mar 2026 (23 working days) ──
  { date:'2026-03-01', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-03-02', status:'present',     checkIn:'07:58', checkOut:'17:05', workedMinutes:547 },
  { date:'2026-03-03', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-03-04', status:'late',        checkIn:'08:50', checkOut:'17:20', lateMinutes:50, workedMinutes:510 },
  { date:'2026-03-05', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-03-08', status:'present',     checkIn:'08:02', checkOut:'17:00', workedMinutes:538 },
  { date:'2026-03-09', status:'present',     checkIn:'08:00', checkOut:'17:05', workedMinutes:545 },
  { date:'2026-03-10', status:'absent',      notes:'إجازة طارئة', workedMinutes:0 },
  { date:'2026-03-11', status:'present',     checkIn:'07:55', checkOut:'17:00', workedMinutes:545 },
  { date:'2026-03-12', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-03-15', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-03-16', status:'present',     checkIn:'07:58', checkOut:'17:05', workedMinutes:547 },
  { date:'2026-03-17', status:'overtime',    checkIn:'07:45', checkOut:'20:00', overtimeMinutes:180, workedMinutes:735 },
  { date:'2026-03-18', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-03-19', status:'present',     checkIn:'08:01', checkOut:'17:00', workedMinutes:539 },
  { date:'2026-03-22', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-03-23', status:'early_leave', checkIn:'08:00', checkOut:'15:00', earlyLeaveMinutes:120, workedMinutes:420 },
  { date:'2026-03-24', status:'present',     checkIn:'07:58', checkOut:'17:05', workedMinutes:547 },
  { date:'2026-03-25', status:'absent',      notes:'غياب بدون إذن', workedMinutes:0 },
  { date:'2026-03-26', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-03-29', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-03-30', status:'present',     checkIn:'07:55', checkOut:'17:05', workedMinutes:550 },
  { date:'2026-03-31', status:'late',        checkIn:'09:30', checkOut:'18:00', lateMinutes:90, workedMinutes:510 },
  // ── Apr 2026 (22 working days) ──
  { date:'2026-04-01', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-04-02', status:'present',     checkIn:'08:02', checkOut:'17:05', workedMinutes:543 },
  { date:'2026-04-05', status:'present',     checkIn:'07:58', checkOut:'17:00', workedMinutes:542 },
  { date:'2026-04-06', status:'late',        checkIn:'08:40', checkOut:'17:10', lateMinutes:40, workedMinutes:510 },
  { date:'2026-04-07', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-04-08', status:'present',     checkIn:'08:00', checkOut:'17:05', workedMinutes:545 },
  { date:'2026-04-09', status:'present',     checkIn:'07:55', checkOut:'17:00', workedMinutes:545 },
  { date:'2026-04-12', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-04-13', status:'absent',      notes:'إجازة سنوية', workedMinutes:0 },
  { date:'2026-04-14', status:'absent',      notes:'إجازة سنوية', workedMinutes:0 },
  { date:'2026-04-15', status:'absent',      notes:'إجازة سنوية', workedMinutes:0 },
  { date:'2026-04-16', status:'absent',      notes:'إجازة سنوية', workedMinutes:0 },
  { date:'2026-04-19', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-04-20', status:'present',     checkIn:'07:58', checkOut:'17:05', workedMinutes:547 },
  { date:'2026-04-21', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-04-22', status:'overtime',    checkIn:'07:30', checkOut:'19:00', overtimeMinutes:120, workedMinutes:690 },
  { date:'2026-04-23', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-04-26', status:'present',     checkIn:'08:02', checkOut:'17:00', workedMinutes:538 },
  { date:'2026-04-27', status:'present',     checkIn:'07:58', checkOut:'17:05', workedMinutes:547 },
  { date:'2026-04-28', status:'late',        checkIn:'08:25', checkOut:'17:00', lateMinutes:25, workedMinutes:515 },
  { date:'2026-04-29', status:'present',     checkIn:'08:00', checkOut:'17:00', workedMinutes:540 },
  { date:'2026-04-30', status:'present',     checkIn:'08:01', checkOut:'17:05', workedMinutes:544 },
];

function buildE1AttendanceSeed(): { events: AttendanceEvent[]; daySummaries: AttendanceDaySummary[] } {
  const EMP_ID = 'e1';
  const EMP_NAME = 'عبدالرحمن المالكي';
  const TPL_ID = 'tpl-s1';
  const events: AttendanceEvent[] = [];
  const daySummaries: AttendanceDaySummary[] = [];

  for (const day of E1_DAYS) {
    const workedMinutes = day.workedMinutes ?? 540;

    daySummaries.push({
      id: `sum-e1-${day.date}`,
      employeeId: EMP_ID,
      employeeName: EMP_NAME,
      date: day.date,
      templateId: TPL_ID,
      status: day.status,
      lateMinutes: day.lateMinutes ?? 0,
      earlyLeaveMinutes: day.earlyLeaveMinutes ?? 0,
      overtimeMinutes: day.overtimeMinutes ?? 0,
      workedMinutes,
      notes: day.notes,
    });

    if (day.checkIn) {
      events.push({
        id: `ev-e1-in-${day.date}`,
        employeeId: EMP_ID,
        employeeName: EMP_NAME,
        date: day.date,
        type: 'check_in',
        at: day.checkIn,
        source: 'device',
      });
    }

    if (day.checkOut) {
      events.push({
        id: `ev-e1-out-${day.date}`,
        employeeId: EMP_ID,
        employeeName: EMP_NAME,
        date: day.date,
        type: 'check_out',
        at: day.checkOut,
        source: 'device',
      });
    }
  }

  return { events, daySummaries };
}

export function buildInitialAttendanceState(): AttendanceSeedState {
  const templates = data.shifts.map(shiftToTemplate);
  const assignments = seedAssignments(templates);
  const baseEvents = seedEventsFromToday(data.employees);
  const baseSummaries = buildSummariesFromTodayJson(data.attendanceToday, (id) => data.employees.find((e) => e.id === id)?.name ?? id);

  const e1Seed = buildE1AttendanceSeed();
  // Merge: remove any today-generated e1 records then add the full e1 dataset
  const events = [
    ...e1Seed.events,
    ...baseEvents.filter((ev) => ev.employeeId !== 'e1'),
  ];
  const daySummaries = [
    ...e1Seed.daySummaries,
    ...baseSummaries.filter((s) => s.employeeId !== 'e1'),
  ];

  return {
    shiftTemplates: templates,
    assignments,
    events,
    daySummaries,
    checkpoints: seedCheckpoints(),
    checkpointLinks: seedLinks(),
  };
}

/** Minutes in a work day from periods (first to last), ignoring breaks for rough planned span */
export function plannedDayMinutes(weekDays: TemplateDayConfig[], dayIndex: WeekDayIndex): number {
  const d = weekDays.find((w) => w.day === dayIndex);
  if (!d || d.isRest || d.periods.length === 0) return 0;
  let min = 24 * 60;
  let max = 0;
  for (const p of d.periods) {
    const a = minutesFromMidnight(p.startTime);
    const b = minutesFromMidnight(p.endTime);
    min = Math.min(min, a);
    max = Math.max(max, b);
  }
  return Math.max(0, max - min);
}
