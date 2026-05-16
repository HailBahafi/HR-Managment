'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import {
  useExternalContactsStore,
  type ExternalPartyKind,
  type ExternalPartyRecord,
} from '@/features/hr/organization/lib/directory/external-contacts-store';
import {
  CONTACT_KIND_FILTER_OPTIONS,
  CONTACTS_EMPTY_FORM,
  type ContactsDraftForm,
  type ContactsKindFilter,
} from '@/features/hr/organization/contacts/constants/contacts-directory';

export function useContactsDirectoryModel() {
  useSetPageTitle({
    titleAr: 'العملاء والزوار',
    descriptionAr:
      'سجل جهات خارجية عن الموظفين: عملاء، زوار، مورّدون، شركاء — جاهز للتوسع لاحقاً مع نقاط البيع والمبيعات.',
    iconName: 'UserCircle',
  });

  const parties = useExternalContactsStore((s) => s.parties);
  const addParty = useExternalContactsStore((s) => s.add);
  const updateParty = useExternalContactsStore((s) => s.update);
  const removeParty = useExternalContactsStore((s) => s.remove);

  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('table');
  const [kindFilter, setKindFilter] = React.useState<ContactsKindFilter>('all');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<ContactsDraftForm>(CONTACTS_EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewRow, setViewRow] = React.useState<ExternalPartyRecord | null>(null);

  const patch = React.useCallback((p: Partial<ContactsDraftForm>) => {
    setForm((f) => ({ ...f, ...p }));
  }, []);

  const filtered = React.useMemo(() => {
    if (kindFilter === 'all') return parties;
    return parties.filter((p) => p.kind === kindFilter);
  }, [parties, kindFilter]);

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setForm(CONTACTS_EMPTY_FORM);
    setError(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = React.useCallback((row: ExternalPartyRecord) => {
    setEditId(row.id);
    setForm({
      kind: row.kind,
      nameAr: row.nameAr,
      phone: row.phone ?? '',
      email: row.email ?? '',
      organizationAr: row.organizationAr ?? '',
      notes: row.notes ?? '',
    });
    setError(null);
    setDrawerOpen(true);
  }, []);

  const handleSave = React.useCallback(() => {
    if (!form.nameAr.trim()) {
      setError('الاسم أو اسم الجهة مطلوب');
      return;
    }
    const payload = {
      kind: form.kind,
      nameAr: form.nameAr.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      organizationAr: form.organizationAr.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editId) {
      const r = updateParty(editId, payload);
      if (!r.ok) {
        setError(r.error ?? 'تعذر الحفظ');
        return;
      }
    } else {
      const r = addParty(payload);
      if (!r.ok) {
        setError(r.error ?? 'تعذر الحفظ');
        return;
      }
    }
    setDrawerOpen(false);
    setError(null);
  }, [addParty, editId, form, updateParty]);

  const handleDelete = React.useCallback(() => {
    if (!confirmId) return;
    removeParty(confirmId);
    setConfirmId(null);
  }, [confirmId, removeParty]);

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        onDateBoundsChange={() => {}}
        dataView={{
          value: layoutView,
          onChange: (v) => setLayoutView(v as 'grid' | 'table'),
          options: [
            { value: 'table', label: 'جدول', icon: 'list' },
            { value: 'grid', label: 'شبكة', icon: 'layout-grid' },
          ],
        }}
        trailingActions={(
          <div className="flex flex-wrap items-center gap-2">
            <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as ContactsKindFilter)}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="نوع الجهة" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_KIND_FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openCreate} size="sm" className="h-8 gap-1.5">
              <Plus className="h-4 w-4" />
              إضافة جهة
            </Button>
          </div>
        )}
      />
    ),
    [layoutView, kindFilter, openCreate],
  );

  return {
    layoutView,
    kindFilter,
    drawerOpen,
    setDrawerOpen,
    editId,
    form,
    patch,
    error,
    confirmId,
    setConfirmId,
    viewRow,
    setViewRow,
    filtered,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  };
}

export type ContactsDirectoryModel = ReturnType<typeof useContactsDirectoryModel>;
