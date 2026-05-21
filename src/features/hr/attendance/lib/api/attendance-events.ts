import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type AttendanceEventType = 'check_in' | 'check_out' | 'break_start' | 'break_end';
export type AttendanceEventSource = 'manual' | 'qr' | 'biometric' | 'mobile_app' | 'api';

export type AttendanceEventResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string;
  workDate: string;
  eventType: AttendanceEventType;
  occurredAt: string;
  source: AttendanceEventSource | null;
  checkInPointId: string | null;
  checkInPointNameAr: string | null;
  shiftAssignmentId: string | null;
  latitude: string | null;
  longitude: string | null;
  distanceMeters: number | null;
  withinRadius: boolean | null;
  periodSortOrder: number | null;
  notes: string | null;
  isVoided: boolean;
  voidReason: string | null;
  voidedAt: string | null;
  recordedBy: string | null;
  createdAt: string;
};

export type AttendanceEventListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  workDateFrom?: string;
  workDateTo?: string;
  eventType?: AttendanceEventType;
  source?: AttendanceEventSource;
  checkInPointId?: string;
  includeVoided?: boolean;
};

export type CreateAttendanceEventDto = {
  companyId: string;
  employeeId: string;
  eventType: AttendanceEventType;
  occurredAt: string;
  workDate: string;
  source?: string;
  checkInPointId?: string | null;
  shiftAssignmentId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceMeters?: number | null;
  withinRadius?: boolean | null;
  periodSortOrder?: number | null;
  notes?: string | null;
  recordedBy?: string | null;
};

export const attendanceEventsApi = {
  getAll(query?: AttendanceEventListQuery) {
    return apiRequest<PaginatedResult<AttendanceEventResponseDto>>('/attendance/events', { query });
  },
  getById(id: string) {
    return apiRequest<AttendanceEventResponseDto>(`/attendance/events/${id}`);
  },
  create(payload: CreateAttendanceEventDto) {
    return apiRequest<AttendanceEventResponseDto>('/attendance/events', { method: 'POST', body: payload });
  },
  void(id: string, voidReason: string) {
    return apiRequest<AttendanceEventResponseDto>(`/attendance/events/${id}/void`, {
      method: 'PATCH',
      body: { voidReason },
    });
  },
};
