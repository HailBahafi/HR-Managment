import type { EmployeeAuditRowInput } from '@/lib/employee-audit-log/types';
import { useEmployeeAuditLogStore } from '@/lib/employee-audit-log/store';

export function appendEmployeeAudit(targetEmployeeId: string, rows: EmployeeAuditRowInput[]) {
  useEmployeeAuditLogStore.getState().append(targetEmployeeId, rows);
}
