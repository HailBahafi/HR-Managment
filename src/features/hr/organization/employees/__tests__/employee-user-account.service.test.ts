import {
  createEmployeeUserAccount,
  resolveCreatedUserId,
} from '@/features/hr/organization/employees/services/employee-user-account.service';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';

jest.mock('@/features/hr/organization/employees/lib/api/employees', () => ({
  employeesApi: {
    createUserAccount: jest.fn(),
  },
}));

const createUserAccount = employeesApi.createUserAccount as jest.Mock;

describe('employee-user-account.service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls POST /hr/employees/user-account via employeesApi', async () => {
    createUserAccount.mockResolvedValue({
      id: 'emp-1',
      userId: 'user-1',
    });

    const result = await createEmployeeUserAccount({
      employeeCode: 'EMP-001',
      companyId: '4002cca8-64fe-428c-9946-c42676dfc0a2',
      email: 'user@company.com',
      password: 'secret12',
    });

    expect(createUserAccount).toHaveBeenCalledWith({
      employeeCode: 'EMP-001',
      companyId: '4002cca8-64fe-428c-9946-c42676dfc0a2',
      email: 'user@company.com',
      password: 'secret12',
    });
    expect(result.userId).toBe('user-1');
  });

  it('resolveCreatedUserId prefers userId then nested user.id', () => {
    expect(resolveCreatedUserId({ userId: 'u1' } as never)).toBe('u1');
    expect(resolveCreatedUserId({ user: { id: 'u2' } } as never)).toBe('u2');
    expect(resolveCreatedUserId({} as never)).toBeNull();
  });
});
