'use client';

import * as React from 'react';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { violationTypesApi } from '@/features/hr/discipline/lib/api/violation-types';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { disciplineApprovalTemplatesApi } from '@/features/hr/discipline/lib/api/discipline-approval-templates';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type {
  DisciplineApprovalTemplateResponseDto,
  CreateDisciplineApprovalTemplateDto,
  UpdateDisciplineApprovalTemplateDto,
  ApprovalMode,
} from '@/features/hr/discipline/lib/api/discipline-approval-templates';

export type { DisciplineApprovalTemplateResponseDto as ApprovalTemplate };
export type { ApprovalMode };

export type ViolationTypeOption = { id: string; nameAr: string; code: string; isActive: boolean };
export type EmployeeOption = { id: string; nameAr: string };

export function useDisciplineApprovalTemplatesModel() {
  const [templates, setTemplates] = React.useState<DisciplineApprovalTemplateResponseDto[]>([]);
  const [violationTypes, setViolationTypes] = React.useState<ViolationTypeOption[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const companyId = useAuthStore((s) => s.activeCompanyId);

  const reload = React.useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    setListError(null);
    try {
      const [tplRes, typesRes, empRes] = await Promise.all([
        disciplineApprovalTemplatesApi.getAll({ companyId, limit: 200 }),
        violationTypesApi.getAll({ companyId, limit: 200 }),
        employeesApi.getAll({ companyId, limit: 500 }),
      ]);
      setTemplates(tplRes.items);
      setViolationTypes(
        typesRes.items.map((t) => ({ id: t.id, nameAr: t.nameAr, code: t.code, isActive: t.isActive })),
      );
      setEmployees(empRes.items.map((e) => ({ id: e.id, nameAr: e.nameAr })));
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-approval-assignments.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => { void reload(); }, [reload]);

  const createTemplate = React.useCallback(
    async (payload: Omit<CreateDisciplineApprovalTemplateDto, 'companyId'>) => {
      if (!companyId) throw new Error('no company');
      const res = await disciplineApprovalTemplatesApi.create({ ...payload, companyId });
      setTemplates((prev) => [...prev, res]);
      return res;
    },
    [companyId],
  );

  const updateTemplate = React.useCallback(
    async (id: string, patch: UpdateDisciplineApprovalTemplateDto) => {
      const res = await disciplineApprovalTemplatesApi.update(id, patch);
      setTemplates((prev) => prev.map((t) => (t.id === id ? res : t)));
      return res;
    },
    [],
  );

  const deleteTemplate = React.useCallback(async (id: string) => {
    await disciplineApprovalTemplatesApi.remove(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    templates,
    violationTypes,
    employees,
    companyId,
    loading,
    listError,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
