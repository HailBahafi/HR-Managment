'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { violationTypesApi } from '@/features/hr/discipline/lib/api/violation-types';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import {
  disciplineApprovalTemplatesApi,
  type DisciplineApprovalTemplateResponseDto,
  type CreateDisciplineApprovalTemplateDto,
  type UpdateDisciplineApprovalTemplateDto,
  type ApprovalTemplateStage,
} from '@/features/hr/discipline/lib/api/discipline-approval-templates';

export type { ApprovalTemplateStage };
export type { DisciplineApprovalTemplateResponseDto as ApprovalTemplate };

export type ViolationTypeOption = { id: string; nameAr: string; code: string; isActive: boolean };
export type EmployeeOption = { id: string; nameAr: string; jobTitleAr?: string; status?: string };

export function useDisciplineApprovalTemplatesModel() {
  const [templates, setTemplates] = React.useState<DisciplineApprovalTemplateResponseDto[]>([]);
  const [violationTypes, setViolationTypes] = React.useState<ViolationTypeOption[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeOption[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const scope = await resolveOrganizationScope();
      const cid = scope.companyId ?? null;
      setCompanyId(cid);

      const [templatesRes, typesRes, employeesRes] = await Promise.all([
        disciplineApprovalTemplatesApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
        violationTypesApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
        employeesApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
      ]);

      setTemplates(templatesRes.items);
      setViolationTypes(
        typesRes.items.map((t) => ({ id: t.id, nameAr: t.nameAr, code: t.code, isActive: t.isActive })),
      );
      setEmployees(employeesRes.items.map((e) => ({ id: e.id, nameAr: e.nameAr })));
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-approval-templates.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const createTemplate = React.useCallback(
    async (payload: Omit<CreateDisciplineApprovalTemplateDto, 'companyId'>) => {
      if (!companyId) throw new Error('تعذر تحديد الشركة');
      await disciplineApprovalTemplatesApi.create({ ...payload, companyId });
      await reload();
    },
    [companyId, reload],
  );

  const updateTemplate = React.useCallback(
    async (id: string, patch: UpdateDisciplineApprovalTemplateDto) => {
      await disciplineApprovalTemplatesApi.update(id, patch);
      await reload();
    },
    [reload],
  );

  const deleteTemplate = React.useCallback(
    async (id: string) => {
      await disciplineApprovalTemplatesApi.remove(id);
      await reload();
    },
    [reload],
  );

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
