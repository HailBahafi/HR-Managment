'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, ActiveBadge, SearchableDropdown, MinimalDropdown,
} from '@/components/hr-requests/shared-ui';
import { useHRDisciplineApprovalAssignmentTemplatesStore } from '@/lib/hr-discipline/discipline-approval-store';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import type { HRApprovalAssignmentTemplate, HRApprovalTemplateStage, HRApprovalStageMode } from '@/lib/hr-requests/types';
import { cn } from '@/lib/utils';

function uid() { return `dats-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

const MODE_OPTIONS: { value: HRApprovalStageMode; label: string }[] = [
  { value: 'sequential', label: 'تسلسلي' },
  { value: 'parallel', label: 'متوازٍ' },
  { value: 'any_one', label: 'معتمد' },
  { value: 'optional', label: 'اختياري' },
];

interface DraftForm { nameAr: string; description: string; isActive: boolean; stages: HRApprovalTemplateStage[]; }
const EMPTY: DraftForm = { nameAr: '', description: '', isActive: true, stages: [] };

function StageEditor({ stage, index, onChange, onRemove }: {
  stage: HRApprovalTemplateStage; index: number;
  onChange: (s: HRApprovalTemplateStage) => void; onRemove: () => void;
}) {
  const { activeEmployees } = useHREmployeeDirectoryStore();
  const empOptions = activeEmployees.map(e => ({ value: e.id, label: e.nameAr, sub: e.jobTitleAr }));
  const available = empOptions.filter(o => !stage.approvers.find(a => a.employeeId === o.value));

  return (
    <div className="rounded-xl border-2 border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{index + 1}</span>
        <div className="flex-1">
          <MinimalDropdown value={stage.mode} onChange={v => onChange({ ...stage, mode: v as HRApprovalStageMode })} options={MODE_OPTIONS} />
        </div>
        <Button variant="ghost" size="icon" type="button" className="h-8 w-8 text-destructive" onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {stage.approvers.map(a => {
            const emp = activeEmployees.find(e => e.id === a.employeeId);
            return (
              <span key={a.employeeId} className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-pointer', a.mandatory ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground')}
                onClick={() => onChange({ ...stage, approvers: stage.approvers.map(ap => ap.employeeId === a.employeeId ? { ...ap, mandatory: !ap.mandatory } : ap) })}>
                {emp?.nameAr ?? a.employeeId}
                <button type="button" onClick={e => { e.stopPropagation(); onChange({ ...stage, approvers: stage.approvers.filter(ap => ap.employeeId !== a.employeeId) }); }}>
                  <X className="h-3 w-3 hover:text-destructive" />
                </button>
              </span>
            );
          })}
        </div>
        <SearchableDropdown value="" onChange={id => { if (!id) return; onChange({ ...stage, approvers: [...stage.approvers, { employeeId: id, mandatory: true }] }); }} options={available} placeholder="إضافة معتمد…" />
      </div>
    </div>
  );
}

export function DisciplineApprovalClient() {
  const { templates, add, update, remove } = useHRDisciplineApprovalAssignmentTemplatesStore();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const filtered = templates;

  const openCreate = () => { setEditId(null); setDraft({ ...EMPTY }); setError(null); setDrawerOpen(true); };
  const openEdit = (t: HRApprovalAssignmentTemplate) => { setEditId(t.id); setDraft({ nameAr: t.nameAr, description: t.description ?? '', isActive: t.isActive, stages: t.stages }); setError(null); setDrawerOpen(true); };

  const handleSave = () => {
    if (!draft.nameAr.trim()) { setError('اسم القالب مطلوب'); return; }
    const result = editId ? update(editId, draft) : add(draft);
    if (!result.ok) { setError(result.error ?? 'خطأ'); return; }
    toast.success(editId ? 'تم تحديث القالب' : 'تمت إضافة القالب');
    setDrawerOpen(false);
  };

  const patch = <K extends keyof DraftForm>(k: K, v: DraftForm[K]) => setDraft(d => ({ ...d, [k]: v }));
  const addStage = () => patch('stages', [...draft.stages, { id: uid(), sortOrder: draft.stages.length + 1, mode: 'sequential' as HRApprovalStageMode, approvers: [] }]);
  const updateStage = (i: number, s: HRApprovalTemplateStage) => patch('stages', draft.stages.map((st, idx) => idx === i ? s : st));
  const removeStage = (i: number) => patch('stages', draft.stages.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="luxe" size="sm" onClick={openCreate}><Plus className="h-4 w-4 ml-1" />قالب جديد</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="لا توجد قوالب" description="أضف قالباً لتعريف سلسلة موافقة" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(t => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{t.nameAr}</p>
                  {t.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
                </div>
                <ActiveBadge active={t.isActive} />
              </div>
              <p className="text-xs text-muted-foreground">{t.stages.length} مرحلة اعتماد</p>
              <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" />تعديل</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <HRSettingsFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editId ? 'تعديل قالب الاعتماد' : 'قالب اعتماد جديد'} size="lg" onSave={handleSave} error={error}>
        <FormField label="اسم القالب" required>
          <Input value={draft.nameAr} onChange={e => patch('nameAr', e.target.value)} placeholder="اسم القالب…" />
        </FormField>
        <FormField label="وصف">
          <Input value={draft.description} onChange={e => patch('description', e.target.value)} placeholder="وصف مختصر…" />
        </FormField>
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <span className="text-sm">نشط</span>
          <Switch checked={draft.isActive} onCheckedChange={v => patch('isActive', v)} />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">مراحل الاعتماد</p>
            <Button variant="outline" size="sm" onClick={addStage}><Plus className="h-3.5 w-3.5 ml-1" />إضافة مرحلة</Button>
          </div>
          {draft.stages.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا توجد مراحل. أضف مرحلة لتعريف سلسلة الاعتماد.</p>}
          {draft.stages.map((stage, i) => (
            <StageEditor key={stage.id} stage={stage} index={i} onChange={s => updateStage(i, s)} onRemove={() => removeStage(i)} />
          ))}
        </div>
      </HRSettingsFormDrawer>

      <ConfirmationModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} onConfirm={() => { if (deleteId) { remove(deleteId); toast.success('تم الحذف'); setDeleteId(null); } }} title="حذف القالب" />
    </div>
  );
}
