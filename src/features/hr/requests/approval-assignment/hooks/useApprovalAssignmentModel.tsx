'use client';

import * as React from 'react';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  requestApprovalTemplatesApi,
  type RequestApprovalTemplateResponseDto,
  type CreateRequestApprovalTemplateDto,
  type UpdateRequestApprovalTemplateDto,
  type RequestApprovalMode,
} from '@/features/hr/requests/lib/api/approval-templates';
import { requestTypesApi, type ApiRequestType } from '@/features/hr/requests/lib/api/request-types';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

export type { RequestApprovalTemplateResponseDto as ApprovalTemplate };
export type { RequestApprovalMode };
export type { ApiRequestType as RequestTypeOption };

export function useApprovalAssignmentModel() {
  const companyId = useAuthStore((s) => s.activeCompanyId);
  const [templates, setTemplates] = React.useState<RequestApprovalTemplateResponseDto[]>([]);
  const [requestTypes, setRequestTypes] = React.useState<ApiRequestType[]>([]);
  const [employees, setEmployees] = React.useState<{ id: string; nameAr: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const reload = React.useCallback(async (params?: { isActive?: boolean }) => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    setListError(null);
    try {
      const [tplRes, rtRes, empRes] = await Promise.all([
        requestApprovalTemplatesApi.getAll({ companyId, limit: 200, ...params }),
        requestTypesApi.list({ companyId, limit: 200 }),
        employeesApi.getAll({ companyId, limit: 500 }),
      ]);
      setTemplates(tplRes.items);
      setRequestTypes(rtRes.items);
      setEmployees(empRes.items.map((e) => ({ id: e.id, nameAr: e.nameAr })));
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'request-approval-assignments.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => { void reload(); }, [reload]);

  const createTemplate = React.useCallback(
    async (payload: Omit<CreateRequestApprovalTemplateDto, 'companyId'>) => {
      if (!companyId) throw new Error('no company');
      const res = await requestApprovalTemplatesApi.create({ ...payload, companyId });
      setTemplates((prev) => [...prev, res]);
      return res;
    },
    [companyId],
  );

  const updateTemplate = React.useCallback(
    async (id: string, patch: UpdateRequestApprovalTemplateDto) => {
      const res = await requestApprovalTemplatesApi.update(id, patch);
      setTemplates((prev) => prev.map((t) => (t.id === id ? res : t)));
      return res;
    },
    [],
  );

  const deleteTemplate = React.useCallback(async (id: string) => {
    await requestApprovalTemplatesApi.remove(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    templates,
    requestTypes,
    employees,
    loading,
    listError,
    reload,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
