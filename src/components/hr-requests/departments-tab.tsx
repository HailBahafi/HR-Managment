'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, ChevronRight, Building2, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { usePageFilters } from '@/components/filter-panel-context';
import { useHRConfigurationStore } from '@/lib/hr-requests/configuration-store';
import { buildDepartmentForest, flattenDepartmentsTree, getDescendantDepartmentIds } from '@/lib/hr-requests/hierarchy-utils';
import type { HRDepartmentEntity } from '@/lib/hr-requests/types';
import { MinimalDropdown, ConfirmationModal, HRSettingsFormDrawer, FormField, EmptyState, ActiveBadge } from './shared-ui';
import { cn } from '@/lib/utils';


interface DraftForm {
  nameAr: string; parentId: string; sortOrder: number; isActive: boolean;
}
const EMPTY: DraftForm = { nameAr: '', parentId: '', sortOrder: 1, isActive: true };

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DepartmentsTab() {
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useHRConfigurationStore();

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const { values } = usePageFilters([
    { key: 'search', label: 'بحث', type: 'text', placeholder: 'اسم القسم…' },
    { key: 'active', label: 'الحالة', type: 'select', options: [{ value: 'active', label: 'نشط فقط' }] },
  ]);
  const search = (values.search as string) ?? '';
  const filterActive = (values.active as string) === 'active';
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleteWarning, setDeleteWarning] = React.useState('');

  const forest = React.useMemo(() => buildDepartmentForest(departments), [departments]);
  const flat = React.useMemo(() => flattenDepartmentsTree(forest), [forest]);

  const filtered = flat.filter(n => {
    if (filterActive && !n.dept.isActive) return false;
    const q = search.toLowerCase();
    if (q && !n.dept.nameAr.includes(q)) return false;
    return true;
  });

  const openCreate = () => {
    setEditId(null);
    setDraft({ ...EMPTY, sortOrder: departments.length + 1 });
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEdit = (dept: HRDepartmentEntity) => {
    setEditId(dept.id);
    setDraft({ nameAr: dept.nameAr, parentId: dept.parentId ?? '', sortOrder: dept.sortOrder, isActive: dept.isActive });
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!draft.nameAr.trim()) { setFormError('اسم القسم مطلوب'); return; }
    const payload = { ...draft, nameEn: draft.nameAr.trim(), parentId: draft.parentId || undefined };
    const result = editId ? updateDepartment(editId, payload) : addDepartment({ ...payload, isActive: draft.isActive });
    if (!result.ok) { setFormError(result.error ?? 'خطأ'); return; }
    setDrawerOpen(false);
  };

  const confirmDelete = (id: string) => {
    const descendants = getDescendantDepartmentIds(departments, id).length;
    setDeleteWarning(descendants > 0 ? `سيتم حذف ${descendants} قسم فرعي أيضاً وجميع أنواع الطلبات المرتبطة.` : 'سيتم حذف القسم وجميع أنواع الطلبات المرتبطة به.');
    setDeleteId(id);
  };

  const patch = <K extends keyof DraftForm>(k: K, v: DraftForm[K]) => setDraft(d => ({ ...d, [k]: v }));

  // Parent options (exclude editing dept + its descendants)
  const excludeIds = editId ? new Set([editId, ...getDescendantDepartmentIds(departments, editId)]) : new Set<string>();
  const parentOptions = [
    { value: '', label: '— بدون أصل (قسم رئيسي) —' },
    ...departments.filter(d => !excludeIds.has(d.id)).map(d => ({ value: d.id, label: `${'　'.repeat(d.parentId ? 1 : 0)}${d.nameAr}` })),
  ];

  return (
    <div className="w-full min-w-0 space-y-4 pt-2">
      <div className="flex items-center justify-end gap-2">
        <Button variant="luxe" className="shrink-0 gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> قسم جديد
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="لا توجد أقسام" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {filtered.map(({ dept, depth }) => {
            const parent = departments.find(d => d.id === dept.parentId);
            const subDepts = departments.filter(d => d.parentId === dept.id);
            return (
              <div
                key={dept.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated cursor-pointer"
                onClick={() => openEdit(dept)}
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary opacity-0 blur-2xl transition-opacity group-hover:opacity-10" />

                <div className="relative flex items-start justify-between mb-4">
                  <div className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl',
                    dept.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/60',
                  )}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <ActiveBadge active={dept.isActive} />
                </div>

                <div className="relative mb-4">
                  {parent && (
                    <div className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{parent.nameAr}</span>
                    </div>
                  )}
                  <h3 className="font-display text-base font-bold leading-snug group-hover:text-primary transition-colors">
                    {dept.nameAr}
                  </h3>
                </div>

                <div className="relative flex items-center gap-3 pt-1 pb-2 text-xs text-muted-foreground">
                  {subDepts.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Network className="h-3.5 w-3.5" />
                      {subDepts.length} فرعي
                    </span>
                  )}
                  {depth > 0 && (
                    <span className="flex items-center gap-1">
                      <ChevronRight className="h-3.5 w-3.5" />
                      مستوى {depth + 1}
                    </span>
                  )}
                </div>

                <div
                  className="relative flex items-center gap-1 border-t border-border/60 pt-2"
                  onClick={e => e.stopPropagation()}
                >
                  <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => openEdit(dept)}>
                    <Pencil className="h-3 w-3" /> تعديل
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive" onClick={() => confirmDelete(dept.id)}>
                    <Trash2 className="h-3 w-3" /> حذف
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HRSettingsFormDrawer
        open={drawerOpen} onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل القسم' : 'إضافة قسم جديد'}
        onSave={handleSave} error={formError}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="الاسم" required span2>
            <Input value={draft.nameAr} onChange={e => patch('nameAr', e.target.value)} placeholder="الموارد البشرية" />
          </FormField>
          <FormField label="القسم الأصل" span2>
            <MinimalDropdown value={draft.parentId} onChange={v => patch('parentId', v)} options={parentOptions} />
          </FormField>
          <FormField label="الحالة">
            <label className={cn('flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all h-10', draft.isActive ? 'border-primary/30 bg-primary/5' : 'border-border')}>
              <span className="text-sm font-medium">نشط</span>
              <Switch checked={draft.isActive} onCheckedChange={v => patch('isActive', v)} />
            </label>
          </FormField>
        </div>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}
        title="حذف القسم" description={deleteWarning}
        onConfirm={() => { if (deleteId) deleteDepartment(deleteId); setDeleteId(null); }}
      />
    </div>
  );
}
