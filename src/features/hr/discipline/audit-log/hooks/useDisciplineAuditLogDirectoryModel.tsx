'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { auditLogsApi, type AuditLogResponseDto } from '@/features/hr/discipline/lib/api/audit-logs';
import type { HRDisciplineAuditCategory, HRDisciplineAuditAction } from '@/features/hr/discipline/lib/discipline-audit-log';

const DISCIPLINE_ENTITY_CONTAINS = 'hr_job_discipline_';

/** categories other than these map to the shared 'violation_case' bucket */
const CATEGORY_TO_ENTITY_NAMES: Record<HRDisciplineAuditCategory, string[] | null> = {
  investigation: ['hr_job_discipline_investigations'],
  appeal: ['hr_job_discipline_appeals'],
  violation_case: [
    'hr_job_discipline_violation_records',
    'hr_job_discipline_notices',
    'hr_job_discipline_circulars',
    'hr_job_discipline_payroll_deductions',
    'hr_job_discipline_approval_templates',
  ],
};

const ACTION_TYPE_TO_RAW: Record<HRDisciplineAuditAction, string[]> = {
  create: ['CREATE'],
  update: ['UPDATE', 'PATCH'],
  delete: ['DELETE', 'REMOVE'],
  submit: ['SUBMIT'],
  approve: ['APPROVE'],
  reject: ['REJECT'],
  request_edit: ['REQUEST_EDIT'],
  payroll_posted: ['PAYROLL_POSTED'],
};

const ENTITY_TO_CATEGORY: Record<string, HRDisciplineAuditCategory> = {
  hr_job_discipline_violation_records: 'violation_case',
  hr_job_discipline_notices: 'violation_case',
  hr_job_discipline_investigations: 'investigation',
  hr_job_discipline_appeals: 'appeal',
};

function mapAction(action: string): HRDisciplineAuditAction {
  const upper = action.toUpperCase();
  if (upper === 'CREATE') return 'create';
  if (upper === 'UPDATE' || upper === 'PATCH') return 'update';
  if (upper === 'DELETE' || upper === 'REMOVE') return 'delete';
  if (upper === 'SUBMIT') return 'submit';
  if (upper === 'APPROVE') return 'approve';
  if (upper === 'REJECT') return 'reject';
  if (upper === 'REQUEST_EDIT') return 'request_edit';
  if (upper === 'PAYROLL_POSTED') return 'payroll_posted';
  return 'update';
}

function mapCategory(entityName: string): HRDisciplineAuditCategory {
  return ENTITY_TO_CATEGORY[entityName] ?? 'violation_case';
}

export type AuditLogEntry = {
  id: string;
  occurredAt: string;
  actorNameAr: string;
  category: HRDisciplineAuditCategory;
  actionType: HRDisciplineAuditAction;
  recordId: string;
  recordRefAr: string;
  recordStatusAfterAr: string;
  previousSnapshotAr: string;
  currentSnapshotAr: string;
};

export type AuditLogListFilters = {
  q: string;
  catFilter: 'all' | HRDisciplineAuditCategory;
  selectedActorIds: string[];
  statusFilter: 'all' | HRDisciplineAuditAction;
  dateFrom: string;
  dateTo: string;
};

const DEFAULT_LIST_FILTERS: AuditLogListFilters = {
  q: '',
  catFilter: 'all',
  selectedActorIds: [],
  statusFilter: 'all',
  dateFrom: '',
  dateTo: '',
};

function dtoToEntry(dto: AuditLogResponseDto): AuditLogEntry {
  const prev = dto.oldValues ? JSON.stringify(dto.oldValues, null, 2) : '';
  const next = dto.newValues ? JSON.stringify(dto.newValues, null, 2) : '';
  return {
    id: dto.id,
    occurredAt: typeof dto.occurredAt === 'string' ? dto.occurredAt : new Date(dto.occurredAt).toISOString(),
    actorNameAr: dto.actorName ?? dto.actorEmail ?? 'غير محدد',
    category: mapCategory(dto.entityName),
    actionType: mapAction(dto.action),
    recordId: dto.entityId ?? dto.id,
    recordRefAr: dto.entityDisplayName ?? dto.entityId ?? '—',
    recordStatusAfterAr: dto.description ?? dto.actionNameAr ?? dto.action,
    previousSnapshotAr: prev,
    currentSnapshotAr: next,
  };
}

