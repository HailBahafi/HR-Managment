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
  const days: WeekDayIndex[] = [0, 1, 2, 3, 4, 5, 6];
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

export function buildInitialAttendanceState(): AttendanceSeedState {
  const templates = data.shifts.map(shiftToTemplate);
  const assignments = seedAssignments(templates);
  const events = seedEventsFromToday(data.employees);
  const daySummaries = buildSummariesFromTodayJson(data.attendanceToday, (id) => data.employees.find((e) => e.id === id)?.name ?? id);
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
