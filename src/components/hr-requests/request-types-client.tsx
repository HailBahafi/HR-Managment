'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { Switch } from '@/components/ui/switch';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import {
  MinimalDropdown, ConfirmationModal, HRSettingsFormDrawer,
  FormField, ActiveBadge,
} from './shared-ui';
import { useHRConfigurationStore } from '@/lib/hr-requests/configuration-store';
import { useHRApprovalAssignmentTemplatesStore } from '@/lib/hr-requests/approval-assignment-store';
import type { HRRequestTypeEntity, HRRequestTypeCategory } from '@/lib/hr-requests/types';
import {
  HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID,
  HR_REQUEST_TYPE_CATEGORIES,
  HR_REQUEST_TYPE_CATEGORY_LABELS_AR,
} from '@/lib/hr-requests/types';
import { cn } from '@/lib/utils';

interface DraftForm {
  requestCategory: HRRequestTypeCategory;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY: DraftForm = {
  requestCategory: 'leaves',
  nameAr: '',
  sortOrder: 1,
  isActive: true,
};

const CATEGORY_DROPDOWN_OPTIONS = HR_REQUEST_TYPE_CATEGORIES.map((c) => ({
  value: c,
  label: HR_REQUEST_TYPE_CATEGORY_LABELS_AR[c],
}));

const CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: 'كل التصنيفات' },
  ...CATEGORY_DROPDOWN_OPTIONS,
];

