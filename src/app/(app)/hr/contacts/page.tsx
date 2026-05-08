'use client';

import * as React from 'react';
import { UserCircle, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useSetPageTitle } from '@/components/page-title-context';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import {
  EmptyState, HRSettingsFormDrawer, FormField, ConfirmationModal,
} from '@/components/hr-requests/shared-ui';
import {
  useExternalContactsStore,
  EXTERNAL_PARTY_KIND_LABELS,
  type ExternalPartyKind,
  type ExternalPartyRecord,
} from '@/lib/directory/external-contacts-store';
import { Badge } from '@/components/ui/badge';

type KindFilter = 'all' | ExternalPartyKind;

const KIND_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'كل الأنواع' },
  ...(
    Object.entries(EXTERNAL_PARTY_KIND_LABELS) as [ExternalPartyKind, string][]
  ).map(([value, label]) => ({ value, label })),
];

type DraftForm = {
  kind: ExternalPartyKind;
  nameAr: string;
  phone: string;
  email: string;
  organizationAr: string;
  notes: string;
};

const EMPTY_FORM: DraftForm = {
  kind: 'customer',
  nameAr: '',
  phone: '',
  email: '',
  organizationAr: '',
  notes: '',
};

export default function ContactsPage() {
  useSetPageTitle({
    titleAr: 'العملاء والزوار',
    descriptionAr: 'سجل جهات خارجية عن الموظفين: عملاء، زوار، مورّدون، شركاء — جاهز للتوسع لاحقاً مع نقاط البيع والمبيعات.',
    iconName: 'UserCircle',
  });

  const parties = useExternalContactsStore((s) => s.parties);
  const addParty = useExternalContactsStore((s) => s.add);
  const updateParty = useExternalContactsStore((s) => s.update);
  const removeParty = useExternalContactsStore((s) => s.remove);

  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('table');
  const [kindFilter, setKindFilter] = React.useState<KindFilter>('all');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<DraftForm>(EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewRow, setViewRow] = React.useState<ExternalPartyRecord | null>(null);

  const patch = (p: Partial<DraftForm>) => setForm((f) => ({ ...f, ...p }));

  const filtered = React.useMemo(() => {
    if (kindFilter === 'all') return parties;
    return parties.filter((p) => p.kind === kindFilter);
  }, [parties, kindFilter]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setDrawerOpen(true);
  };

  const openEdit = (row: ExternalPartyRecord) => {
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
  };

  const handleSave = () => {
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
  };

  const handleDelete = () => {
    if (!confirmId) return;
    removeParty(confirmId);
    setConfirmId(null);
  };

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
            <Select
              value={kindFilter}
              onValueChange={(v) => setKindFilter(v as KindFilter)}
            >
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="نوع الجهة" />
              </SelectTrigger>
              <SelectContent>
                {KIND_OPTIONS.map((o) => (
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
    [layoutView, kindFilter],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {filtered.length} جهة
        {kindFilter !== 'all' && ` · ${EXTERNAL_PARTY_KIND_LABELS[kindFilter]}`}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="لا توجد جهات"
          description="أضف عملاء، زواراً، أو مورّدين — منفصلون عن سجل الموظفين."
        />
      ) : layoutView === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((row) => (
            <div
              key={row.id}
              className="flex cursor-pointer flex-col space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft transition-colors hover:bg-muted/30"
              onClick={() => setViewRow(row)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate font-semibold">{row.nameAr}</p>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {EXTERNAL_PARTY_KIND_LABELS[row.kind]}
                </Badge>
              </div>
              <div className="space-y-1.5 text-xs">
                {row.organizationAr && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">الجهة</span>
                    <span className="truncate font-medium">{row.organizationAr}</span>
                  </div>
                )}
                {row.phone && (
                  <div className="flex justify-between gap-2" dir="ltr">
                    <span className="text-muted-foreground">الجوال</span>
                    <span>{row.phone}</span>
                  </div>
                )}
              </div>
              <div
                className="mt-auto flex items-center justify-end gap-1 border-t border-border pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setConfirmId(row.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3 text-right">الاسم</th>
                  <th className="px-4 py-3 text-right">النوع</th>
                  <th className="px-4 py-3 text-right">الجهة / الشركة</th>
                  <th className="px-4 py-3 text-right">التواصل</th>
                  <th className="w-28 px-4 py-3 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-border/60 hover:bg-muted/25"
                    onClick={() => setViewRow(row)}
                  >
                    <td className="px-4 py-3 font-medium">{row.nameAr}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px]">
                        {EXTERNAL_PARTY_KIND_LABELS[row.kind]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.organizationAr ?? '—'}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground" dir="ltr">
                      {[row.phone, row.email].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)} aria-label="تعديل">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setConfirmId(row.id)}
                          aria-label="حذف"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <HRSettingsFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل جهة' : 'جهة جديدة'}
        onSave={handleSave}
        error={error}
      >
        <FormField label="نوع الجهة" required>
          <Select value={form.kind} onValueChange={(v) => patch({ kind: v as ExternalPartyKind })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(EXTERNAL_PARTY_KIND_LABELS) as [ExternalPartyKind, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="الاسم" required>
          <Input
            value={form.nameAr}
            onChange={(e) => patch({ nameAr: e.target.value })}
            placeholder="اسم الشخص أو الجهة"
          />
        </FormField>
        <FormField label="الشركة / الجهة التابعة">
          <Input
            value={form.organizationAr}
            onChange={(e) => patch({ organizationAr: e.target.value })}
            placeholder="اختياري"
          />
        </FormField>
        <FormField label="رقم الجوال">
          <Input dir="ltr" value={form.phone} onChange={(e) => patch({ phone: e.target.value })} placeholder="+966 …" />
        </FormField>
        <FormField label="البريد الإلكتروني">
          <Input
            dir="ltr"
            type="email"
            value={form.email}
            onChange={(e) => patch({ email: e.target.value })}
            placeholder="name@example.com"
          />
        </FormField>
        <FormField label="ملاحظات">
          <Textarea
            value={form.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="متابعة، مصدر التواصل، اهتمامات…"
            rows={3}
          />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!confirmId}
        onOpenChange={(v) => {
          if (!v) setConfirmId(null);
        }}
        title="حذف الجهة"
        description="هل أنت متأكد من حذف هذا السجل؟"
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <Dialog open={!!viewRow} onOpenChange={(v) => !v && setViewRow(null)}>
        <DialogContent className="border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              {viewRow?.nameAr}
            </DialogTitle>
          </DialogHeader>
          {viewRow && (
            <div className="space-y-3">
              <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">النوع</span>
                  <span className="font-medium">{EXTERNAL_PARTY_KIND_LABELS[viewRow.kind]}</span>
                </div>
                {viewRow.organizationAr && (
                  <div className="flex justify-between gap-2 border-t border-border pt-3">
                    <span className="text-muted-foreground">الجهة</span>
                    <span className="font-medium">{viewRow.organizationAr}</span>
                  </div>
                )}
                {viewRow.phone && (
                  <div className="flex justify-between gap-2 border-t border-border pt-3" dir="ltr">
                    <span className="text-muted-foreground">الجوال</span>
                    <span>{viewRow.phone}</span>
                  </div>
                )}
                {viewRow.email && (
                  <div className="flex justify-between gap-2 border-t border-border pt-3" dir="ltr">
                    <span className="text-muted-foreground">البريد</span>
                    <span className="truncate">{viewRow.email}</span>
                  </div>
                )}
                {viewRow.notes && (
                  <div className="border-t border-border pt-3">
                    <p className="text-muted-foreground">ملاحظات</p>
                    <p className="mt-1 leading-relaxed">{viewRow.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewRow(null)}>
              إغلاق
            </Button>
            <Button
              onClick={() => {
                if (viewRow) {
                  const r = viewRow;
                  setViewRow(null);
                  openEdit(r);
                }
              }}
              className="gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              تعديل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
