'use client';

import * as React from 'react';
import { Plus, Search, RefreshCw, Pencil, Trash2, Eye, ChevronRight, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useHREmployeeDirectoryStore, type HREmployeeDirectoryRow, type HREmployeeStatus, type HREmployeeHierarchyRole } from '@/lib/hr-requests/employee-directory-store';
import { useHRConfigurationStore } from '@/lib/hr-requests/configuration-store';
import { buildEmployeeForest, HIERARCHY_ROLE_LABELS, STATUS_LABELS, STATUS_COLORS, type EmpTreeNode } from '@/lib/hr-requests/hierarchy-utils';
import { MinimalDropdown, SearchableDropdown, ConfirmationModal, HRSettingsFormDrawer, FormField, EmptyState, Pagination, ActiveBadge } from './shared-ui';
import { cn } from '@/lib/utils';

const LS_VIEW = 'hr_employees_list_view_mode';
const LS_PAGE = 'hr_employees_list_page';
const LS_PER = 'hr_employees_list_per';

const ROLE_OPTIONS: { value: HREmployeeHierarchyRole; label: string }[] = [
  { value: 'ceo', label: 'الرئيس التنفيذي' },
  { value: 'executive', label: 'تنفيذي' },
  { value: 'gm', label: 'مدير عام' },
  { value: 'dept_head', label: 'رئيس قسم' },
  { value: 'supervisor', label: 'مشرف' },
  { value: 'staff', label: 'موظف' },
];
const STATUS_OPTIONS: { value: HREmployeeStatus; label: string }[] = [
  { value: 'active', label: 'نشط' },
  { value: 'probation', label: 'تحت التجربة' },
  { value: 'suspended', label: 'موقوف' },
];

interface DraftForm {
  bridgeId: string; nameAr: string; nameEn: string; nationalId: string;
  departmentId: string; jobTitleAr: string; jobTitleEn: string; hireDate: string;
  status: HREmployeeStatus; email: string; mobile: string; notes: string;
  reportsToId: string; hierarchyRole: HREmployeeHierarchyRole;
}
const EMPTY: DraftForm = {
  bridgeId: '', nameAr: '', nameEn: '', nationalId: '', departmentId: '',
  jobTitleAr: '', jobTitleEn: '', hireDate: '', status: 'active',
  email: '', mobile: '', notes: '', reportsToId: '', hierarchyRole: 'staff',
};