export function RequestTypesClient() {
  const { departments, requestTypes, addRequestType, updateRequestType, deleteRequestType } = useHRConfigurationStore();
  const approvalAssignmentTemplates = useHRApprovalAssignmentTemplatesStore(s => s.templates);

  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('grid');
  const filterDepts: string[] = [];
  const [typeStatusFilter, setTypeStatusFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const activeDepts = departments.filter(d => d.isActive);
  const afterSearch = React.useMemo(() => {
    return requestTypes.filter((rt) => {
      if (filterDepts.length && !filterDepts.includes(rt.departmentId)) return false;
      return true;
    });
  }, [requestTypes, filterDepts]);

  const afterCategoryFilter = React.useMemo(() => {
    if (categoryFilter === 'all') return afterSearch;
    return afterSearch.filter((rt) => rt.requestCategory === categoryFilter);
  }, [afterSearch, categoryFilter]);

  const typeStatusCounts = React.useMemo(() => ({
    all: afterCategoryFilter.length,
    active: afterCategoryFilter.filter((rt) => rt.isActive).length,
    inactive: afterCategoryFilter.filter((rt) => !rt.isActive).length,
  }), [afterCategoryFilter]);

  const filtered = React.useMemo(() => {
    return afterCategoryFilter
      .filter((rt) => {
        if (typeStatusFilter === 'all') return true;
        if (typeStatusFilter === 'active') return rt.isActive;
        if (typeStatusFilter === 'inactive') return !rt.isActive;
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [afterCategoryFilter, typeStatusFilter]);

  const openCreate = () => {
    setEditId(null);
    setDraft({ ...EMPTY, sortOrder: requestTypes.length + 1 });
    setError(null);
    setDrawerOpen(true);
  };

  const openEdit = (rt: HRRequestTypeEntity) => {
    setEditId(rt.id);
    setDraft({
      requestCategory: rt.requestCategory,
      nameAr: rt.nameAr,
      sortOrder: rt.sortOrder,
      isActive: rt.isActive,
    });
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!draft.nameAr.trim()) { setError('اسم نوع الطلب مطلوب'); return; }
    const base = {
      departmentId: HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID,
      nameAr: draft.nameAr.trim(),
      nameEn: draft.nameAr.trim(),
      sortOrder: draft.sortOrder,
      isActive: draft.isActive,
      requestCategory: draft.requestCategory,
    };
    if (editId) {
      const existing = requestTypes.find(r => r.id === editId);
      updateRequestType(editId, { ...base, subtypes: existing?.subtypes ?? [] });
    } else {
      addRequestType({
        ...base,
        subtypes: [],
        approvalAssignmentTemplateId: null,
        approvalStages: [],
      });
    }
    setDrawerOpen(false);
  };

  const patch = <K extends keyof DraftForm>(k: K, v: DraftForm[K]) => setDraft(d => ({ ...d, [k]: v }));

  const getDeptLabel = (id: string) => {
    if (id === HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID) return 'جميع الأقسام';
    return activeDepts.find(d => d.id === id)?.nameAr ?? '—';
  };

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        showEmployeePicker={false}
        inlineSelects={[
          {
            id: 'request-category',
            value: categoryFilter,
            onChange: setCategoryFilter,
            placeholder: 'التصنيف',
            options: CATEGORY_FILTER_OPTIONS,
            className: 'min-w-[10.5rem]',
          },
        ]}
        statusFilter={typeStatusFilter}
        onStatusFilterChange={setTypeStatusFilter}
        statusOrder={['active', 'inactive']}
        statusLabels={{ active: 'نشط', inactive: 'غير نشط' }}
        statusCounts={typeStatusCounts}
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
          <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> نوع جديد
          </Button>
        )}
      />
    ),
    [
      categoryFilter,
      typeStatusFilter,
      typeStatusCounts.all,
      typeStatusCounts.active,
      typeStatusCounts.inactive,
      layoutView,
    ],
  );

  return (
    <div className="space-y-4">

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <Filter className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد أنواع. أضف نوعاً جديداً أو عدّل الفلاتر</p>
        </div>
      ) : layoutView === 'grid' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(rt => {
              const aaTpl = approvalAssignmentTemplates.find(t => t.id === rt.approvalAssignmentTemplateId);
              return (
                <div
                  key={rt.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col cursor-pointer"
                  onClick={() => openEdit(rt)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground truncate">{getDeptLabel(rt.departmentId)}</p>
                      <p className="font-semibold truncate">{rt.nameAr}</p>
                    </div>
                    <ActiveBadge active={rt.isActive} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                        rt.requestCategory === 'leaves' && 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200',
                        rt.requestCategory === 'attendance' && 'bg-sky-500/15 text-sky-900 dark:text-sky-200',
                        rt.requestCategory === 'advances' && 'bg-violet-500/15 text-violet-900 dark:text-violet-200',
                      )}
                    >
                      {HR_REQUEST_TYPE_CATEGORY_LABELS_AR[rt.requestCategory]}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {rt.approvalStages?.length ?? 0} مرحلة
                    </span>
                    {aaTpl ? (
                      <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-900 dark:text-amber-200">
                        موافقات: {aaTpl.nameAr}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-auto flex gap-1 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="gap-1.5 flex-1" onClick={() => openEdit(rt)}>
                      <Pencil className="h-3.5 w-3.5" /> تعديل
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(rt.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3 text-right">القسم</th>
                  <th className="px-4 py-3 text-right">النوع</th>
                  <th className="px-4 py-3 text-right">التصنيف</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-left w-28">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rt) => {
                  return (
                    <tr
                      key={rt.id}
                      className="border-b border-border/60 cursor-pointer hover:bg-muted/25"
                      onClick={() => openEdit(rt)}
                    >
                      <td className="px-4 py-3 text-muted-foreground">{getDeptLabel(rt.departmentId)}</td>
                      <td className="px-4 py-3 font-medium">{rt.nameAr}</td>
                      <td className="px-4 py-3 text-muted-foreground">{HR_REQUEST_TYPE_CATEGORY_LABELS_AR[rt.requestCategory]}</td>
                      <td className="px-4 py-3"><ActiveBadge active={rt.isActive} /></td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(rt)} aria-label="تعديل">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(rt.id)} aria-label="حذف">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer */}
      <HRSettingsFormDrawer
        open={drawerOpen} onOpenChange={v => setDrawerOpen(v)}
        title={editId ? 'تعديل نوع الطلب' : 'إضافة نوع طلب'}
        onSave={handleSave} error={error} size="lg"
      >
        <div className="flex items-center justify-end gap-2 border-b border-border pb-3 -mt-1 mb-1">
          <span className="text-xs text-muted-foreground">نشط</span>
          <div className="scale-90 origin-right">
            <Switch checked={draft.isActive} onCheckedChange={(v) => patch('isActive', v)} />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">ينطبق نوع الطلب على جميع الأقسام.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="يندرج تحت" required span2>
            <MinimalDropdown
              value={draft.requestCategory}
              onChange={(v) => patch('requestCategory', v as HRRequestTypeCategory)}
              options={CATEGORY_DROPDOWN_OPTIONS}
              placeholder="اختر التصنيف"
            />
          </FormField>
          <FormField label="الاسم" required span2>
            <Input value={draft.nameAr} onChange={e => patch('nameAr', e.target.value)} placeholder="طلب إجازة" />
          </FormField>
        </div>
      </HRSettingsFormDrawer>

      <ConfirmationModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} title="حذف نوع الطلب" onConfirm={() => { if (deleteId) deleteRequestType(deleteId); setDeleteId(null); }} />
    </div>
  );
}
