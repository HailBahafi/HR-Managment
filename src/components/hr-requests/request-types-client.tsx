'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  MinimalDropdown, ConfirmationModal, HRSettingsFormDrawer,
  FormField, PageHeader, EmptyState, Pagination, ActiveBadge,
} from './shared-ui';
import { HRRequestApprovalFlowEditor } from './approval-flow-editor';
import { useHRConfigurationStore } from '@/lib/hr-requests/configuration-store';
import type { HRRequestTypeEntity, HRApprovalStage } from '@/lib/hr-requests/types';
import { HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID, validateApprovalStages, slugify } from '@/lib/hr-requests/types';
import { cn } from '@/lib/utils';

const LS_PAGE = 'hr_request_types_currentPage';
const LS_PER = 'hr_request_types_itemsPerPage';

interface DraftForm {
  scope: 'specific' | 'global';
  departmentId: string;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
  templateId: string | null;
  approvalStages: HRApprovalStage[];
}

const EMPTY: DraftForm = {
  scope: 'global', departmentId: '', nameAr: '', sortOrder: 1, isActive: true, templateId: null, approvalStages: [],
};

export function RequestTypesClient() {
  const { departments, requestTypes, templates, addRequestType, updateRequestType, deleteRequestType } = useHRConfigurationStore();

  const [search, setSearch] = React.useState('');
  const [filterDepts, setFilterDepts] = React.useState<string[]>([]);
  const [filterActive, setFilterActive] = React.useState(false);
  const [page, setPage] = React.useState(() => typeof window !== 'undefined' ? Number(localStorage.getItem(LS_PAGE) ?? '1') : 1);
  const [perPage, setPerPage] = React.useState(() => typeof window !== 'undefined' ? Number(localStorage.getItem(LS_PER) ?? '10') : 10);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const activeDepts = departments.filter(d => d.isActive);
  const activeTemplates = templates.filter(t => t.isActive);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return requestTypes.filter(rt => {
      if (filterActive && !rt.isActive) return false;
      if (filterDepts.length && !filterDepts.includes(rt.departmentId)) return false;
      if (q && !rt.nameAr.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [requestTypes, search, filterDepts, filterActive]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  React.useEffect(() => { localStorage.setItem(LS_PAGE, String(page)); }, [page]);
  React.useEffect(() => { localStorage.setItem(LS_PER, String(perPage)); }, [perPage]);

  const openCreate = () => {
    setEditId(null);
    setDraft({ ...EMPTY, sortOrder: requestTypes.length + 1 });
    setError(null);
    setDrawerOpen(true);
  };

  const openEdit = (rt: HRRequestTypeEntity) => {
    setEditId(rt.id);
    setDraft({
      scope: rt.departmentId === HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID ? 'global' : 'specific',
      departmentId: rt.departmentId === HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID ? '' : rt.departmentId,
      nameAr: rt.nameAr, sortOrder: rt.sortOrder, isActive: rt.isActive,
      templateId: rt.templateId,
      approvalStages: rt.approvalStages ?? [],
    });
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!draft.nameAr.trim()) { setError('اسم نوع الطلب مطلوب'); return; }
    if (draft.scope === 'specific' && !draft.departmentId) { setError('يرجى اختيار القسم'); return; }
    const stageErr = validateApprovalStages(draft.approvalStages);
    if (stageErr) { setError(stageErr); return; }
    const payload = {
      departmentId: draft.scope === 'global' ? HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID : draft.departmentId,
      nameAr: draft.nameAr.trim(),
      nameEn: draft.nameAr.trim(),
      sortOrder: draft.sortOrder,
      isActive: draft.isActive,
      templateId: draft.templateId,
      approvalStages: draft.approvalStages,
    };
    if (editId) {
      const existing = requestTypes.find(r => r.id === editId);
      updateRequestType(editId, { ...payload, subtypes: existing?.subtypes ?? [] });
    } else {
      addRequestType({ ...payload, subtypes: [] });
    }
    setDrawerOpen(false);
  };

  const patch = <K extends keyof DraftForm>(k: K, v: DraftForm[K]) => setDraft(d => ({ ...d, [k]: v }));

  const getDeptLabel = (id: string) => {
    if (id === HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID) return 'جميع الأقسام';
    return activeDepts.find(d => d.id === id)?.nameAr ?? '—';
  };

  const tplOptions = [
    { value: '__none__', label: '— بدون قالب —' },
    ...activeTemplates.map(t => ({ value: t.id, label: `${t.nameAr}${t.isUniversalDefault ? ' ★' : ''}` })),
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="أنواع الطلبات" description="تعريف أنواع الطلبات لكل قسم أو لجميع الأقسام">
        <Button variant="luxe" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> نوع جديد
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Sidebar filters */}
        <div className="w-full shrink-0 sm:w-56 space-y-4 rounded-xl border border-border bg-card p-4 shadow-soft self-start">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">الفلاتر</p>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">بحث</Label>
            <div className="relative">
              <Search className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="الاسم…" className="pr-7 h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">الأقسام</Label>
            {activeDepts.map(d => (
              <label key={d.id} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={filterDepts.includes(d.id)}
                  onCheckedChange={v => {
                    setFilterDepts(prev => v ? [...prev, d.id] : prev.filter(id => id !== d.id));
                    setPage(1);
                  }}
                />
                {d.nameAr}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox checked={filterActive} onCheckedChange={v => { setFilterActive(v === true); setPage(1); }} />
            نشط فقط
          </label>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          {paginated.length === 0 ? (
            <EmptyState icon={Filter} title="لا توجد أنواع" description="أضف نوعاً جديداً أو عدّل الفلاتر" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 text-right">النطاق</th>
                    <th className="px-4 py-3 text-right">الاسم</th>
                    <th className="px-4 py-3 text-right">القالب</th>
                    <th className="px-4 py-3 text-right">مراحل الموافقة</th>
                    <th className="px-4 py-3 text-right">الحالة</th>
                    <th className="w-20 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(rt => {
                    const tpl = templates.find(t => t.id === rt.templateId);
                    return (
                      <tr key={rt.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground">{getDeptLabel(rt.departmentId)}</td>
                        <td className="px-4 py-3 font-medium">{rt.nameAr}</td>
                        <td className="px-4 py-3 text-xs">
                          {tpl ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
                              {tpl.nameAr}{tpl.isUniversalDefault ? ' ★' : ''}
                              <span className="text-muted-foreground font-normal">({tpl.formFields.length} حقل)</span>
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{rt.approvalStages?.length ?? 0} مرحلة</td>
                        <td className="px-4 py-3"><ActiveBadge active={rt.isActive} /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" type="button" onClick={() => openEdit(rt)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" type="button" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(rt.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} perPage={perPage} total={filtered.length} onPage={setPage} onPerPage={p => { setPerPage(p); setPage(1); }} />
        </div>
      </div>

      {/* Drawer */}
      <HRSettingsFormDrawer
        open={drawerOpen} onOpenChange={v => setDrawerOpen(v)}
        title={editId ? 'تعديل نوع الطلب' : 'إضافة نوع طلب'}
        onSave={handleSave} error={error} size="xl"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="نطاق التطبيق" span2>
            <div className="flex gap-2">
              {(['global', 'specific'] as const).map(s => (
                <button key={s} type="button" onClick={() => patch('scope', s)}
                  className={cn('flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all',
                    draft.scope === s ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border hover:border-border hover:bg-muted/20'
                  )}>
                  {s === 'global' ? 'جميع الأقسام' : 'قسم محدد'}
                </button>
              ))}
            </div>
          </FormField>
          {draft.scope === 'specific' && (
            <FormField label="القسم" required span2>
              <MinimalDropdown value={draft.departmentId} onChange={v => patch('departmentId', v)} options={activeDepts.map(d => ({ value: d.id, label: d.nameAr }))} placeholder="اختر القسم" />
            </FormField>
          )}
          <FormField label="الاسم بالعربية" required span2>
            <Input value={draft.nameAr} onChange={e => patch('nameAr', e.target.value)} placeholder="طلب إجازة" />
          </FormField>
          <FormField label="الترتيب">
            <Input type="number" min={0} value={draft.sortOrder} onChange={e => patch('sortOrder', Number(e.target.value))} />
          </FormField>
          <FormField label="القالب">
            <MinimalDropdown
              value={draft.templateId ?? '__none__'}
              onChange={v => patch('templateId', v === '__none__' ? null : v)}
              options={tplOptions}
            />
          </FormField>
          <FormField label="نشط" span2>
            <label className={cn('flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all', draft.isActive ? 'border-primary/30 bg-primary/5' : 'border-border')}>
              <span className="text-sm font-medium">نشط</span>
              <Switch checked={draft.isActive} onCheckedChange={v => patch('isActive', v)} />
            </label>
          </FormField>
        </div>
        <Separator />
        <HRRequestApprovalFlowEditor stages={draft.approvalStages} onChange={v => patch('approvalStages', v)} />
      </HRSettingsFormDrawer>

      <ConfirmationModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} title="حذف نوع الطلب" onConfirm={() => { if (deleteId) deleteRequestType(deleteId); setDeleteId(null); }} />
    </div>
  );
}
