'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, ActiveBadge, SearchableDropdown, MinimalDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import {
  useHRDisciplineApprovalAssignmentTemplatesStore,
  disciplineApprovalLinkedIds,
} from '@/features/hr/discipline/lib/discipline-approval-store';
import { useHRViolationTypesStore } from '@/features/hr/discipline/lib/violation-types-store';
import { useHREmployeeDirectoryStore } from '@/features/hr/requests/lib/employee-directory-store';
import {
  approvalStageModeLabelAr,
  type HRApprovalAssignmentTemplate,
  type HRApprovalTemplateStage,
  type HRApprovalStageMode,
} from '@/features/hr/requests/lib/types';
import type { HREmployeeDirectoryRow } from '@/features/hr/requests/lib/employee-directory-store';
import { cn } from '@/shared/utils';

function uid() { return `dats-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

const MODE_OPTIONS: { value: HRApprovalStageMode; label: string }[] = [
  { value: 'sequential', label: 'تسلسلي' },
  { value: 'parallel', label: 'متوازٍ' },
  { value: 'any_one', label: 'موافقة أحد المعتمدين' },
  { value: 'optional', label: 'اختياري' },
];

interface DraftForm {
  linkedIds: string[];
  isActive: boolean;
  stages: HRApprovalTemplateStage[];
}

function singleEmptyStage(): HRApprovalTemplateStage[] {
  return [{ id: uid(), sortOrder: 1, mode: 'sequential' as HRApprovalStageMode, approvers: [] }];
}

function stagesToSingle(stages: HRApprovalTemplateStage[]): HRApprovalTemplateStage[] {
  if (stages.length === 0) return singleEmptyStage();
  const sorted = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  const first = sorted[0]!;
  return [{ ...first, sortOrder: 1 }];
}

function buildNameAr(linkedIds: string[], violationTypes: { id: string; nameAr: string }[]): string {
  const names = linkedIds.map((id) => violationTypes.find((v) => v.id === id)?.nameAr ?? id);
  const joined = names.join(' · ');
  if (joined.length <= 140) return joined;
  return `${joined.slice(0, 137)}…`;
}

function approverNamesForStage(
  stage: HRApprovalTemplateStage,
  activeEmployees: HREmployeeDirectoryRow[],
): string[] {
  return stage.approvers.map((a) => activeEmployees.find((e) => e.id === a.employeeId)?.nameAr ?? a.employeeId);
}

function StageEditor({ stage, index, onChange, onRemove, showRemove = true }: {
  stage: HRApprovalTemplateStage; index: number;
  onChange: (s: HRApprovalTemplateStage) => void; onRemove: () => void;
  showRemove?: boolean;
}) {
  const employees = useHREmployeeDirectoryStore((s) => s.employees);
  const activeEmployees = React.useMemo(
    () => employees.filter((e) => e.status === 'active'),
    [employees],
  );
  const empOptions = activeEmployees.map(e => ({ value: e.id, label: e.nameAr, sub: e.jobTitleAr }));
  const available = empOptions.filter(o => !stage.approvers.find(a => a.employeeId === o.value));

  return (
    <div className="rounded-xl border-2 border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{index + 1}</span>
        <div className="flex-1">
          <MinimalDropdown value={stage.mode} onChange={v => onChange({ ...stage, mode: v as HRApprovalStageMode })} options={MODE_OPTIONS} />
        </div>
        {showRemove ? (
          <Button variant="ghost" size="icon" type="button" className="h-8 w-8 text-destructive" onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></Button>
        ) : (
          <span className="h-8 w-8 shrink-0" aria-hidden />
        )}
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
  const violationTypes = useHRViolationTypesStore((s) => s.types);
  const employees = useHREmployeeDirectoryStore((s) => s.employees);
  const activeEmployees = React.useMemo(
    () => employees.filter((e) => e.status === 'active'),
    [employees],
  );

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(() => ({
    linkedIds: [],
    isActive: true,
    stages: singleEmptyStage(),
  }));
  const [error, setError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [drawerContentEl, setDrawerContentEl] = React.useState<HTMLElement | null>(null);

  const usedLinkedIds = React.useMemo(() => {
    const set = new Set<string>();
    for (const tpl of templates) {
      if (tpl.id === editId) continue;
      for (const id of disciplineApprovalLinkedIds(tpl)) set.add(id);
    }
    return set;
  }, [templates, editId]);

  const violationMultiOptions = React.useMemo((): MultiSelectOption[] => {
    return violationTypes
      .filter((vt) => vt.isActive || draft.linkedIds.includes(vt.id))
      .map((vt) => ({
        value: vt.id,
        label: vt.nameAr,
        disabled: usedLinkedIds.has(vt.id) && !draft.linkedIds.includes(vt.id),
      }));
  }, [violationTypes, usedLinkedIds, draft.linkedIds]);

  const resolveLinkedLabel = React.useCallback((id: string) => {
    return violationTypes.find((v) => v.id === id)?.nameAr ?? id;
  }, [violationTypes]);

  const openCreate = () => {
    setEditId(null);
    setDraft({ linkedIds: [], isActive: true, stages: singleEmptyStage() });
    setError(null);
    setDrawerOpen(true);
  };

  const openEdit = (t: HRApprovalAssignmentTemplate) => {
    setEditId(t.id);
    setDraft({
      linkedIds: [...disciplineApprovalLinkedIds(t)],
      isActive: t.isActive,
      stages: stagesToSingle(t.stages),
    });
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    const stagesOne = stagesToSingle(draft.stages);
    const linked = [...new Set(draft.linkedIds.filter(Boolean))];
    if (linked.length === 0) {
      setError('اختر نوع مخالفة واحداً على الأقل');
      return;
    }

    const nameAr = buildNameAr(linked, violationTypes);
    const payload = {
      nameAr,
      description: '',
      assignmentLinkKind: 'violation' as const,
      assignmentLinkedIds: linked,
      violationTypeId: linked[0] ?? null,
      isActive: draft.isActive,
      stages: stagesOne,
    };

    const result = editId ? update(editId, payload) : add(payload);
    if (!result.ok) {
      setError(result.error ?? 'خطأ');
      return;
    }
    toast.success(editId ? 'تم تحديث الإسناد' : 'تم إنشاء الإسناد');
    setDrawerOpen(false);
  };

  const patch = <K extends keyof DraftForm>(k: K, v: DraftForm[K]) => setDraft(d => ({ ...d, [k]: v }));

  const moveLinked = (index: number, delta: number) => {
    setDraft((d) => {
      const arr = [...d.linkedIds];
      const j = index + delta;
      if (j < 0 || j >= arr.length) return d;
      const a = arr[index]!;
      const b = arr[j]!;
      arr[index] = b;
      arr[j] = a;
      return { ...d, linkedIds: arr };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="luxe" size="sm" onClick={openCreate}><Plus className="h-4 w-4 ml-1" />إسناد جديد</Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState title="لا توجد إسنادات" description="اربط أنواع المخالفات بمرحلة اعتماد واحدة." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((t) => {
            const linked = disciplineApprovalLinkedIds(t);
            return (
              <div key={t.id} className="flex flex-col space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-2">
                    <ol className="list-decimal space-y-1 pr-4 text-sm marker:text-muted-foreground">
                      {linked.map((id) => (
                        <li key={id} className="font-medium leading-snug">
                          {violationTypes.find((v) => v.id === id)?.nameAr ?? id}
                        </li>
                      ))}
                    </ol>
                    {linked.length === 0 ? (
                      <p className="text-xs text-muted-foreground">لا أنواع مرتبطة</p>
                    ) : null}
                  </div>
                  <ActiveBadge active={t.isActive} />
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/25 p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">التسلسل</p>
                  {[...t.stages].sort((a, b) => a.sortOrder - b.sortOrder).map((s, i) => {
                    const names = approverNamesForStage(s, activeEmployees);
                    return (
                      <div key={s.id} className="text-xs">
                        <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
                          <span className="font-semibold text-foreground">المرحلة {i + 1}</span>
                          <span className="text-muted-foreground">· {approvalStageModeLabelAr(s.mode)}</span>
                        </div>
                        {names.length > 0 ? (
                          <p className="mt-1 text-[11px] leading-relaxed text-foreground">{names.join('، ')}</p>
                        ) : (
                          <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">لا معتمدين في هذه المرحلة</p>
                        )}
                      </div>
                    );
                  })}
                  {t.stages.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">لا توجد مراحل</p>
                  ) : null}
                </div>
                <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" />تعديل</Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HRSettingsFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل إسناد الموافقات' : 'إسناد موافقات جديد'}
        size="lg"
        onSave={handleSave}
        error={error}
        contentRef={setDrawerContentEl}
      >
        <FormField label="أنواع المخالفات" required>
          <MultiSelect
            options={violationMultiOptions}
            value={draft.linkedIds}
            onChange={(next) => patch('linkedIds', next)}
            placeholder="اختر نوعاً أو أكثر…"
            searchPlaceholder="بحث في أنواع المخالفات…"
            emptyMessage="لا توجد أنواع مطابقة"
            selectAllLabel="تحديد الكل المتاح"
            deselectAllLabel="إلغاء التحديد"
            listMaxHeight="min(260px,40vh)"
            popoverPortalContainer={drawerContentEl}
          />
        </FormField>

        {draft.linkedIds.length > 0 ? (
          <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold text-muted-foreground">ترتيب العرض في البطاقة</p>
            <ul className="space-y-1.5">
              {draft.linkedIds.map((id, idx) => (
                <li key={id} className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{resolveLinkedLabel(id)}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" disabled={idx === 0} onClick={() => moveLinked(idx, -1)} aria-label="أعلى">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" disabled={idx === draft.linkedIds.length - 1} onClick={() => moveLinked(idx, 1)} aria-label="أسفل">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-[11px] text-muted-foreground -mt-1">
          يُحفظ إسناد واحد يضم كل أنواع المخالفات المحددة مع نفس مرحلة الاعتماد. لا يُكرّر نفس النوع في إسناد آخر.
        </p>

        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <span className="text-sm">نشط</span>
          <Switch checked={draft.isActive} onCheckedChange={v => patch('isActive', v)} />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">مرحلة الاعتماد</p>
            <span className="text-[11px] text-muted-foreground">مرحلة واحدة فقط</span>
          </div>
          {draft.stages[0] ? (
            <StageEditor
              key={draft.stages[0].id}
              stage={stagesToSingle(draft.stages)[0]!}
              index={0}
              onChange={(s) => patch('stages', [{ ...s, sortOrder: 1 }])}
              onRemove={() => {}}
              showRemove={false}
            />
          ) : null}
        </div>
      </HRSettingsFormDrawer>

      <ConfirmationModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} onConfirm={() => { if (deleteId) { remove(deleteId); toast.success('تم الحذف'); setDeleteId(null); } }} title="حذف الإسناد" />
    </div>
  );
}
