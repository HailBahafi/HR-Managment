import {
  scopeToHrApplication,
} from '@/features/hr/permissions/hooks/usePermissions';
import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';

function makePerm(
  id: string,
  code: string,
  applicationId: string,
): PermissionResponseDto {
  return {
    id,
    applicationId,
    code,
    nameAr: id,
    nameEn: id,
    nodeType: 'ACTION',
    action: 'read',
    resource: 'employees',
    parentId: null,
    sortOrder: 0,
    isSystem: true,
    status: 'active',
  };
}

describe('scopeToHrApplication', () => {
  const hrAppId = '4002cca8-64fe-428c-9946-c42676dfc0a2';
  const wrongAppId = '00000000-0000-4000-8000-000000000001';

  it('returns hr.* permissions even when application hint does not match', () => {
    const all = [
      makePerm('p1', 'hr.employees.read', hrAppId),
      makePerm('p2', 'other.app.read', wrongAppId),
    ];

    const { items, resolvedApplicationId } = scopeToHrApplication(all, wrongAppId);

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('p1');
    expect(resolvedApplicationId).toBe(hrAppId);
  });

  it('narrows to application hint when it matches hr permissions', () => {
    const all = [
      makePerm('p1', 'hr.employees.read', hrAppId),
      makePerm('p2', 'hr.companies.read', hrAppId),
    ];

    const { items } = scopeToHrApplication(all, hrAppId);
    expect(items).toHaveLength(2);
  });
});
