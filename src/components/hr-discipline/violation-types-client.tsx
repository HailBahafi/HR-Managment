'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, ActiveBadge, MinimalDropdown,
} from '@/components/hr-requests/shared-ui';
import { useHRViolationTypesStore } from '@/lib/hr-discipline/violation-types-store';
import type { HRViolationTypeRecord, HRViolationDeductionKind } from '@/lib/hr-discipline/types';
import { DEDUCTION_KIND_LABELS } from '@/lib/hr-discipline/types';
import { cn } from '@/lib/utils';

const DEDUCTION_KIND_OPTIONS = (Object.entries(DEDUCTION_KIND_LABELS) as [HRViolationDeductionKind, string][]).map(([v, l]) => ({ value: v, label: l }));

function makeViolationTypeCode() {
  return `VT-${Date.now().toString(36).toUpperCase()}`;
}

interface DraftForm {
  code: string; nameAr: string; sortOrder: number; isActive: boolean;
  hasDeduction: boolean; deductionKind: HRViolationDeductionKind; deductionValue: number;
  needsWarning: boolean; needsInvestigation: boolean;
}

const EMPTY: DraftForm = {
  code: '', nameAr: '', sortOrder: 1, isActive: true,
  hasDeduction: false, deductionKind: 'none', deductionValue: 0,
  needsWarning: false, needsInvestigation: false,
};

export function ViolationTypesClient() {
  const { types, add, update, remove } = useHRViolationTypesStore();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const filtered = types;


  const openCreate = () => { setDraft(EMPTY); setEditId(null); setFormError(null); setDrawerOpen(true); };
  const openEdit = (t: HRViolationTypeRecord) => {
    setDraft({
      code: t.code,
      nameAr: t.nameAr,
      sortOrder: t.sortOrder,
      isActive: t.isActive,
      hasDeduction: t.hasDeduction,
      deductionKind: t.deductionKind,
      deductionValue: t.deductionValue,
      needsWarning: t.needsWarning,
      needsInvestigation: t.needsInvestigation,
    });
    setEditId(t.id); setFormError(null); setDrawerOpen(true);
  };

  const set = (patch: Partial<DraftForm>) => setDraft(d => ({ ...d, ...patch }));

  const handleSave = () => {
    setFormError(null);
    const payload = {
      ...draft,
      code: editId ? draft.code : makeViolationTypeCode(),
      sortOrder: editId ? draft.sortOrder : types.length + 1,
      nameEn: draft.nameAr.trim(),
      deductionKind: draft.hasDeduction ? draft.deductionKind : 'none' as HRViolationDeductionKind,
      deductionValue: draft.hasDeduction ? draft.deductionValue : 0,
      needsApproval: false,
      approvalTemplateId: null,
    };
    const result = editId ? update(editId, payload) : add(payload);
    if (!result.ok) { setFormError(result.error ?? 'خطأ'); return; }
    toast.success(editId ? 'تم تحديث نوع المخالفة' : 'تمت إضافة نوع المخالفة');
    setDrawerOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    remove(deleteId);
    toast.success('تم الحذف');
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="luxe" size="sm" onClick={openCreate}><Plus className="h-4 w-4 ml-1" />إضافة نوع</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="لا توجد أنواع مخالفات" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(t => (
            <div
              key={t.id}
              className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col cursor-pointer"
              onClick={() => openEdit(t)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold truncate min-w-0">{t.nameAr}</p>
                <ActiveBadge active={t.isActive} />
              </div>
              {t.hasDeduction && (
                <p className="text-xs text-muted-foreground">يحتاج مخالفة: {DEDUCTION_KIND_LABELS[t.deductionKind]} ({t.deductionValue})</p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5', t.needsWarning ? 'border-amber-300/50 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : 'border-border bg-muted/30 text-muted-foreground/60')}>
                  {t.needsWarning ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} إنذار
                </span>
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5', t.needsInvestigation ? 'border-blue-300/50 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' : 'border-border bg-muted/30 text-muted-foreground/60')}>
                  {t.needsInvestigation ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} تحقيق
                </span>
              </div>
              <div className="mt-auto flex gap-1 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="gap-1.5 flex-1" onClick={() => openEdit(t)}>
                  <Pencil className="h-3.5 w-3.5" /> تعديل
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(t.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      <HRSettingsFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل نوع مخالفة' : 'إضافة نوع مخالفة'}
        size="lg"
        onSave={handleSave}
        error={formError}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="الاسم" required span2>
            <Input value={draft.nameAr} onChange={e => set({ nameAr: e.target.value })} placeholder="أدخل الاسم…" />
          </FormField>
        </div>

        <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">متطلبات</p>
          <div className="flex items-center justify-between">
            <span className="text-sm">يحتاج إنذار</span>
            <Switch checked={draft.needsWarning} onCheckedChange={v => set({ needsWarning: v })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">يحتاج تحقيق</span>
            <Switch checked={draft.needsInvestigation} onCheckedChange={v => set({ needsInvestigation: v })} />
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">يحتاج مخالفة</p>
              <Switch checked={draft.hasDeduction} onCheckedChange={v => set({ hasDeduction: v })} />
            </div>
            {draft.hasDeduction && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FormField label="نوع الاستقطاع">
                  <MinimalDropdown
                    value={draft.deductionKind}
                    onChange={v => set({ deductionKind: v as HRViolationDeductionKind })}
                    options={DEDUCTION_KIND_OPTIONS.filter(o => o.value !== 'none')}
                  />
                </FormField>
                <FormField label="القيمة">
                  <Input type="number" min={0} value={draft.deductionValue} onChange={e => set({ deductionValue: Number(e.target.value) })} />
                </FormField>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <span className="text-sm font-medium">الحالة (نشط)</span>
          <Switch checked={draft.isActive} onCheckedChange={v => set({ isActive: v })} />
        </div>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف نوع المخالفة"
        description="هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟"
      />
    </div>
  );
}