export function useDisciplineAuditLogDirectoryModel() {
  const [listFilters, setListFilters] = React.useState<AuditLogListFilters>(DEFAULT_LIST_FILTERS);
  const [actorPickerList, setActorPickerList] = React.useState<{ id: string; name: string }[]>([]);
  const [listError, setListError] = React.useState<string | null>(null);

  const companyIdRef = React.useRef<string | undefined>(undefined);
  const actorDirLoadedRef = React.useRef(false);
  const actorDirLoadingRef = React.useRef(false);

  const buildListQuery = React.useCallback((page: number, pageSize: number) => ({
    page,
    limit: pageSize,
    ...(companyIdRef.current ? { companyId: companyIdRef.current } : {}),
    entityNameContains: DISCIPLINE_ENTITY_CONTAINS,
    ...(listFilters.q.trim() ? { search: listFilters.q.trim() } : {}),
    ...(listFilters.catFilter !== 'all' && CATEGORY_TO_ENTITY_NAMES[listFilters.catFilter]
      ? { entityNames: CATEGORY_TO_ENTITY_NAMES[listFilters.catFilter] as string[] }
      : {}),
    ...(listFilters.selectedActorIds.length > 0 ? { actorNames: listFilters.selectedActorIds } : {}),
    ...(listFilters.statusFilter !== 'all' ? { actions: ACTION_TYPE_TO_RAW[listFilters.statusFilter] } : {}),
    ...(listFilters.dateFrom ? { occurredFrom: listFilters.dateFrom } : {}),
    ...(listFilters.dateTo ? { occurredTo: listFilters.dateTo } : {}),
  }), [listFilters]);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    setListError(null);
    try {
      if (companyIdRef.current === undefined) {
        const scope = await resolveOrganizationScope();
        companyIdRef.current = scope.companyId ?? undefined;
      }
      const res = await auditLogsApi.getAll(buildListQuery(page, pageSize));
      const items = res.items.map(dtoToEntry);
      return { items, total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'audit-logs.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [buildListQuery]);

  const {
    items,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<AuditLogEntry>(loadPage, {
    resetDeps: [
      listFilters.q,
      listFilters.catFilter,
      listFilters.selectedActorIds.join(','),
      listFilters.statusFilter,
      listFilters.dateFrom,
      listFilters.dateTo,
    ],
  });

  // Lazily loads a bounded, recent window of actor names for the filter picker
  // (there is no dedicated distinct-actors endpoint — this is an approximation,
  // not an exhaustive list of every actor that has ever appeared in the log).
  const loadActorDirectory = React.useCallback(async () => {
    if (actorDirLoadedRef.current || actorDirLoadingRef.current) return;
    actorDirLoadingRef.current = true;
    try {
      if (companyIdRef.current === undefined) {
        const scope = await resolveOrganizationScope();
        companyIdRef.current = scope.companyId ?? undefined;
      }
      const res = await auditLogsApi.getAll({
        ...(companyIdRef.current ? { companyId: companyIdRef.current } : {}),
        entityNameContains: DISCIPLINE_ENTITY_CONTAINS,
        page: 1,
        limit: 500,
      });
      const names = new Set<string>();
      for (const dto of res.items) {
        const name = (dto.actorName ?? dto.actorEmail ?? '').trim();
        if (name) names.add(name);
      }
      setActorPickerList(
        [...names].sort((a, b) => a.localeCompare(b, 'ar')).map((name) => ({ id: name, name })),
      );
      actorDirLoadedRef.current = true;
    } catch {
      // actor picker is optional — page still works without it
    } finally {
      actorDirLoadingRef.current = false;
    }
  }, []);

  // Server applies all list filters now; kept as aliases for existing consumers.
  const filteredItems = items;
  const dateFilteredItems = items;
  const searchFilteredItems = items;

  return {
    items,
    filteredItems,
    dateFilteredItems,
    searchFilteredItems,
    allEntries: items,
    actorPickerList,
    loading,
    pagination,
    listError,
    listFilters,
    setListFilters,
    loadActorDirectory,
    reload,
  };
}
