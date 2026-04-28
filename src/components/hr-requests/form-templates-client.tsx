'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { usePageFilters } from '@/components/filter-panel-context';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  ActiveBadge,
} from './shared-ui';
import { HRRequestTypeTemplateFieldsEditor } from './template-fields-editor';
import { HRRequestTemplateFieldsForm } from './template-fields-form';
import { useHRConfigurationStore } from '@/lib/hr-requests/configuration-store';
import type { HRRequestTemplateEntity, HRRequestFieldDefinition } from '@/lib/hr-requests/types';
import { cn } from '@/lib/utils';

interface DraftForm {
  nameAr: string; sortOrder: number; isActive: boolean;
  isUniversalDefault: boolean; formFields: HRRequestFieldDefinition[];
}

const EMPTY: DraftForm = { nameAr: '', sortOrder: 1, isActive: true, isUniversalDefault: false, formFields: [] };

type FilterKind = 'all' | 'universal' | 'custom';

export function FormTemplatesClient() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useHRConfigurationStore();

  const { values } = usePageFilters([
    { key: 'q', label: 'بحث', type: 'text', placeholder: 'بحث بالاسم…' },
    { key: 'kind', label: 'النوع', type: 'select', options: [{ value: 'universal', label: 'شامل' }, { value: 'custom', label: 'مخصص' }] },
    { key: 'active', label: 'الحالة', type: 'select', options: [{ value: 'active', label: 'نشط فقط' }] },
  ]);
  const search = (values.q as string) ?? '';
  const filterKind = ((values.kind as FilterKind) || 'all');
  const filterActive = (values.active as string) === 'active';

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [previewTpl, setPreviewTpl] = React.useState<HRRequestTemplateEntity | null>(null);
  const [previewValues, setPreviewValues] = React.useState<Record<string, unknown>>({});

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return templates.filter(t => {
      if (filterActive && !t.isActive) return false;
      if (filterKind === 'universal' && !t.isUniversalDefault) return false;
      if (filterKind === 'custom' && t.isUniversalDefault) return false;
      if (q && !t.nameAr.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [templates, search, filterActive, filterKind]);

  const openCreate = () => {
    setEditId(null);
    setDraft({ ...EMPTY, sortOrder: templates.length + 1 });
    setError(null);
    setDrawerOpen(true);
  };

  const openEdit = (t: HRRequestTemplateEntity) => {
    setEditId(t.id);
    setDraft({ nameAr: t.nameAr, sortOrder: t.sortOrder, isActive: t.isActive, isUniversalDefault: !!t.isUniversalDefault, formFields: t.formFields });
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!draft.nameAr.trim()) { setError('اسم القالب مطلوب'); return; }
    const payload = { ...draft, nameAr: draft.nameAr.trim(), nameEn: draft.nameAr.trim() };
    if (editId) updateTemplate(editId, payload);
    else addTemplate(payload);
    setDrawerOpen(false);
  };

  const patch = <K extends keyof DraftForm>(k: K, v: DraftForm[K]) => setDraft(d => ({ ...d, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="luxe" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> قالب جديد
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <Star className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد قوالب. أنشئ قالباً جديداً للبدء</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(t => (
              <div
                key={t.id}
                className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col cursor-pointer"
                onClick={() => openEdit(t)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{t.nameAr}</p>
                    {t.isUniversalDefault && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">افتراضي عالمي</p>
                    )}
                  </div>
                  <ActiveBadge active={t.isActive} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {t.formFields.length} حقل
                  </span>
                  {t.isUniversalDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-[11px] font-medium text-gold-foreground">
                      <Star className="h-3 w-3" /> افتراضي
                    </span>
                  )}
                </div>
                <div className="mt-auto flex gap-1 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { setPreviewTpl(t); setPreviewValues({}); }}>
                    <Eye className="h-3.5 w-3.5" /> معاينة
                  </Button>
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
        </>
      )}

      {/* Drawer */}
      <HRSettingsFormDrawer
        open={drawerOpen} onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل القالب' : 'إضافة قالب جديد'}
        onSave={handleSave} error={error} size="xl"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="الاسم" required span2>
            <Input value={draft.nameAr} onChange={e => patch('nameAr', e.target.value)} placeholder="القالب العام" />
          </FormField>
          <FormField label="الإعدادات" span2>
            <div className="space-y-2">
              {([['isActive', 'نشط'], ['isUniversalDefault', 'افتراضي عالمي (يُطبَّق عند غياب قالب محدد)']] as [keyof DraftForm, string][]).map(([k, lbl]) => (
                <label key={k} className={cn('flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all', draft[k] ? 'border-primary/30 bg-primary/5' : 'border-border')}>
                  <span className="text-sm font-medium">{lbl}</span>
                  <Switch checked={draft[k] as boolean} onCheckedChange={v => patch(k, v)} />
                </label>
              ))}
            </div>
          </FormField>
        </div>
        <Separator />
        <HRRequestTypeTemplateFieldsEditor fields={draft.formFields} onChange={v => patch('formFields', v)} />
      </HRSettingsFormDrawer>

      {/* Preview modal */}
      <Dialog open={!!previewTpl} onOpenChange={v => !v && setPreviewTpl(null)}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border-border p-0">
          <div className="shrink-0 border-b border-border px-6 py-5">
            <DialogHeader>
              <DialogTitle>معاينة: {previewTpl?.nameAr}</DialogTitle>
              <DialogDescription>هذا كيف سيبدو النموذج للموظف</DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {previewTpl && <HRRequestTemplateFieldsForm template={previewTpl} values={previewValues} onChange={setPreviewValues} />}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} title="حذف القالب" onConfirm={() => { if (deleteId) deleteTemplate(deleteId); setDeleteId(null); }} />
    </div>
  );
}
