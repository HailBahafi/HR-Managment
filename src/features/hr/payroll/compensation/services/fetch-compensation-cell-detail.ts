import { employeeAdvancesApi } from '@/features/hr/contracts/lib/api/employee-advances';
import { attendanceEventsApi } from '@/features/hr/attendance/lib/api/attendance-events';
import { enumerateDates } from '@/features/hr/attendance/lib/utils';
import { attendanceDaySummariesApi } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { defaultTimezoneOffsetMinutes } from '@/features/hr/requests/attendance-corrections/lib/correction-period-time';
import { violationRecordsApi } from '@/features/hr/discipline/lib/api/violation-records';
import {
  monthlyInputsApi,
  type MonthlyInputKindDto,
} from '@/features/hr/payroll/lib/api/monthly-inputs';
import type { DailyBreakdownResponseDto } from '@/features/hr/attendance/types/api/attendance-events';
import type {
  CompensationCellDetailContext,
  CompensationCellDetailResult,
} from '@/features/hr/payroll/compensation/lib/compensation-cell-detail';

function isScheduledWorkDay(day: DailyBreakdownResponseDto): boolean {
  return !day.isRestDay && !day.isUnscheduled;
}

async function listPeriodDailyBreakdowns(
  context: CompensationCellDetailContext,
): Promise<DailyBreakdownResponseDto[]> {
  const dates = enumerateDates(context.periodStartDate, context.periodEndDate);
  const timezoneOffsetMinutes = defaultTimezoneOffsetMinutes();

  const results = await Promise.allSettled(
    dates.map((workDate) =>
      attendanceEventsApi.getDailyBreakdown({
        companyId: context.companyId,
        employeeId: context.row.employeeId,
        workDate,
        timezoneOffsetMinutes,
      }),
    ),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<DailyBreakdownResponseDto> => r.status === 'fulfilled')
    .map((r) => r.value)
    .sort((a, b) => a.workDate.localeCompare(b.workDate));
}

async function listMonthlyInputsForEmployee(
  context: CompensationCellDetailContext,
  inputKind: MonthlyInputKindDto | MonthlyInputKindDto[],
) {
  const kinds = Array.isArray(inputKind) ? inputKind : [inputKind];
  const responses = await Promise.all(
    kinds.map((kind) =>
      monthlyInputsApi.list({
        companyId: context.companyId,
        payrollPeriodId: context.periodId,
        employeeId: context.row.employeeId,
        inputKind: kind,
        limit: 200,
      }),
    ),
  );
  return responses.flatMap((res) => res.items);
}

async function listAttendanceDays(context: CompensationCellDetailContext) {
  const res = await attendanceDaySummariesApi.getAll({
    companyId: context.companyId,
    employeeId: context.row.employeeId,
    from: context.periodStartDate,
    to: context.periodEndDate,
    limit: 200,
  });
  return res.items;
}

async function listAbsenceDailyBreakdowns(context: CompensationCellDetailContext) {
  const days = await listPeriodDailyBreakdowns(context);
  return days.filter(
    (day) => day.status === 'absent' && isScheduledWorkDay(day),
  );
}

async function listLatenessDailyBreakdowns(context: CompensationCellDetailContext) {
  const days = await listPeriodDailyBreakdowns(context);
  return days.filter(
    (day) => isScheduledWorkDay(day) && day.totals.lateMinutes > 0,
  );
}

export async function fetchCompensationCellDetail(
  context: CompensationCellDetailContext,
): Promise<CompensationCellDetailResult> {
  const { field } = context;

  if (field === 'baseSalary') return { kind: 'baseSalary' };
  if (field === 'allowances') return { kind: 'allowances' };
  if (field === 'net') return { kind: 'net' };

  if (field === 'advances') {
    const response = await employeeAdvancesApi.list({
      companyId: context.companyId,
      employeeId: context.row.employeeId,
      page: 1,
      limit: 100,
    });
    return {
      kind: 'advances',
      items: response.items,
    };
  }

  if (field === 'absence') {
    const days = await listAbsenceDailyBreakdowns(context);
    return {
      kind: 'absence',
      days,
    };
  }

  if (field === 'lateness') {
    const days = await listLatenessDailyBreakdowns(context);
    return {
      kind: 'lateness',
      days,
    };
  }

  if (field === 'overtime') {
    const days = await listAttendanceDays(context);
    return {
      kind: 'overtime',
      days: days.filter(
        (day) => day.overtimePayrollAllowed && (day.payrollOvertimeMinutes ?? day.overtimeMinutes) > 0,
      ),
    };
  }

  if (field === 'penalties') {
    const violations = await violationRecordsApi.getAll({
      companyId: context.companyId,
      employeeId: context.row.employeeId,
      status: 'approved',
      violationDateFrom: context.periodStartDate,
      violationDateTo: context.periodEndDate,
      limit: 200,
    });
    return {
      kind: 'penalties',
      violations: violations.items,
    };
  }

  if (field === 'bonus') {
    const items = await listMonthlyInputsForEmployee(context, 'bonus');
    return { kind: 'bonus', items };
  }

  const items = await listMonthlyInputsForEmployee(
    context,
    ['other_addition', 'other_deduction', 'gosi_adjustment'],
  );
  return { kind: 'admin', items };
}
