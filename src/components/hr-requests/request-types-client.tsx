'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { usePageFilters } from '@/components/filter-panel-context';
import {
  MinimalDropdown, ConfirmationModal, HRSettingsFormDrawer,
  FormField, ActiveBadge,
} from './shared-ui';
import { HRRequestApprovalFlowEditor } from './approval-flow-editor';
import { useHRConfigurationStore } from '@/lib/hr-requests/configuration-store';
import { useHRApprovalAssignmentTemplatesStore } from '@/lib/hr-requests/approval-assignment-store';
import type { HRRequestTypeEntity, HRApprovalStage } from '@/lib/hr-requests/types';
import { HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID, validateApprovalStages } from '@/lib/hr-requests/types';
import { cn } from '@/lib/utils';

interface DraftForm {
  scope: 'specific' | 'global';
  departmentId: string;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
  templateId: string | null;
  approvalAssignmentTemplateId: string | null;
  approvalStages: HRApprovalStage[];
}

const EMPTY: DraftForm = {
  scope: 'global',
  departmentId: '',
  nameAr: '',
  sortOrder: 1,
  isActive: true,
  templateId: null,
  approvalAssignmentTemplateId: null,
  approvalStages: [],
};

export function RequestTypesClient() {
  const { departments, requestTypes, templates, addRequestType, updateRequestType, deleteRequestType } = useHRConfigurationStore();
  const approvalAssignmentTemplates = useHRApprovalAssignmentTemplatesStore(s => s.templates);

  const { values } = usePageFilters([
    { key: 'q', label: 'بحث', type: 'text', placeholder: 'الاسم…' },
    { key: 'active', label: 'الحالة', type: 'select', options: [{ value: 'active', label: 'نشط فقط' }] },
  ]);
  const search = (values.q as string) ?? '';
  const filterDepts: string[] = [];
  const filterActive = (values.active as string) === 'active';
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const activeDepts = departments.filter(d => d.isActive);
  const activeTemplates = templates.filter(t => t.isActive);
  const activeApprovalAssignmentTemplates = React.useMemo(
    () => approvalAssignmentTemplates.filter(t => t.isActive).sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar')),
    [approvalAssignmentTemplates],
  );

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return requestTypes.filter(rt => {
      if (filterActive && !rt.isActive) return false;
      if (filterDepts.length && !filterDepts.includes(rt.departmentId)) return false;
      if (q && !rt.nameAr.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [requestTypes, search, filterDepts, filterActive]);

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
      approvalAssignmentTemplateId: rt.approvalAssignmentTemplateId ?? null,
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
      approvalAssignmentTemplateId: draft.approvalAssignmentTemplateId,
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

  const aaTplOptions = [
    { value: '__none__', label: '— بدون قالب موافقات —' },
    ...activeApprovalAssignmentTemplates.map(t => ({ value: t.id, label: t.nameAr })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="luxe" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> نوع جديد
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <Filter className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد أنواع. أضف نوعاً جديداً أو عدّل الفلاتر</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(rt => {
              const tpl = templates.find(t => t.id === rt.templateId);
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
                    {tpl ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                        {tpl.nameAr}{tpl.isUniversalDefault ? ' ★' : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">بدون قالب</span>
                    )}
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
      )}

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
          <FormField label="الاسم" required span2>
            <Input value={draft.nameAr} onChange={e => patch('nameAr', e.target.value)} placeholder="طلب إجازة" />
          </FormField>
          <FormField label="قالب النموذج">
            <MinimalDropdown
              value={draft.templateId ?? '__none__'}
              onChange={v => patch('templateId', v === '__none__' ? null : v)}
              options={tplOptions}
            />
          </FormField>
          <FormField label="قالب إسناد الموافقات">
            <MinimalDropdown
              value={draft.approvalAssignmentTemplateId ?? '__none__'}
              onChange={v => patch('approvalAssignmentTemplateId', v === '__none__' ? null : v)}
              options={aaTplOptions}
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
