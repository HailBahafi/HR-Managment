import { ApiError } from '@/features/hr/lib/api/client';
import {
  disciplineApprovalTemplatesApi,
  type DisciplineApprovalTemplateResponseDto,
} from '@/features/hr/discipline/lib/api/discipline-approval-templates';

export type ViolationApprovalAccessResult =
  | { ok: true; assignment: DisciplineApprovalTemplateResponseDto }
  | { ok: false; message: string };

export function isEmployeeAmongViolationApprovers(
  assignment: DisciplineApprovalTemplateResponseDto,
  employeeId: string,
): boolean {
  return assignment.approvers.some((a) => a.employeeId === employeeId);
}

export async function checkViolationApprovalAccess(
  violationTypeId: string,
  employeeId: string | null | undefined,
): Promise<ViolationApprovalAccessResult> {
  if (!employeeId) {
    return {
      ok: false,
      message: 'لم يتم ربط حسابك بسجل موظف؛ لا يمكنك اعتماد أو رفض المخالفات.',
    };
  }

  try {
    const assignment = await disciplineApprovalTemplatesApi.getByViolationType(violationTypeId);

    if (!assignment.isActive) {
      return {
        ok: false,
        message: 'إسناد الموافقة غير نشط لهذا النوع من المخالفات.',
      };
    }

    if (!isEmployeeAmongViolationApprovers(assignment, employeeId)) {
      return {
        ok: false,
        message: 'أنت لست ضمن المعتمدين المسندين لهذا النوع من المخالفات.',
      };
    }

    return { ok: true, assignment };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return {
        ok: false,
        message: 'لا يوجد إسناد موافقة لهذا النوع من المخالفات.',
      };
    }
    throw err;
  }
}
