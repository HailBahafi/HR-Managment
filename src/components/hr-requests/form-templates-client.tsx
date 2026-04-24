'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  PageHeader, EmptyState, Pagination, ActiveBadge,
} from './shared-ui';
import { HRRequestTypeTemplateFieldsEditor } from './template-fields-editor';
import { HRRequestTemplateFieldsForm } from './template-fields-form';
import { useHRConfigurationStore } from '@/lib/hr-requests/configuration-store';
import type { HRRequestTemplateEntity, HRRequestFieldDefinition } from '@/lib/hr-requests/types';
import { cn } from '@/lib/utils';

const LS_PAGE = 'hr_form_templates_currentPage';
const LS_PER = 'hr_form_templates_itemsPerPage';

interface DraftForm {
  nameAr: string; nameEn: string; sortOrder: number; isActive: boolean;
  isUniversalDefault: boolean; formFields: HRRequestFieldDefinition[];
}

const EMPTY: DraftForm = { nameAr: '', nameEn: '', sortOrder: 1, isActive: true, isUniversalDefault: false, formFields: [] };

type FilterKind = 'all' | 'universal' | 'custom';

export function FormTemplatesClient() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useHRConfigurationStore();

  const [search, setSearch] = React.useState('');
  const [filterActive, setFilterActive] = React.useState(false);
  const [filterKind, setFilterKind] = React.useState<FilterKind>('all');
  const [page, setPage] = React.useState(() => typeof window !== 'undefined' ? Number(localStorage.getItem(LS_PAGE) ?? '1') : 1);
  const [perPage, setPerPage] = React.useState(() => typeof window !== 'undefined' ? Number(localStorage.getItem(LS_PER) ?? '10') : 10);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [previewTpl, setPreviewTpl] = React.useState<HRRequestTemplateEntity | null>(null);
  const [previewValues, setPreviewValues] = React.useState<Record<string, unknown>>({});

  React.useEffect(() => { localStorage.setItem(LS_PAGE, String(page)); }, [page]);
  React.useEffect(() => { localStorage.setItem(LS_PER, String(perPage)); }, [perPage]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return templates.filter(t => {
      if (filterActive && !t.isActive) return false;
      if (filterKind === 'universal' && !t.isUniversalDefault) return false;
      if (filterKind === 'custom' && t.isUniversalDefault) return false;
      if (q && !t.nameAr.toLowerCase().includes(q) && !t.nameEn.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [templates, search, filterActive, filterKind]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openCreate = () => {
    setEditId(null);
    setDraft({ ...EMPTY, sortOrder: templates.length + 1 });
    setError(null);
    setDrawerOpen(true);
  };

  const openEdit = (t: HRRequestTemplateEntity) => {
    setEditId(t.id);
    setDraft({ nameAr: t.nameAr, nameEn: t.nameEn, sortOrder: t.sortOrder, isActive: t.isActive, isUniversalDefault: !!t.isUniversalDefault, formFields: t.formFields });
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!draft.nameAr.trim()) { setError('اسم القالب مطلوب'); return; }
    const payload = { ...draft, nameAr: draft.nameAr.trim(), nameEn: draft.nameEn.trim() || draft.nameAr.trim() };
    if (editId) updateTemplate(editId, payload);
    else addTemplate(payload);
    setDrawerOpen(false);
  };

  const patch = <K extends keyof DraftForm>(k: K, v: DraftForm[K]) => setDraft(d => ({ ...d, [k]: v }));

  const KIND_TABS: { value: FilterKind; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'universal', label: 'افتراضي عالمي' },
    { value: 'custom', label: 'مخصص' },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="قوالب النماذج" description="إنشاء وإدارة قوالب الحقول المرتبطة بأنواع الطلبات">
        <Button variant="luxe" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> قالب جديد
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="بحث بالاسم…" className="max-w-xs" />
        <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
          {KIND_TABS.map(tab => (
            <button key={tab.value} type="button" onClick={() => { setFilterKind(tab.value); setPage(1); }}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-all', filterKind === tab.value ? 'bg-background shadow-soft text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {tab.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={filterActive} onCheckedChange={v => { setFilterActive(v === true); setPage(1); }} />
          نشط فقط
        </label>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        {paginated.length === 0 ? (
          <EmptyState icon={Star} title="لا توجد قوالب" description="أنشئ قالباً جديداً للبدء" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-right">الاسم</th>
                  <th className="px-4 py-3 text-right">الحقول</th>
                  <th className="px-4 py-3 text-right">الافتراضي</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="w-28 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => (
                  <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.nameAr}</p>
                      {t.nameEn && <p className="text-xs text-muted-foreground" dir="ltr">{t.nameEn}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.formFields.length} حقل</td>
                    <td className="px-4 py-3">
                      {t.isUniversalDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-[11px] font-medium text-gold-foreground">
                          <Star className="h-3 w-3" /> افتراضي عالمي
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3"><ActiveBadge active={t.isActive} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" type="button" onClick={() => { setPreviewTpl(t); setPreviewValues({}); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" type="button" onClick={() => openEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" type="button" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      {/* Drawer */}
      <HRSettingsFormDrawer
        open={drawerOpen} onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل القالب' : 'إضافة قالب جديد'}
        onSave={handleSave} error={error} size="xl"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="الاسم بالعربية" required span2>
            <Input value={draft.nameAr} onChange={e => patch('nameAr', e.target.value)} placeholder="القالب العام" />
          </FormField>
          <FormField label="الاسم بالإنجليزية">
            <Input dir="ltr" value={draft.nameEn} onChange={e => patch('nameEn', e.target.value)} placeholder="General Template" />
          </FormField>
          <FormField label="الترتيب">
            <Input type="number" min={0} value={draft.sortOrder} onChange={e => patch('sortOrder', Number(e.target.value))} />
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
