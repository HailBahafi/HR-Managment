'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { violationRecordsApi } from '@/features/hr/discipline/lib/api/violation-records';
import {
  disciplineNoticesApi,
  type DisciplineNoticeResponseDto,
  type CreateDisciplineNoticeDto,
} from '@/features/hr/discipline/lib/api/discipline-notices';
import type { HRDisciplineNoticeKind } from '@/features/hr/discipline/lib/types';

export type NoticeEmployee = { id: string; nameAr: string };
export type NoticeCase = { id: string; caseNumber: string; employeeId: string; employeeNameAr: string };

export type NoticeRecord = {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  kind: HRDisciplineNoticeKind;
  reasonAr: string;
  date: string;
  linkedCaseId: string | null;
  linkedCaseNumber: string | null;
  attachmentsNote: string | null;
  createdAt: string;
  updatedAt: string;
};

const NOTICE_KIND_MAP: Record<string, HRDisciplineNoticeKind> = {
  verbal: 'verbal',
  first: 'first',
  second: 'second',
  final: 'final',
};

function mapNotice(
  dto: DisciplineNoticeResponseDto,
  employeesById: Map<string, string>,
): NoticeRecord {
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    employeeNameAr: employeesById.get(dto.employeeId) ?? dto.employeeId,
    kind: NOTICE_KIND_MAP[dto.noticeKind] ?? 'verbal',
    reasonAr: dto.reasonAr,
    date: dto.noticeDate,
    linkedCaseId: dto.violationRecordId,
    linkedCaseNumber: dto.linkedViolationRecordNumber,
    attachmentsNote: dto.attachmentsNote,
    createdAt: typeof dto.createdAt === 'string' ? dto.createdAt : new Date(dto.createdAt).toISOString(),
    updatedAt: typeof dto.updatedAt === 'string' ? dto.updatedAt : new Date(dto.updatedAt).toISOString(),
  };
}

export function useDisciplineNoticesDirectoryModel() {
  const [notices, setNotices] = React.useState<NoticeRecord[]>([]);
  const [employees, setEmployees] = React.useState<NoticeEmployee[]>([]);
  const [cases, setCases] = React.useState<NoticeCase[]>([]);
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

      const [employeesRes, recordsRes, noticesRes] = await Promise.all([
        employeesApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
        violationRecordsApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
        disciplineNoticesApi.getAll(cid ? { companyId: cid, limit: 200 } : { limit: 200 }),
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
      setNotices(noticesRes.items.map((n) => mapNotice(n, employeeMap)));
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-notices.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const createNotice = React.useCallback(
    async (payload: {
      employeeId: string;
      kind: HRDisciplineNoticeKind;
      reasonAr: string;
      date: string;
      linkedCaseId?: string | null;
      attachmentsNote?: string | null;
    }) => {
      if (!companyId) throw new Error('تعذر تحديد الشركة');
      const dto: CreateDisciplineNoticeDto = {
        companyId,
        employeeId: payload.employeeId,
        noticeKind: payload.kind,
        reasonAr: payload.reasonAr,
        noticeDate: payload.date,
        violationRecordId: payload.linkedCaseId ?? null,
        attachmentsNote: payload.attachmentsNote ?? null,
      };
      await disciplineNoticesApi.create(dto);
      await reload();
    },
    [companyId, reload],
  );

  const deleteNotice = React.useCallback(
    async (id: string) => {
      await disciplineNoticesApi.remove(id);
      await reload();
    },
    [reload],
  );

  return { notices, employees, cases, companyId, loading, listError, createNotice, deleteNotice };
}
