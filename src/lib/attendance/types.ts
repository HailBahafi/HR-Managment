/** HR attendance module — aligned with product spec (shift templates, assignments, daily, checkpoints, links). */

export type WeekDayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type AttendanceSection =
  | 'templates'
  | 'assignment'
  | 'daily'
  | 'checkpoints'
  | 'checkpoint-links';

export interface CheckInWindowConfig {
  beforeStartMinutes: number;
  graceMinutes: number;
  afterStartMinutes: number;
}

export interface CheckOutWindowConfig {
  beforeEndMinutes: number;
  allowedShortageMinutes: number;
  afterEndMinutes: number;
}

export interface ShiftPeriod {
  id: string;
  startTime: string;
  endTime: string;
  breakEnabled: boolean;
  breakStart: string;
  breakEnd: string;
  flexibilityEnabled: boolean;
  flexibilityMinutes: number;
  checkIn: CheckInWindowConfig;
  checkOut: CheckOutWindowConfig;
  checkOutNotRequired: boolean;
  autoOvertime: boolean;
}

export interface TemplateDayConfig {
  day: WeekDayIndex;
  isRest: boolean;
  periods: ShiftPeriod[];
}

export interface ShiftTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  colorHex: string;
  effectiveFrom: string;
  isActive: boolean;
  weekDays: TemplateDayConfig[];
}

export type AssignmentTargetType = 'employee' | 'department' | 'location';

export interface ShiftAssignment {
  id: string;
  templateId: string;
  openShiftHours?: number;
  targetType: AssignmentTargetType;
  targetId: string;
  targetLabel: string;
  effectiveFrom: string;
  batchId?: string;
}

export type AttendanceEventType = 'check_in' | 'check_out';
export type AttendanceEventSource = 'device' | 'manual' | 'gps';

export interface AttendanceEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  type: AttendanceEventType;
  at: string;
  source: AttendanceEventSource;
}

export type DaySummaryStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'early_leave'
  | 'holiday'
  /** قيم قديمة — تُعرض في الواجهة كحاضر/غائب */
  | 'incomplete'
  | 'overtime';

export interface AttendanceDaySummary {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  templateId: string | null;
  status: DaySummaryStatus;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  workedMinutes: number;
  notes?: string;
}

export interface DailyAttendanceSegment {
  id: string;
  label: string;
  startMinutes: number;
  endMinutes: number;
  kind: 'planned' | 'actual';
}

export interface DailyAttendanceVariance {
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
}

export interface DailyAttendanceRow {
  employeeId: string;
  employeeName: string;
  date: string;
  dateRangeDisplay?: string;
  segments: DailyAttendanceSegment[];
  presenceLabel: string;
  variance: DailyAttendanceVariance | null;
}

export interface AttendanceCheckInPoint {
  id: string;
  nameAr: string;
  nameEn?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
}

export interface AttendanceCheckInPointLink {
  id: string;
  employeeId: string;
  checkInPointId: string;
  batchId?: string;
  effectiveFrom?: string;
  linkActive?: boolean;
}
