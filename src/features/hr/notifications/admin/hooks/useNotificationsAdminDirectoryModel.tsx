'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import {
  notificationsApi,
  type SendNotificationDto,
} from '@/features/hr/notifications/lib/api/notifications';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { departmentsApi } from '@/features/hr/organization/lib/api/departments';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import type { HRAdminNotificationRecord } from '@/features/hr/notifications/admin/constants/notification-labels';
import {
  mapSentNotification,
  NOTIFICATION_AUDIENCE_LABELS,
} from '@/features/hr/notifications/admin/constants/notification-labels';
import type { NotificationAudienceKind } from '@/features/hr/notifications/lib/api/notifications';

const PAGE_LIMIT = 200;

function audienceSummaryFromSnapshot(
  kind: NotificationAudienceKind,
  snapshot: Record<string, unknown> | null,
): string {
  if (snapshot && typeof snapshot.summaryAr === 'string' && snapshot.summaryAr) {
    return snapshot.summaryAr;
  }
  return NOTIFICATION_AUDIENCE_LABELS[kind] ?? kind;
}

export function useNotificationsAdminDirectoryModel() {
  const [notifications, setNotifications] = React.useState<HRAdminNotificationRecord[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [branchOptions, setBranchOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [departmentOptions, setDepartmentOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [employeeOptions, setEmployeeOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const scope = await resolveOrganizationScope();
      const resolvedCompanyId = scope.companyId ?? null;
      setCompanyId(resolvedCompanyId);

      const [branchesRes, departmentsRes, employeesRes, notifRes] = await Promise.all([
        branchesApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
        ),
        departmentsApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
        ),
        employeesApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
        ),
        notificationsApi.list({
          companyId: resolvedCompanyId ?? undefined,
          limit: PAGE_LIMIT,
          excludeExpired: true,
        }),
      ]);

      setBranchOptions(
        ensurePaginatedResult(branchesRes).items.map((b) => ({ value: b.id, label: b.nameAr })),
      );
      setDepartmentOptions(
        ensurePaginatedResult(departmentsRes).items.map((d) => ({ value: d.id, label: d.nameAr })),
      );
      setEmployeeOptions(
        ensurePaginatedResult(employeesRes).items.map((e) => ({
          value: e.id,
          label: e.nameAr ?? e.nameEn ?? e.id,
        })),
      );

      setNotifications(
        ensurePaginatedResult(notifRes).items.map((row) =>
          mapSentNotification(
            row,
            audienceSummaryFromSnapshot(row.audienceKind, row.audienceSnapshot),
          ),
        ),
      );
    } catch (e) {
      setListError(handleApiError(e).displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const sendNotification = React.useCallback(
    async (dto: SendNotificationDto) => {
      await notificationsApi.send(dto);
      await reload();
    },
    [reload],
  );

  const deleteNotification = React.useCallback(
    async (id: string) => {
      await notificationsApi.delete(id);
      await reload();
    },
    [reload],
  );

  return {
    notifications,
    companyId,
    branchOptions,
    departmentOptions,
    employeeOptions,
    loading,
    listError,
    reload,
    sendNotification,
    deleteNotification,
  };
}
