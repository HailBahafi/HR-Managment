'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/features/hr/organization/lib/api/users';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { Employee } from '@/features/hr/organization/employees/types';

export function useEmployeeCreateUser(
  employee: Employee,
  onUserCreated?: (userId: string) => void,
) {
  const qc = useQueryClient();
  const companyId = useAuthStore((s) => s.activeCompanyId);
  const [createUserOpen, setCreateUserOpen] = React.useState(false);
  const [createUserEmail, setCreateUserEmail] = React.useState(employee.email ?? '');
  const [createUserPassword, setCreateUserPassword] = React.useState('');

  React.useEffect(() => {
    if (createUserOpen) {
      setCreateUserEmail(employee.email ?? '');
      setCreateUserPassword('');
    }
  }, [createUserOpen, employee.email]);

  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!createUserEmail.trim()) throw new Error('البريد الإلكتروني مطلوب');
      if (createUserPassword.length < 6) throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return usersApi.create({
        email: createUserEmail.trim().toLowerCase(),
        password: createUserPassword,
        fullNameAr: employee.name || null,
        fullNameEn: employee.nameEn || null,
        phone: employee.phone || null,
        employeeId: employee.id,
        defaultCompanyId: companyId ?? null,
        userType: 'internal_employee',
        isActive: true,
      });
    },
    onSuccess: (user) => {
      toast.success('تم إنشاء حساب المستخدم وربطه بالموظف بنجاح');
      setCreateUserPassword('');
      setCreateUserOpen(false);
      onUserCreated?.(user.id);
      void qc.invalidateQueries({ queryKey: ['user-roles', user.id] });
      void qc.invalidateQueries({ queryKey: ['user-permissions', user.id] });
    },
    onError: (err) => handleApiError(err, 'user.create'),
  });

  return {
    createUserOpen,
    setCreateUserOpen,
    createUserEmail,
    setCreateUserEmail,
    createUserPassword,
    setCreateUserPassword,
    isCreatingUser: createUserMutation.isPending,
    handleCreateUser: () => createUserMutation.mutate(),
  };
}

export type EmployeeCreateUserModel = ReturnType<typeof useEmployeeCreateUser>;
