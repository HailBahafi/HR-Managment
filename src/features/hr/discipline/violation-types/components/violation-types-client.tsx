'use client';

import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, ActiveBadge, MinimalDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { useViolationTypesDirectoryModel } from '@/features/hr/discipline/violation-types/hooks/useViolationTypesDirectoryModel';
import type { HRViolationDeductionKind } from '@/features/hr/discipline/lib/types';
import { DEDUCTION_KIND_LABELS } from '@/features/hr/discipline/lib/types';
import { cn } from '@/shared/utils';

const DEDUCTION_KIND_OPTIONS = (Object.entries(DEDUCTION_KIND_LABELS) as [HRViolationDeductionKind, string][]).map(([v, l]) => ({ value: v, label: l }));

export function ViolationTypesClient() {
  const m = useViolationTypesDirectoryModel();

  return (
    <div className="space-y-4">
      {m.listError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive whitespace-pre-wrap">{m.listError}</p>
      ) : null}
      <div className="flex justify-end">
        <Button variant="luxe" size="sm" onClick={m.openCreate} disabled={m.loading}>
          <Plus className="h-4 w-4 ml-1" />إضافة نوع
        </Button>
      </div>

      {m.loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">جاري التحميل...</p>
      ) : m.types.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="لا توجد أنواع مخالفات" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {m.types.map(t => (
            <div
              key={t.id}
              className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col cursor-pointer"
              onClick={() => m.openEdit(t)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold truncate min-w-0">{t?.nameAr ?? '—'}</p>
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
                <Button variant="ghost" size="sm" className="gap-1.5 flex-1" onClick={() => m.openEdit(t)}>
                  <Pencil className="h-3.5 w-3.5" /> تعديل
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => m.setDeleteId(t.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <HRSettingsFormDrawer
        open={m.drawerOpen}
        onOpenChange={m.setDrawerOpen}
        title={m.editId ? 'تعديل نوع مخالفة' : 'إضافة نوع مخالفة'}
        size="lg"
        onSave={() => void m.handleSave()}
        error={m.formError}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="الاسم" required span2>
            <Input value={m.draft.nameAr} onChange={e => m.set({ nameAr: e.target.value })} placeholder="أدخل الاسم…" />
          </FormField>
        </div>

        <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">متطلبات</p>
          <div className="flex items-center justify-between">
            <span className="text-sm">يحتاج إنذار</span>
            <Switch checked={m.draft.needsWarning} onCheckedChange={v => m.set({ needsWarning: v })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">يحتاج تحقيق</span>
            <Switch checked={m.draft.needsInvestigation} onCheckedChange={v => m.set({ needsInvestigation: v })} />
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">يحتاج مخالفة</p>
              <Switch checked={m.draft.hasDeduction} onCheckedChange={v => m.set({ hasDeduction: v })} />
            </div>
            {m.draft.hasDeduction && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FormField label="نوع الاستقطاع">
                  <MinimalDropdown
                    value={m.draft.deductionKind}
                    onChange={v => m.set({ deductionKind: v as HRViolationDeductionKind })}
                    options={DEDUCTION_KIND_OPTIONS.filter(o => o.value !== 'none')}
                  />
                </FormField>
                <FormField label="القيمة">
                  <Input type="number" min={0} value={m.draft.deductionValue} onChange={e => m.set({ deductionValue: Number(e.target.value) })} />
                </FormField>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <span className="text-sm font-medium">الحالة (نشط)</span>
          <Switch checked={m.draft.isActive} onCheckedChange={v => m.set({ isActive: v })} />
        </div>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!m.deleteId}
        onOpenChange={v => !v && m.setDeleteId(null)}
        onConfirm={() => void m.handleDelete()}
        title="حذف نوع المخالفة"
        description="هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟"
      />
    </div>
  );
}
