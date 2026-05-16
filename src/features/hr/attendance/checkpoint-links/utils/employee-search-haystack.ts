import { data } from '@/features/hr/lib/data';
import type { ContractStatus, ContractType } from '@/features/hr/contracts/types';
import {
  CONTRACT_STATUS_AR,
  CONTRACT_TYPE_AR,
} from '@/features/hr/attendance/checkpoint-links/constants/checkpoint-links-panel';

type DataEmployee = (typeof data.employees)[number];

export function employeeSearchHaystack(e: DataEmployee): string {
  const branch = data.branches.find((b) => b.id === e.branchId);
  const dept = data.departments.find((d) => d.id === e.departmentId);
  const ext = e as DataEmployee & {
    openStream?: string;
    village?: string;
    district?: string;
    city?: string;
    neighborhood?: string;
  };
  const addressTokens = (e.address ?? '')
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const st = e.contractStatus as ContractStatus;
  const ct = e.contractType as ContractType;
  return [
    e.name,
    e.employeeCode,
    e.email,
    e.phone,
    e.nationality,
    e.position,
    e.address,
    e.nationalId,
    e.contractStatus,
    CONTRACT_STATUS_AR[st] ?? '',
    e.contractType,
    CONTRACT_TYPE_AR[ct] ?? '',
    branch?.name,
    branch?.city,
    dept?.name,
    ext.openStream,
    ext.village,
    ext.district,
    ext.city,
    ext.neighborhood,
    ...addressTokens,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