// ─── Org chart node ───────────────────────────────────────────────────────────
function OrgNode({ node, onSelect, depth = 0 }: { node: EmpTreeNode; onSelect: (e: HREmployeeDirectoryRow) => void; depth?: number }) {
  const [expanded, setExpanded] = React.useState(true);
  const hasChildren = node.children.length > 0;
  return (
    <div className={cn('relative', depth > 0 && 'border-r border-dashed border-border/60 mr-6 pr-4')}>
      <div
        className="group mb-1 flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-soft hover:border-primary/30 hover:bg-primary/5 transition-all"
        onClick={() => onSelect(node.emp)}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {node.emp.nameAr.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{node.emp.nameAr}</p>
          <p className="truncate text-[11px] text-muted-foreground">{node.emp.jobTitleAr}</p>
        </div>
        {hasChildren && (
          <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>
      {expanded && hasChildren && (
        <div className="mt-1 space-y-1 pr-4">
          {node.children.map(child => <OrgNode key={child.emp.id} node={child} onSelect={onSelect} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface Props { openEmployeeId?: string | null; onClearDeepLink: () => void; }

export function EmployeeTab({ openEmployeeId, onClearDeepLink }: Props) {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useHREmployeeDirectoryStore();
  const { departments } = useHRConfigurationStore();

  const [view, setView] = React.useState<'list' | 'chart'>(() => (typeof window !== 'undefined' ? localStorage.getItem(LS_VIEW) as 'list' | 'chart' : null) ?? 'list');
  const [search, setSearch] = React.useState('');
  const [filterDept, setFilterDept] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [refreshing, setRefreshing] = React.useState(false);
  const [page, setPage] = React.useState(() => typeof window !== 'undefined' ? Number(localStorage.getItem(LS_PAGE) ?? '1') : 1);
  const [perPage, setPerPage] = React.useState(() => typeof window !== 'undefined' ? Number(localStorage.getItem(LS_PER) ?? '15') : 15);

  const [sidebarMode, setSidebarMode] = React.useState<'view' | 'edit' | 'create' | null>(null);
  const [selected, setSelected] = React.useState<HREmployeeDirectoryRow | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // Deep link
  React.useEffect(() => {
    if (openEmployeeId) {
      const emp = employees.find(e => e.id === openEmployeeId);
      if (emp) { setSelected(emp); setSidebarMode('view'); }
      onClearDeepLink();
    }
  }, [openEmployeeId, employees, onClearDeepLink]);

  React.useEffect(() => { localStorage.setItem(LS_VIEW, view); }, [view]);
  React.useEffect(() => { localStorage.setItem(LS_PAGE, String(page)); }, [page]);
  React.useEffect(() => { localStorage.setItem(LS_PER, String(perPage)); }, [perPage]);

  const deptOptions = [{ value: 'all', label: 'جميع الأقسام' }, ...departments.map(d => ({ value: d.id, label: d.nameAr }))];

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(e => {
      if (filterDept !== 'all' && e.departmentId !== filterDept) return false;
      if (filterStatus !== 'all' && e.status !== filterStatus) return false;
      if (q && !e.nameAr.includes(q) && !e.nameEn.toLowerCase().includes(q) && !e.bridgeId.toLowerCase().includes(q) && !e.jobTitleAr.includes(q)) return false;
      return true;
    });
  }, [employees, search, filterDept, filterStatus]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openView = (emp: HREmployeeDirectoryRow) => { setSelected(emp); setSidebarMode('view'); };
  const openEdit = (emp: HREmployeeDirectoryRow) => {
    setSelected(emp);
    setDraft({ bridgeId: emp.bridgeId, nameAr: emp.nameAr, nameEn: emp.nameEn, nationalId: emp.nationalId, departmentId: emp.departmentId, jobTitleAr: emp.jobTitleAr, jobTitleEn: emp.jobTitleEn, hireDate: emp.hireDate, status: emp.status, email: emp.email ?? '', mobile: emp.mobile ?? '', notes: emp.notes ?? '', reportsToId: emp.reportsToId ?? '', hierarchyRole: emp.hierarchyRole });
    setFormError(null);
    setSidebarMode('edit');
  };
  const openCreate = () => {
    setSelected(null);
    setDraft({ ...EMPTY, bridgeId: `NW-${1000 + employees.length + 1}` });
    setFormError(null);
    setSidebarMode('create');
  };

  const handleSave = () => {
    if (!draft.nameAr.trim()) { setFormError('الاسم بالعربية مطلوب'); return; }
    if (!draft.departmentId) { setFormError('القسم مطلوب'); return; }
    const payload = { ...draft, reportsToId: draft.reportsToId || null, email: draft.email || undefined, mobile: draft.mobile || undefined, notes: draft.notes || undefined };
    if (sidebarMode === 'create') addEmployee(payload);
    else if (sidebarMode === 'edit' && selected) updateEmployee(selected.id, payload);
    setSidebarMode(null);
  };

  const patch = <K extends keyof DraftForm>(k: K, v: DraftForm[K]) => setDraft(d => ({ ...d, [k]: v }));

  const empOptions = employees.filter(e => e.id !== selected?.id).map(e => ({ value: e.id, label: e.nameAr, sub: e.jobTitleAr }));
  const forest = React.useMemo(() => buildEmployeeForest(filtered), [filtered]);
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.nameAr ?? id;

  return (
    <div className="flex gap-4">
      {/* Sidebar filters */}
      <div className="w-56 shrink-0 space-y-4 rounded-xl border border-border bg-card p-4 shadow-soft self-start">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">الفلاتر</p>
          <span className="text-xs text-muted-foreground">{filtered.length} موظف</span>
        </div>
        <div className="relative">
          <Search className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="بحث…" className="pr-7 h-8 text-xs" />
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground font-medium">القسم</p>
          <MinimalDropdown value={filterDept} onChange={v => { setFilterDept(v); setPage(1); }} options={deptOptions} />
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground font-medium">الحالة</p>
          <MinimalDropdown value={filterStatus} onChange={v => { setFilterStatus(v); setPage(1); }} options={[{ value: 'all', label: 'الكل' }, ...STATUS_OPTIONS]} />
        </div>
        <Separator />
        <Button variant="ghost" size="sm" className="w-full gap-1.5" onClick={() => setRefreshing(true)} disabled={refreshing}>
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} /> تحديث
        </Button>
        {refreshing && setTimeout(() => setRefreshing(false), 700) && null}
      </div>

      <div className="flex-1 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
            {(['list', 'chart'] as const).map(v => (
              <button key={v} type="button" onClick={() => setView(v)}
                className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-all', view === v ? 'bg-background shadow-soft text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {v === 'list' ? 'قائمة' : 'مخطط'}
              </button>
            ))}
          </div>
          <Button variant="luxe" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> موظف جديد
          </Button>
        </div>

        {/* Table */}
        {view === 'list' ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
            {paginated.length === 0 ? <EmptyState icon={User} title="لا يوجد موظفون" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 text-right">الموظف</th>
                      <th className="px-4 py-3 text-right">القسم</th>
                      <th className="px-4 py-3 text-right">المستوى</th>
                      <th className="px-4 py-3 text-right">المسمى</th>
                      <th className="px-4 py-3 text-right">تاريخ التعيين</th>
                      <th className="px-4 py-3 text-right">الحالة</th>
                      <th className="w-24 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(emp => (
                      <tr key={emp.id} className="group border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => openView(emp)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {emp.nameAr.split(' ').map(w => w[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{emp.nameAr}</p>
                              <p className="text-[11px] text-muted-foreground" dir="ltr">{emp.bridgeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{getDeptName(emp.departmentId)}</td>
                        <td className="px-4 py-3 text-xs">{HIERARCHY_ROLE_LABELS[emp.hierarchyRole]}</td>
                        <td className="px-4 py-3 text-xs">{emp.jobTitleAr}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', STATUS_COLORS[emp.status])}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {STATUS_LABELS[emp.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(emp)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(emp.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} perPage={perPage} total={filtered.length} onPage={setPage} onPerPage={p => { setPerPage(p); setPage(1); }} />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            {forest.length === 0 ? <EmptyState icon={User} title="لا يوجد موظفون" /> : (
              <div className="space-y-2">
                {forest.map(n => <OrgNode key={n.emp.id} node={n} onSelect={openView} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit drawer */}
      <HRSettingsFormDrawer
        open={sidebarMode === 'create' || sidebarMode === 'edit'}
        onOpenChange={v => { if (!v) setSidebarMode(null); }}
        title={sidebarMode === 'create' ? 'إضافة موظف جديد' : 'تعديل بيانات الموظف'}
        onSave={handleSave} error={formError} size="lg"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="رقم الموظف" required><Input value={draft.bridgeId} onChange={e => patch('bridgeId', e.target.value)} placeholder="NW-1001" dir="ltr" /></FormField>
          <FormField label="القسم" required>
            <MinimalDropdown value={draft.departmentId} onChange={v => patch('departmentId', v)} options={departments.filter(d => d.isActive).map(d => ({ value: d.id, label: d.nameAr }))} placeholder="اختر القسم" />
          </FormField>
          <FormField label="الاسم بالعربية" required span2><Input value={draft.nameAr} onChange={e => patch('nameAr', e.target.value)} /></FormField>
          <FormField label="الاسم بالإنجليزية" span2><Input dir="ltr" value={draft.nameEn} onChange={e => patch('nameEn', e.target.value)} /></FormField>
          <FormField label="رقم الهوية" required><Input value={draft.nationalId} onChange={e => patch('nationalId', e.target.value)} dir="ltr" /></FormField>
          <FormField label="تاريخ التعيين"><Input type="date" dir="ltr" value={draft.hireDate} onChange={e => patch('hireDate', e.target.value)} /></FormField>
          <FormField label="المسمى بالعربية" span2><Input value={draft.jobTitleAr} onChange={e => patch('jobTitleAr', e.target.value)} /></FormField>
          <FormField label="المسمى بالإنجليزية" span2><Input dir="ltr" value={draft.jobTitleEn} onChange={e => patch('jobTitleEn', e.target.value)} /></FormField>
          <FormField label="المستوى الوظيفي">
            <MinimalDropdown value={draft.hierarchyRole} onChange={v => patch('hierarchyRole', v as HREmployeeHierarchyRole)} options={ROLE_OPTIONS} />
          </FormField>
          <FormField label="الحالة">
            <MinimalDropdown value={draft.status} onChange={v => patch('status', v as HREmployeeStatus)} options={STATUS_OPTIONS} />
          </FormField>
          <FormField label="المدير المباشر" span2>
            <SearchableDropdown value={draft.reportsToId} onChange={v => patch('reportsToId', v)} options={empOptions} placeholder="لا يوجد مدير مباشر" allowClear />
          </FormField>
          <FormField label="البريد الإلكتروني"><Input type="email" dir="ltr" value={draft.email} onChange={e => patch('email', e.target.value)} /></FormField>
          <FormField label="الجوال"><Input dir="ltr" value={draft.mobile} onChange={e => patch('mobile', e.target.value)} /></FormField>
          <FormField label="ملاحظات" span2><Input value={draft.notes} onChange={e => patch('notes', e.target.value)} /></FormField>
        </div>
      </HRSettingsFormDrawer>

      {/* View modal */}
      {sidebarMode === 'view' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSidebarMode(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-luxe space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {selected.nameAr.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
              <div>
                <p className="font-display text-xl font-bold">{selected.nameAr}</p>
                <p className="text-sm text-muted-foreground" dir="ltr">{selected.nameEn}</p>
              </div>
              <span className={cn('mr-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', STATUS_COLORS[selected.status])}>
                {STATUS_LABELS[selected.status]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['القسم', getDeptName(selected.departmentId)],
                ['المسمى', selected.jobTitleAr],
                ['المستوى', HIERARCHY_ROLE_LABELS[selected.hierarchyRole]],
                ['تاريخ التعيين', selected.hireDate ? new Date(selected.hireDate).toLocaleDateString('ar-SA') : '—'],
                ['الهوية', selected.nationalId],
                ['الجوال', selected.mobile ?? '—'],
                ['البريد', selected.email ?? '—', true],
              ].map(([label, value, full]) => (
                <div key={label as string} className={cn('rounded-lg bg-muted/30 p-2.5', full && 'col-span-2')}>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="font-medium truncate" dir={label === 'البريد' || label === 'الجوال' ? 'ltr' : undefined}>{value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSidebarMode(null)}>إغلاق</Button>
              <Button variant="luxe" className="flex-1 gap-1.5" onClick={() => openEdit(selected)}><Pencil className="h-3.5 w-3.5" />تعديل</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} title="حذف الموظف"
        description="سيتم حذف الموظف وإزالته من هيكل التقارير لمن يتبع له."
        onConfirm={() => { if (deleteId) deleteEmployee(deleteId); setDeleteId(null); }} />
    </div>
  );
}
