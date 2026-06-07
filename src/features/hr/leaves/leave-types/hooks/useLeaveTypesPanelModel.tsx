'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { HRLeaveTypeRecord } from '@/features/hr/leaves/leave-types/types';
import { slugify } from '@/features/hr/requests/lib/types';
import {
  createLeaveType,
  deleteLeaveType,
  loadLeaveTypes,
  updateLeaveType,
} from '@/features/hr/leaves/leave-types/services/leave-types.service';

export type LeaveTypeDraft = Omit<HRLeaveTypeRecord, 'id' | 'updatedAt'>;

const EMPTY_DRAFT: LeaveTypeDraft = {
  code: '',
  nameAr: '',
  nameEn: '',
  paid: true,
  deductsFromBalance: true,
  requiresApproval: true,
  maxDaysPerRequest: null,
  sortOrder: 0,
  isActive: true,
};

export function useLeaveTypesPanelModel() {
  const [items, setItems] = React.useState<HRLeaveTypeRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<LeaveTypeDraft>(EMPTY_DRAFT);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await loadLeaveTypes();
      setItems(data.items);
      setCompanyId(data.companyId);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'leave-types.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const sorted = React.useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  );

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setDraft({ ...EMPTY_DRAFT, sortOrder: items.length + 1 });
    setError(null);
    setOpen(true);
  }, [items.length]);

  const openEdit = React.useCallback((item: HRLeaveTypeRecord) => {
    setEditId(item.id);
    setDraft({
      code: item.code,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      paid: item.paid,
      deductsFromBalance: item.deductsFromBalance,
      requiresApproval: item.requiresApproval,
      maxDaysPerRequest: item.maxDaysPerRequest,
      sortOrder: item.sortOrder,
      isActive: true,
    });
    setError(null);
    setOpen(true);
  }, []);

  const patch = React.useCallback(<K extends keyof LeaveTypeDraft>(k: K, v: LeaveTypeDraft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
  }, []);

  const save = React.useCallback(async () => {
    if (!draft.nameAr.trim()) {
      setError('الاسم مطلوب');
      return;
    }
    if (!companyId) {
      setError('تعذر تحديد الشركة');
      return;
    }
    setError(null);
    try {
      const nameAr = draft.nameAr.trim();
      if (editId) {
        await updateLeaveType(editId, {
          nameAr,
          nameEn: nameAr,
          paid: draft.paid,
          deductsFromBalance: draft.deductsFromBalance,
          requiresApproval: draft.requiresApproval,
          maxDaysPerRequest: draft.maxDaysPerRequest,
          sortOrder: draft.sortOrder,
          isActive: true,
        });
      } else {
        await createLeaveType({
          companyId,
          code: slugify(nameAr) || `lt-${Date.now().toString(36)}`,
          nameAr,
          nameEn: nameAr,
          paid: draft.paid,
          deductsFromBalance: draft.deductsFromBalance,
          requiresApproval: draft.requiresApproval,
          maxDaysPerRequest: draft.maxDaysPerRequest,
          sortOrder: draft.sortOrder,
          isActive: true,
        });
      }
      await reload();
      setOpen(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'leave-types.save');
      setError(displayMessage);
    }
  }, [companyId, draft, editId, reload]);

  const remove = React.useCallback(async () => {
    if (!confirmId) return;
    try {
      await deleteLeaveType(confirmId);
      setConfirmId(null);
      await reload();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'leave-types.delete');
      setError(displayMessage);
    }
  }, [confirmId, reload]);

  return {
    items,
    sorted,
    loading,
    listError,
    open,
    setOpen,
    editId,
    draft,
    error,
    confirmId,
    setConfirmId,
    openCreate,
    openEdit,
    patch,
    save,
    remove,
  };
}
