'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { violationRecordsApi } from '@/features/hr/discipline/lib/api/violation-records';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  disciplineAppealsApi,
  type DisciplineAppealResponseDto,
  type CreateDisciplineAppealDto,
  type UpdateDisciplineAppealDto,
  type ProcessDisciplineAppealDecisionDto,
  type AppealChannelDto,
  type AppealStatusDto,
} from '@/features/hr/discipline/lib/api/discipline-appeals';
import type { HRAppealChannel, HRAppealStatus } from '@/features/hr/discipline/lib/types';
import {
  sendAppealDecisionNotification,
  submitAppealDecision,
} from '@/features/hr/discipline/appeals/services/discipline-appeals.service';

export type AppealEmployee = { id: string; nameAr: string };
export type AppealCase = { id: string; caseNumber: string; employeeId: string; employeeNameAr: string };

export type AppealRecord = {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  caseId: string;
  caseNumber: string;
  date: string;
  channel: HRAppealChannel;
  status: HRAppealStatus;
  grounds: string;
  responseNote: string;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapAppeal(
  dto: DisciplineAppealResponseDto,
  employeesById: Map<string, string>,
): AppealRecord {
  return {
    id: dto.id,
    employeeId: dto.subjectEmployeeId,
    employeeNameAr: employeesById.get(dto.subjectEmployeeId) ?? dto.subjectEmployeeId,
    caseId: dto.violationRecordId,
    caseNumber: dto.linkedViolationRecordNumber,
    date: dto.appealDate,
    channel: (dto.channel ?? 'system') as HRAppealChannel,
    status: dto.status as HRAppealStatus,
    grounds: dto.groundsAr,
    responseNote: dto.responseNote ?? '',
    decidedAt: dto.decidedAt,
    createdAt: typeof dto.createdAt === 'string' ? dto.createdAt : new Date(dto.createdAt).toISOString(),
    updatedAt: typeof dto.updatedAt === 'string' ? dto.updatedAt : new Date(dto.updatedAt).toISOString(),
  };
}

export function useDisciplineAppealsDirectoryModel() {
  const [appeals, setAppeals] = React.useState<AppealRecord[]>([]);
  const [employees, setEmployees] = React.useState<AppealEmployee[]>([]);
  const [cases, setCases] = React.useState<AppealCase[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const reload = React.useCallback(async (filterParams?: {
    employeeId?: string;
    status?: AppealStatusDto;
  }) => {
    setLoading(true);
    setListError(null);
    try {
      const scope = await resolveOrganizationScope();
      const cid = scope.companyId ?? null;
      setCompanyId(cid);

      const appealsQuery = {
        ...(cid ? { companyId: cid } : {}),
        limit: 200,
        ...(filterParams?.employeeId ? { subjectEmployeeId: filterParams.employeeId } : {}),
        ...(filterParams?.status ? { status: filterParams.status } : {}),
      };

      const [employeesRes, recordsRes, appealsRes] = await Promise.all([
        employeesApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
        violationRecordsApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
        disciplineAppealsApi.getAll(appealsQuery),
      ]);

      const employeeMap = new Map(employeesRes.items.map((e) => [e.id, e.nameAr]));
      setEmployees(employeesRes.items.map((e) => ({ id: e.id, nameAr: e.nameAr })));
      setCases(
        recordsRes.items.map((r) => ({
          id: r.id,
          caseNumber: r.recordNumber,
          employeeId: r.employeeId,
          employeeNameAr: employeeMap.get(r.employeeId) ?? r.employeeId,
        })),
      );
      setAppeals(appealsRes.items.map((a) => mapAppeal(a, employeeMap)));
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-appeals.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const createAppeal = React.useCallback(
    async (payload: {
      caseId: string;
      date: string;
      channel: AppealChannelDto;
      grounds: string;
    }) => {
      if (!companyId) throw new Error('تعذر تحديد الشركة');
      const dto: CreateDisciplineAppealDto = {
        companyId,
        violationRecordId: payload.caseId,
        appealDate: payload.date,
        groundsAr: payload.grounds,
        channel: payload.channel,
        status: 'pending',
      };
      await disciplineAppealsApi.create(dto);
      await reload();
    },
    [companyId, reload],
  );

  const updateAppeal = React.useCallback(
    async (id: string, patch: UpdateDisciplineAppealDto) => {
      const updatedBy = useAuthStore.getState().user?.email ?? useAuthStore.getState().user?.id ?? undefined;
      await disciplineAppealsApi.update(id, { ...patch, updatedBy });
      await reload();
    },
    [reload],
  );

  const decideAppeal = React.useCallback(
    async (
      appeal: AppealRecord,
      payload: ProcessDisciplineAppealDecisionDto,
    ): Promise<{ notificationSent: boolean }> => {
      const user = useAuthStore.getState().user;
      const decidedBy = user?.email ?? user?.id ?? undefined;
      await submitAppealDecision(appeal.id, { ...payload, decidedBy });

      let notificationSent = false;
      const cid = companyId ?? getDefaultCompanyId();
      if (cid) {
        try {
          await sendAppealDecisionNotification({
            companyId: cid,
            appealId: appeal.id,
            employeeId: appeal.employeeId,
            caseNumber: appeal.caseNumber,
            status: payload.status,
            responseNote: payload.responseNote?.trim() ?? '',
            triggeredByUserId: user?.id,
            triggeredByNameAr: user?.fullNameAr ?? null,
            createdBy: user?.email ?? user?.id ?? null,
          });
          notificationSent = true;
        } catch {
          notificationSent = false;
        }
      }

      await reload();
      return { notificationSent };
    },
    [companyId, reload],
  );

  const deleteAppeal = React.useCallback(
    async (id: string) => {
      await disciplineAppealsApi.remove(id);
      await reload();
    },
    [reload],
  );

  return {
    appeals,
    employees,
    cases,
    companyId,
    loading,
    listError,
    createAppeal,
    updateAppeal,
    decideAppeal,
    deleteAppeal,
    reload,
  };
}
