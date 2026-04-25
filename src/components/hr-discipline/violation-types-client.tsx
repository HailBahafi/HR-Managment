'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Search, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  PageHeader, EmptyState, ActiveBadge, MinimalDropdown, Pagination,
} from '@/components/hr-requests/shared-ui';
import { useHRViolationTypesStore } from '@/lib/hr-discipline/violation-types-store';
import { useHRDisciplineApprovalAssignmentTemplatesStore } from '@/lib/hr-discipline/discipline-approval-store';
import type { HRViolationTypeRecord, HRViolationDeductionKind } from '@/lib/hr-discipline/types';
import { DEDUCTION_KIND_LABELS } from '@/lib/hr-discipline/types';
import { cn } from '@/lib/utils';

const DEDUCTION_KIND_OPTIONS = (Object.entries(DEDUCTION_KIND_LABELS) as [HRViolationDeductionKind, string][]).map(([v, l]) => ({ value: v, label: l }));

interface DraftForm {
  code: string; nameAr: string; nameEn: string; sortOrder: number; isActive: boolean;
  hasDeduction: boolean; deductionKind: HRViolationDeductionKind; deductionValue: number;
  needsWarning: boolean; needsInvestigation: boolean; needsApproval: boolean;
  approvalTemplateId: string | null;
}

const EMPTY: DraftForm = {
  code: '', nameAr: '', nameEn: '', sortOrder: 1, isActive: true,
  hasDeduction: false, deductionKind: 'none', deductionValue: 0,
  needsWarning: false, needsInvestigation: false, needsApproval: false,
  approvalTemplateId: null,
};

export function ViolationTypesClient() {
  const { types, add, update, remove } = useHRViolationTypesStore();
  const { templates } = useHRDisciplineApprovalAssignmentTemplatesStore();

  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const filtered = types.filter(t =>
    t.nameAr.includes(q) || t.code.toLowerCase().includes(q.toLowerCase()) || t.nameEn.toLowerCase().includes(q.toLowerCase())
  );
  const total = filtered.length;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  React.useEffect(() => { setPage(1); }, [q]);

  const openCreate = () => { setDraft(EMPTY); setEditId(null); setFormError(null); setDrawerOpen(true); };
  const openEdit = (t: HRViolationTypeRecord) => {
    setDraft({ code:t.code, nameAr:t.nameAr, nameEn:t.nameEn, sortOrder:t.sortOrder, isActive:t.isActive, hasDeduction:t.hasDeduction, deductionKind:t.deductionKind, deductionValue:t.deductionValue, needsWarning:t.needsWarning, needsInvestigation:t.needsInvestigation, needsApproval:t.needsApproval, approvalTemplateId:t.approvalTemplateId });
    setEditId(t.id); setFormError(null); setDrawerOpen(true);
  };

  const set = (patch: Partial<DraftForm>) => setDraft(d => ({ ...d, ...patch }));

  const handleSave = () => {
    setFormError(null);
    const payload = {
      ...draft,
      deductionKind: draft.hasDeduction ? draft.deductionKind : 'none' as HRViolationDeductionKind,
      deductionValue: draft.hasDeduction ? draft.deductionValue : 0,
      approvalTemplateId: draft.needsApproval ? draft.approvalTemplateId : null,
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

  const templateOptions = templates.filter(t => t.isActive).map(t => ({ value: t.id, label: t.nameAr }));

  return (
    <div className="space-y-4">
      <PageHeader title="أنواع المخالفات" description="تعريف أنواع المخالفات الوظيفية وإعداداتها">
        <Button variant="luxe" size="sm" onClick={openCreate}><Plus className="h-4 w-4 ml-1" />إضافة نوع</Button>
      </PageHeader>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث…" className="pr-9" />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الرمز</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الاسم</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الاستقطاع</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">علامات</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">الحالة</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.length === 0 && (
              <tr><td colSpan={6}><EmptyState icon={AlertTriangle} title="لا توجد أنواع مخالفات" /></td></tr>
            )}
            {paged.map(t => (
              <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{t.code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{t.nameAr}</div>
                  <div className="text-xs text-muted-foreground">{t.nameEn}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {t.hasDeduction ? `${DEDUCTION_KIND_LABELS[t.deductionKind]} (${t.deductionValue})` : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-2">
                    {t.needsWarning ? <CheckCircle2 className="h-4 w-4 text-amber-500" /> : <XCircle className="h-4 w-4 text-muted-foreground/30" />}
                    {t.needsInvestigation ? <CheckCircle2 className="h-4 w-4 text-blue-500" /> : <XCircle className="h-4 w-4 text-muted-foreground/30" />}
                    {t.needsApproval ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-muted-foreground/30" />}
                  </div>
                </td>
                <td className="px-4 py-3"><ActiveBadge active={t.isActive} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 0 && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {paged.length === 0 && <EmptyState icon={AlertTriangle} title="لا توجد أنواع مخالفات" />}
        {paged.map(t => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{t.code}</span>
                  <ActiveBadge active={t.isActive} />
                </div>
                <div className="mt-1 font-medium">{t.nameAr}</div>
                <div className="text-xs text-muted-foreground">{t.nameEn}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            {t.hasDeduction && (
              <div className="text-xs text-muted-foreground">الاستقطاع: {DEDUCTION_KIND_LABELS[t.deductionKind]} ({t.deductionValue})</div>
            )}
          </div>
        ))}
        {total > perPage && <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={setPerPage} />}
      </div>

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
          <FormField label="الرمز" required>
            <Input value={draft.code} onChange={e => set({ code: e.target.value })} placeholder="مثال: LATE" className="uppercase" />
          </FormField>
          <FormField label="الترتيب">
            <Input type="number" value={draft.sortOrder} onChange={e => set({ sortOrder: Number(e.target.value) })} min={1} />
          </FormField>
          <FormField label="الاسم بالعربية" required span2>
            <Input value={draft.nameAr} onChange={e => set({ nameAr: e.target.value })} placeholder="أدخل الاسم…" />
          </FormField>
          <FormField label="الاسم بالإنجليزية" span2>
            <Input value={draft.nameEn} onChange={e => set({ nameEn: e.target.value })} placeholder="Enter name…" dir="ltr" />
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
          <div className="flex items-center justify-between">
            <span className="text-sm">يحتاج اعتماد</span>
            <Switch checked={draft.needsApproval} onCheckedChange={v => set({ needsApproval: v })} />
          </div>
          {draft.needsApproval && (
            <FormField label="قالب الاعتماد">
              <MinimalDropdown
                value={draft.approvalTemplateId ?? ''}
                onChange={v => set({ approvalTemplateId: v || null })}
                options={[{ value: '', label: 'بدون قالب محدد' }, ...templateOptions]}
              />
            </FormField>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">الاستقطاع</p>
            <Switch checked={draft.hasDeduction} onCheckedChange={v => set({ hasDeduction: v })} />
          </div>
          {draft.hasDeduction && (
            <div className="grid gap-3 sm:grid-cols-2">
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
