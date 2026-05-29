import {
  resolvePermissionIds,
  resolvePermissionKeys,
} from '@/features/hr/permissions/services/roles.service';
import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';

function makePermission(
  id: string,
  resource: string,
  action: string,
  code?: string,
): PermissionResponseDto {
  return {
    id,
    code: code ?? `hr.${resource}.${action}`,
    nameAr: id,
    nameEn: id,
    nodeType: 'ACTION',
    action,
    resource,
    parentId: null,
    sortOrder: 0,
    isSystem: false,
    status: 'active',
  };
}

const ALL_PERMISSIONS: PermissionResponseDto[] = [
  makePermission('p1', 'employees', 'read'),
  makePermission('p2', 'employees', 'create'),
  makePermission('p3', 'employees', 'update'),
  makePermission('p4', 'employees', 'delete'),
  makePermission('p5', 'payroll', 'read'),
  makePermission('p6', 'payroll', 'approve'),
  // A GROUP node — should be ignored
  { ...makePermission('g1', 'employees', null as unknown as string), nodeType: 'GROUP', action: null, resource: null },
];

describe('resolvePermissionIds', () => {
  it('maps frontend keys to backend permission IDs', () => {
    const ids = resolvePermissionIds(['employees.read', 'payroll.read'], ALL_PERMISSIONS);
    expect(ids).toEqual(expect.arrayContaining(['p1', 'p5']));
    expect(ids).toHaveLength(2);
  });

  it('ignores keys that have no matching backend permission', () => {
    const ids = resolvePermissionIds(['unknown.resource'], ALL_PERMISSIONS);
    expect(ids).toHaveLength(0);
  });

  it('returns all ACTION node IDs for "all"', () => {
    const ids = resolvePermissionIds(['all'], ALL_PERMISSIONS);
    // only ACTION nodes: p1..p6
    expect(ids).toEqual(expect.arrayContaining(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']));
    expect(ids).not.toContain('g1');
  });

  it('returns empty array for empty keys', () => {
    expect(resolvePermissionIds([], ALL_PERMISSIONS)).toHaveLength(0);
  });

  it('falls back to code suffix matching when resource/action are null', () => {
    const p: PermissionResponseDto = {
      id: 'px',
      code: 'hr.attendance.approve',
      nameAr: 'px',
      nameEn: 'px',
      nodeType: 'ACTION',
      action: null,
      resource: null,
      parentId: null,
      sortOrder: 0,
      isSystem: false,
      status: 'active',
    };
    const ids = resolvePermissionIds(['attendance.approve'], [p]);
    expect(ids).toContain('px');
  });
});

describe('resolvePermissionKeys', () => {
  it('maps permission IDs back to frontend resource.action keys', () => {
    const keys = resolvePermissionKeys(['p1', 'p5'], ALL_PERMISSIONS);
    expect(keys).toContain('employees.read');
    expect(keys).toContain('payroll.read');
  });

  it('ignores IDs not found in the permissions list', () => {
    const keys = resolvePermissionKeys(['unknown-id'], ALL_PERMISSIONS);
    expect(keys).toHaveLength(0);
  });

  it('returns empty array for empty IDs', () => {
    expect(resolvePermissionKeys([], ALL_PERMISSIONS)).toHaveLength(0);
  });
});
