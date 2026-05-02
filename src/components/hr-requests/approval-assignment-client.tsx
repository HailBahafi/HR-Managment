'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, ActiveBadge, SearchableDropdown, MinimalDropdown,
} from './shared-ui';
import { useHRApprovalAssignmentTemplatesStore } from '@/lib/hr-requests/approval-assignment-store';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import type { HRApprovalAssignmentTemplate, HRApprovalTemplateStage, HRApprovalStageMode } from '@/lib/hr-requests/types';
import { cn } from '@/lib/utils';

function uid() { return `ats-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

const MODE_OPTIONS: { value: HRApprovalStageMode; label: string }[] = [
  { value: 'sequential', label: 'تسلسلي' },
  { value: 'parallel', label: 'متوازٍ' },
  { value: 'any_one', label: 'معتمد' },
  { value: 'optional', label: 'اختياري' },
];

interface DraftForm {
  nameAr: string;
  description: string;
  isActive: boolean;
  stages: HRApprovalTemplateStage[];
}

const EMPTY: DraftForm = { nameAr: '', description: '', isActive: true, stages: [] };

function StageEditor({ stage, index, total, onChange, onRemove }: {
  stage: HRApprovalTemplateStage; index: number; total: number;
  onChange: (s: HRApprovalTemplateStage) => void; onRemove: () => void;
}) {
  const { activeEmployees } = useHREmployeeDirectoryStore();
  const empOptions = activeEmployees.map(e => ({ value: e.id, label: e.nameAr, sub: e.jobTitleAr }));
  const available = empOptions.filter(o => !stage.approvers.find(a => a.employeeId === o.value));

  const addApprover = (id: string) => {
    if (!id) return;
    onChange({ ...stage, approvers: [...stage.approvers, { employeeId: id, mandatory: true }] });
  };

  const removeApprover = (id: string) => onChange({ ...stage, approvers: stage.approvers.filter(a => a.employeeId !== id) });

  const toggleMandatory = (id: string) => onChange({
    ...stage,
    approvers: stage.approvers.map(a => a.employeeId === id ? { ...a, mandatory: !a.mandatory } : a),
  });

  return (
    <div className="rounded-xl border-2 border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{index + 1}</span>
        <div className="flex-1">
          <MinimalDropdown value={stage.mode} onChange={v => onChange({ ...stage, mode: v as HRApprovalStageMode })} options={MODE_OPTIONS} />
        </div>
        {stage.mode === 'optional' && (
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">مهلة (ساعة)</Label>
            <Input type="number" min={0} className="h-8 w-20 text-xs"
              value={stage.optionalTimeoutHours ?? ''}
              onChange={e => onChange({ ...stage, optionalTimeoutHours: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        )}
        <Button variant="ghost" size="icon" type="button" className="h-8 w-8 text-destructive" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {stage.approvers.map(a => {
            const emp = activeEmployees.find(e => e.id === a.employeeId);
            return (
              <span key={a.employeeId} className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-pointer', a.mandatory ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground')}
                onClick={() => toggleMandatory(a.employeeId)} title={a.mandatory ? 'إلزامي — انقر للتبديل' : 'اختياري — انقر للتبديل'}>
                {emp?.nameAr ?? a.employeeId}
                <button type="button" onClick={e => { e.stopPropagation(); removeApprover(a.employeeId); }}>
                  <X className="h-3 w-3 hover:text-destructive" />
                </button>
              </span>
            );
          })}
        </div>
        <SearchableDropdown value="" onChange={addApprover} options={available} placeholder="إضافة معتمد…" />
        <p className="text-[10px] text-muted-foreground">انقر على اسم المعتمد للتبديل بين إلزامي / اختياري</p>
      </div>
    </div>
  );
}

export function ApprovalAssignmentClient() {
  const { templates, add, update, remove } = useHRApprovalAssignmentTemplatesStore();

  const [page, setPage] = React.useState(1);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const PER = 9;
  const filtered = templates;
  const paginated = filtered.slice((page - 1) * PER, page * PER);
  const pages = Math.max(1, Math.ceil(filtered.length / PER));

  const openCreate = () => { setEditId(null); setDraft({ ...EMPTY }); setError(null); setDrawerOpen(true); };
  const openEdit = (t: HRApprovalAssignmentTemplate) => {
    setEditId(t.id);
    setDraft({ nameAr: t.nameAr, description: t.description ?? '', isActive: t.isActive, stages: t.stages });
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!draft.nameAr.trim()) { setError('اسم القالب مطلوب'); return; }
    const payload = { ...draft, nameAr: draft.nameAr.trim() };
    const result = editId ? update(editId, payload) : add(payload);
    if (!result.ok) { setError(result.error ?? 'خطأ غير معروف'); return; }
    setDrawerOpen(false);
  };

  const patch = <K extends keyof DraftForm>(k: K, v: DraftForm[K]) => setDraft(d => ({ ...d, [k]: v }));

  const addStage = () => patch('stages', [...draft.stages, { id: uid(), sortOrder: draft.stages.length + 1, mode: 'sequential', approvers: [] }]);
  const updateStage = (i: number, s: HRApprovalTemplateStage) => patch('stages', draft.stages.map((st, idx) => idx === i ? s : st));
  const removeStage = (i: number) => patch('stages', draft.stages.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="luxe" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> قالب جديد
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="لا توجد قوالب" description="أضف قالباً لتعريف سلسلة موافقة قابلة للإعادة" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map(t => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{t.nameAr}</p>
                  {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>}
                </div>
                <ActiveBadge active={t.isActive} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {t.stages.map((s, i) => (
                  <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium">
                    {i + 1}. {MODE_OPTIONS.find(m => m.value === s.mode)?.label} ({s.approvers.length})
                  </span>
                ))}
                {t.stages.length === 0 && <span className="text-xs text-muted-foreground">بدون مراحل</span>}
              </div>
              <div className="mt-auto flex gap-1 border-t border-border pt-3">
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

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
          <span className="text-sm text-muted-foreground self-center">{page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>التالي</Button>
        </div>
      )}

      <HRSettingsFormDrawer
        open={drawerOpen} onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل قالب الموافقة' : 'قالب موافقة جديد'}
        description="هذه القوالب ستُربط بأنواع الطلبات لاحقاً"
        onSave={handleSave} error={error} size="xl"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="اسم القالب" required span2>
            <Input value={draft.nameAr} onChange={e => patch('nameAr', e.target.value)} placeholder="سلسلة الموافقة القياسية" />
          </FormField>
          <FormField label="الوصف" span2>
            <Input value={draft.description} onChange={e => patch('description', e.target.value)} placeholder="وصف مختصر للاستخدام" />
          </FormField>
          <FormField label="الحالة" span2>
            <label className={cn('flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all', draft.isActive ? 'border-primary/30 bg-primary/5' : 'border-border')}>
              <span className="text-sm font-medium">نشط</span>
              <Switch checked={draft.isActive} onCheckedChange={v => patch('isActive', v)} />
            </label>
          </FormField>
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">مراحل الموافقة <span className="text-muted-foreground font-normal">({draft.stages.length})</span></p>
            <Button variant="outline" size="sm" type="button" className="gap-1.5" onClick={addStage}>
              <Plus className="h-4 w-4" /> إضافة مرحلة
            </Button>
          </div>
          {draft.stages.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border py-6 text-center text-sm text-muted-foreground">
              لا توجد مراحل. أضف مرحلة للبدء.
            </div>
          )}
          {draft.stages.map((s, i) => (
            <StageEditor key={s.id} stage={s} index={i} total={draft.stages.length} onChange={upd => updateStage(i, upd)} onRemove={() => removeStage(i)} />
          ))}
        </div>
      </HRSettingsFormDrawer>

      <ConfirmationModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} title="حذف قالب الموافقة" onConfirm={() => { if (deleteId) remove(deleteId); setDeleteId(null); }} />
    </div>
  );
}
