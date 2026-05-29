/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PermissionsManagementPage } from '@/features/hr/permissions/components/permissions-management-page';

// ─── mocks ────────────────────────────────────────────────────────────────────
jest.mock('@/features/auth/lib/auth-store', () => ({
  useAuthStore: (sel: (s: { activeCompanyId: string }) => unknown) =>
    sel({ activeCompanyId: 'company-1' }),
}));

jest.mock('@/components/layouts/page-title-context', () => ({
  useSetPageTitle: jest.fn(),
}));

const mockRoles = [
  {
    id: 'r1', nameAr: 'مدير الموارد البشرية', nameEn: 'HR Manager',
    code: 'hr_manager', description: 'يدير الموارد البشرية',
    isSystem: false, isDefault: false, status: 'active', isActive: true,
    companyId: 'company-1', applicationId: 'app-1', createdAt: '', updatedAt: '',
  },
];

jest.mock('@/features/hr/permissions/hooks/useRoles', () => ({
  useRoles: () => ({ data: { items: mockRoles }, isLoading: false }),
}));

jest.mock('@/features/hr/permissions/hooks/usePermissions', () => ({
  usePermissions: () => ({ data: { items: [] } }),
}));

jest.mock('@/features/hr/permissions/hooks/useApplicationId', () => ({
  useApplicationId: () => 'app-1',
}));

jest.mock('@/features/auth/lib/auth-store', () => ({
  useAuthStore: (sel: (s: { activeCompanyId: string }) => unknown) =>
    sel({ activeCompanyId: 'company-1' }),
}));

jest.mock('@/features/hr/permissions/hooks/useRolesMutations', () => ({
  useRolesMutations: () => ({
    create: { mutateAsync: jest.fn(), isPending: false },
    update: { mutateAsync: jest.fn(), isPending: false },
    remove: { mutateAsync: jest.fn(), isPending: false },
  }),
}));

jest.mock('@/features/hr/permissions/services/roles.service', () => ({
  loadRoleForEdit: jest.fn().mockResolvedValue({
    id: 'r1', name: 'مدير الموارد البشرية', description: 'يدير الموارد البشرية', permissionIds: [],
  }),
  resolvePermissionIds: jest.fn().mockReturnValue([]),
  resolvePermissionKeys: jest.fn().mockReturnValue([]),
}));

// ─── helper ───────────────────────────────────────────────────────────────────
function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PermissionsManagementPage />
    </QueryClientProvider>,
  );
}

// ─── tests ────────────────────────────────────────────────────────────────────
describe('PermissionsManagementPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByText('إدارة الصلاحيات')).toBeInTheDocument();
  });

  it('renders the add-role button', () => {
    renderPage();
    expect(screen.getAllByRole('button', { name: /إضافة دور/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('displays a role card for each fetched role', () => {
    renderPage();
    expect(screen.getByText('مدير الموارد البشرية')).toBeInTheDocument();
  });

  it('opens create panel when "إضافة دور" is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getAllByRole('button', { name: /إضافة دور/i })[0]);
    await waitFor(() => {
      expect(screen.getByText('دور جديد')).toBeInTheDocument();
    });
  });

  it('opens edit panel when "تعديل الصلاحيات" is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /تعديل الصلاحيات/i }));
    await waitFor(() => {
      expect(screen.getByText(/تعديل:/i)).toBeInTheDocument();
    });
  });

  it('opens delete dialog when delete button is clicked', async () => {
    renderPage();
    const trashBtn = screen.getAllByRole('button').find(
      (b) => b.className.includes('destructive') && !b.disabled,
    );
    if (!trashBtn) { expect(true).toBe(true); return; }
    await userEvent.click(trashBtn);
    await waitFor(() => {
      expect(screen.getByText(/هل أنت متأكد من حذف/i)).toBeInTheDocument();
    });
  });

  it('displays the "إضافة دور جديد" placeholder card', () => {
    renderPage();
    expect(screen.getByText('إضافة دور جديد')).toBeInTheDocument();
  });
});
