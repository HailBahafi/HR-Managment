import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { AttendanceDayStatus, DaySummaryResponseDto, DaySummaryListQuery, UpdateDaySummaryDto, RecomputeDto, RecomputeResult, PushToPayrollDto, PushToPayrollResult } from '@/features/hr/attendance/types/api/attendance-day-summaries';
export type { AttendanceDayStatus, DaySummaryResponseDto, DaySummaryListQuery, UpdateDaySummaryDto, RecomputeDto, RecomputeResult, PushToPayrollDto, PushToPayrollResult } from '@/features/hr/attendance/types/api/attendance-day-summaries';









export const attendanceDaySummariesApi = {
  getAll(query?: DaySummaryListQuery) {
    return apiRequest<PaginatedResult<DaySummaryResponseDto>>('/attendance/day-summaries', { query });
  },
  getById(id: string) {
    return apiRequest<DaySummaryResponseDto>(`/attendance/day-summaries/${id}`);
  },
  update(id: string, payload: UpdateDaySummaryDto) {
    return apiRequest<DaySummaryResponseDto>(`/attendance/day-summaries/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/attendance/day-summaries/${id}`, { method: 'DELETE' });
  },
  recompute(payload: RecomputeDto) {
    return apiRequest<RecomputeResult>('/attendance/day-summaries/recompute', {
      method: 'POST',
      body: payload,
    });
  },
  pushToPayroll(payload: PushToPayrollDto) {
    return apiRequest<PushToPayrollResult>('/attendance/day-summaries/push-to-payroll', {
      method: 'POST',
      body: payload,
    });
  },
};

