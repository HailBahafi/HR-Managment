'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, Search, ChevronRight, ChevronDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useHRConfigurationStore } from '@/lib/hr-requests/configuration-store';
import { buildDepartmentForest, flattenDepartmentsTree, getDescendantDepartmentIds } from '@/lib/hr-requests/hierarchy-utils';
import type { DeptTreeNode } from '@/lib/hr-requests/hierarchy-utils';
import type { HRDepartmentEntity } from '@/lib/hr-requests/types';
import { slugify } from '@/lib/hr-requests/types';
import { MinimalDropdown, SearchableDropdown, ConfirmationModal, HRSettingsFormDrawer, FormField, EmptyState, ActiveBadge, PageHeader } from './shared-ui';
import { cn } from '@/lib/utils';

const LS_VIEW = 'hr_departments_view_mode';

interface DraftForm {
  nameAr: string; nameEn: string; parentId: string; sortOrder: number; isActive: boolean;
}
const EMPTY: DraftForm = { nameAr: '', nameEn: '', parentId: '', sortOrder: 1, isActive: true };

// ─── Dept tree node (chart view) ──────────────────────────────────────────────
function DeptOrgNode({ node, depth = 0 }: { node: DeptTreeNode; depth?: number }) {
  const [expanded, setExpanded] = React.useState(true);
  return (
    <div className={cn('relative', depth > 0 && 'border-r border-dashed border-border/60 mr-6 pr-4')}>
      <div className="group mb-1 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-soft">
        <Building2 className="h-4 w-4 shrink-0 text-primary/60" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{node.dept.nameAr}</p>
          <p className="truncate text-[11px] text-muted-foreground" dir="ltr">{node.dept.nameEn}</p>
        </div>
        {!node.dept.isActive && <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">موقوف</span>}
        {node.children.length > 0 && (
          <button type="button" className="shrink-0 text-muted-foreground" onClick={() => setExpanded(v => !v)}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>
      {expanded && node.children.length > 0 && (
        <div className="mt-1 space-y-1 pr-4">
          {node.children.map(c => <DeptOrgNode key={c.dept.id} node={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DepartmentsTab() {
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useHRConfigurationStore();

  const [view, setView] = React.useState<'list' | 'chart'>(() => (typeof window !== 'undefined' ? localStorage.getItem(LS_VIEW) as 'list' | 'chart' : null) ?? 'list');
  const [search, setSearch] = React.useState('');
  const [filterActive, setFilterActive] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleteWarning, setDeleteWarning] = React.useState('');

  React.useEffect(() => { localStorage.setItem(LS_VIEW, view); }, [view]);

  const forest = React.useMemo(() => buildDepartmentForest(departments), [departments]);
  const flat = React.useMemo(() => flattenDepartmentsTree(forest), [forest]);

  const filtered = flat.filter(n => {
    if (filterActive && !n.dept.isActive) return false;
    const q = search.toLowerCase();
    if (q && !n.dept.nameAr.includes(q) && !n.dept.nameEn.toLowerCase().includes(q)) return false;
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
    setDraft({ nameAr: dept.nameAr, nameEn: dept.nameEn, parentId: dept.parentId ?? '', sortOrder: dept.sortOrder, isActive: dept.isActive });
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!draft.nameAr.trim()) { setFormError('اسم القسم مطلوب'); return; }
    const payload = { ...draft, parentId: draft.parentId || undefined };
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
          {(['list', 'chart'] as const).map(v => (
            <button key={v} type="button" onClick={() => setView(v)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-all', view === v ? 'bg-background shadow-soft text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {v === 'list' ? 'قائمة' : 'مخطط'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث…" className="pr-7 h-8 w-44 text-xs" />
          </div>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer text-muted-foreground">
            <Checkbox checked={filterActive} onCheckedChange={v => setFilterActive(v === true)} />
            نشط فقط
          </label>
          <Button variant="luxe" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> قسم جديد
          </Button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          {filtered.length === 0 ? <EmptyState icon={Building2} title="لا توجد أقسام" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 text-right">الاسم</th>
                    <th className="px-4 py-3 text-right">القسم الأصل</th>
                    <th className="px-4 py-3 text-right">الرمز</th>
                    <th className="px-4 py-3 text-right">الترتيب</th>
                    <th className="px-4 py-3 text-right">الحالة</th>
                    <th className="w-20 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ dept, depth }) => {
                    const parent = departments.find(d => d.id === dept.parentId);
                    return (
                      <tr key={dept.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2" style={{ paddingRight: depth * 16 }}>
                            {depth > 0 && <span className="h-px w-4 shrink-0 bg-border" />}
                            <Building2 className="h-4 w-4 shrink-0 text-primary/50" />
                            <div>
                              <p className="font-semibold">{dept.nameAr}</p>
                              <p className="text-xs text-muted-foreground" dir="ltr">{dept.nameEn}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{parent?.nameAr ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{dept.slug}</td>
                        <td className="px-4 py-3 text-xs">{dept.sortOrder}</td>
                        <td className="px-4 py-3"><ActiveBadge active={dept.isActive} /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(dept)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => confirmDelete(dept.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
            {filtered.length} من {departments.length} قسم
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          {forest.length === 0 ? <EmptyState icon={Building2} title="لا توجد أقسام" /> : (
            <div className="space-y-2">
              {forest.map(n => <DeptOrgNode key={n.dept.id} node={n} />)}
            </div>
          )}
        </div>
      )}

      <HRSettingsFormDrawer
        open={drawerOpen} onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل القسم' : 'إضافة قسم جديد'}
        onSave={handleSave} error={formError}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="الاسم بالعربية" required span2>
            <Input value={draft.nameAr} onChange={e => patch('nameAr', e.target.value)} placeholder="الموارد البشرية" />
          </FormField>
          <FormField label="الاسم بالإنجليزية" span2>
            <Input dir="ltr" value={draft.nameEn} onChange={e => patch('nameEn', e.target.value)} placeholder="Human Resources" />
          </FormField>
          <FormField label="القسم الأصل" span2>
            <MinimalDropdown value={draft.parentId} onChange={v => patch('parentId', v)} options={parentOptions} />
          </FormField>
          <FormField label="الترتيب">
            <Input type="number" min={0} value={draft.sortOrder} onChange={e => patch('sortOrder', Number(e.target.value))} />
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
