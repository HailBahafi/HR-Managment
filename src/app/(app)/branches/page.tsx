'use client';

import * as React from 'react';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useSetPageTitle } from '@/components/page-title-context';
import { usePageFilters } from '@/components/filter-panel-context';
import {
  EmptyState, HRSettingsFormDrawer, FormField, ConfirmationModal,
} from '@/components/hr-requests/shared-ui';
import { data } from '@/lib/data';

type Branch = {
  id: string;
  name: string;
  city: string;
  manager: string;
  employeesCount: number;
};

type DraftForm = {
  name: string;
  city: string;
};

const EMPTY_FORM: DraftForm = { name: '', city: '' };

function uid() {
  return `br-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function BranchesPage() {
  useSetPageTitle({ titleAr: 'الفروع', descriptionAr: 'إدارة فروع الشركة وتوزيع الموظفين.', iconName: 'Building2' });

  const { values } = usePageFilters([
    { key: 'q', label: 'بحث', type: 'text', placeholder: 'اسم الفرع أو المدينة…' },
  ]);
  const q = ((values.q as string) ?? '').toLowerCase();

  const [branches, setBranches] = React.useState<Branch[]>(() =>
    data.branches.map(b => ({
      id: b.id, name: b.name, city: b.city,
      manager: b.manager, employeesCount: b.employeesCount,
    })),
  );

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<DraftForm>(EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewBranch, setViewBranch] = React.useState<Branch | null>(null);

  const filtered = branches.filter(b => {
    if (!q) return true;
    const n = b.name.toLowerCase();
    const c = b.city.toLowerCase();
    return n.includes(q) || c.includes(q);
  });

  const openCreate = () => {
    setEditId(null); setForm(EMPTY_FORM); setError(null); setDrawerOpen(true);
  };
  const openEdit = (b: Branch) => {
    setEditId(b.id);
    setForm({ name: b.name, city: b.city });
    setError(null); setDrawerOpen(true);
  };

  const patch = (p: Partial<DraftForm>) => setForm(f => ({ ...f, ...p }));

  const handleSave = () => {
    if (!form.name.trim()) { setError('اسم الفرع مطلوب'); return; }
    if (!form.city.trim()) { setError('المدينة مطلوبة'); return; }
    const existing = editId ? branches.find(b => b.id === editId) : undefined;
    const payload: Omit<Branch, 'id'> = {
      name: form.name.trim(),
      city: form.city.trim(),
      manager: existing?.manager ?? '',
      employeesCount: existing?.employeesCount ?? 0,
    };
    if (editId) {
      setBranches(list => list.map(b => b.id === editId ? { ...b, ...payload } : b));
    } else {
      setBranches(list => [{ id: uid(), ...payload }, ...list]);
    }
    setDrawerOpen(false);
  };

  const handleDelete = () => {
    if (!confirmId) return;
    setBranches(list => list.filter(b => b.id !== confirmId));
    setConfirmId(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {branches.length} فرع
        </span>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />فرع جديد
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="لا توجد فروع" description="لم تُطابق نتائج البحث الحالية أي فرع." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(b => (
            <div
              key={b.id}
              className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col cursor-pointer transition-colors hover:bg-muted/30"
              onClick={() => setViewBranch(b)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold truncate min-w-0">{b.name}</p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">المدينة</span>
                  <span className="font-medium truncate">{b.city}</span>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-end gap-1 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmId(b.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <HRSettingsFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل الفرع' : 'فرع جديد'}
        onSave={handleSave}
        error={error}
      >
        <FormField label="اسم الفرع" required>
          <Input value={form.name} onChange={e => patch({ name: e.target.value })} placeholder="مثال: فرع الرياض" />
        </FormField>
        <FormField label="المدينة" required>
          <Input value={form.city} onChange={e => patch({ city: e.target.value })} placeholder="الرياض" />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!confirmId}
        onOpenChange={v => { if (!v) setConfirmId(null); }}
        title="حذف الفرع"
        description="هل أنت متأكد من حذف هذا الفرع؟"
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <Dialog open={!!viewBranch} onOpenChange={v => !v && setViewBranch(null)}>
        <DialogContent className="sm:max-w-md border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {viewBranch?.name}
            </DialogTitle>
          </DialogHeader>
          {viewBranch && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">اسم الفرع</span>
                  <span className="font-semibold">{viewBranch.name}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm border-t border-border pt-3">
                  <span className="text-muted-foreground">المدينة</span>
                  <span className="font-medium">{viewBranch.city}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewBranch(null)}>إغلاق</Button>
            <Button onClick={() => { if (viewBranch) { const b = viewBranch; setViewBranch(null); openEdit(b); } }} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />تعديل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
