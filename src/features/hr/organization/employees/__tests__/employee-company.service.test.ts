import { resolveEmployeeCompanyId } from '@/features/hr/organization/employees/services/employee-company.service';
import { employeeAssignmentsApi } from '@/features/hr/organization/employees/lib/api/employee-assignments';

jest.mock('@/features/hr/organization/employees/lib/api/employee-assignments', () => ({
  employeeAssignmentsApi: {
    getAll: jest.fn(),
  },
}));

const getAll = employeeAssignmentsApi.getAll as jest.Mock;

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
