import {
  resolveAssignmentCompanyContextFromProfile,
  resolveEmployeeCompanyId,
} from '@/features/hr/organization/employees/services/employee-company.service';
import { employeeAssignmentsApi } from '@/features/hr/organization/employees/lib/api/employee-assignments';

jest.mock('@/features/hr/organization/employees/lib/api/employee-assignments', () => ({
  employeeAssignmentsApi: {
    getAll: jest.fn(),
  },
}));

const getAll = employeeAssignmentsApi.getAll as jest.Mock;

describe('resolveAssignmentCompanyContextFromProfile', () => {
  it('uses primary assignment company and label', () => {
    expect(
      resolveAssignmentCompanyContextFromProfile({
        primaryAssignment: {
          id: 'a1',
          companyId: 'c-primary',
          companyNameAr: 'شركة النخيل',
        } as never,
        activeCompanyId: 'c-session',
      }),
    ).toEqual({ companyId: 'c-primary', companyLabel: 'شركة النخيل' });
  });

  it('falls back to active company when no primary assignment', () => {
    expect(
      resolveAssignmentCompanyContextFromProfile({
        primaryAssignment: null,
        activeCompanyId: 'c-session',
      }),
    ).toEqual({ companyId: 'c-session', companyLabel: 'الشركة النشطة' });
  });

  it('returns null when company cannot be resolved', () => {
    expect(
      resolveAssignmentCompanyContextFromProfile({
        primaryAssignment: null,
        activeCompanyId: null,
      }),
    ).toBeNull();
  });
});

describe('resolveEmployeeCompanyId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the primary active assignment company', async () => {
    getAll.mockResolvedValue([
      { id: 'a1', companyId: 'company-secondary', isPrimary: false, status: 'active' },
      { id: 'a2', companyId: 'company-primary', isPrimary: true, status: 'active' },
    ]);

    await expect(resolveEmployeeCompanyId('emp-1')).resolves.toBe('company-primary');
  });

  it('throws when the employee has no assignments', async () => {
    getAll.mockResolvedValue([]);

    await expect(resolveEmployeeCompanyId('emp-1')).rejects.toThrow(
      'لا يوجد تعيين شركة نشط لهذا الموظف',
    );
  });
});
