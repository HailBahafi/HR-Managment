'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePageFilters } from '@/components/filter-panel-context';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useLeaveTypesStore } from '@/lib/leaves/store';
import type { HRLeaveTypeRecord } from '@/lib/leaves/types';
import { cn } from '@/lib/utils';

type DraftState = Omit<HRLeaveTypeRecord, 'id' | 'updatedAt'>;

function makeLeaveTypeCode() {
  return `LT-${Date.now().toString(36).toUpperCase()}`;
}

const EMPTY_DRAFT: DraftState = {
  code: '', nameAr: '', nameEn: '',
  paid: true, deductsFromBalance: true, requiresApproval: true,
  maxDaysPerRequest: null, sortOrder: 0, isActive: true,
};

export function LeaveTypesPanel() {
  const { items, add, update, remove } = useLeaveTypesStore();
  const { values } = usePageFilters([{ key: 'q', label: 'بحث', type: 'text', placeholder: 'بحث بالاسم…' }]);
  const search = (values.q as string) ?? '';
  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftState>(EMPTY_DRAFT);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const sorted = React.useMemo(() =>
    [...items]
      .filter((x) => {
        const q = search.toLowerCase();
        return !q || x.nameAr.toLowerCase().includes(q);
      })
      .sort((a, b) => a.sortOrder - b.sortOrder),
    [items, search],
  );

  const openCreate = () => {
    setEditId(null);
    setDraft({ ...EMPTY_DRAFT, sortOrder: items.length + 1 });
    setError(null);
    setOpen(true);
  };

  const openEdit = (item: HRLeaveTypeRecord) => {
    setEditId(item.id);
    setDraft({
      code: item.code, nameAr: item.nameAr, nameEn: item.nameEn,
      paid: item.paid, deductsFromBalance: item.deductsFromBalance,
      requiresApproval: item.requiresApproval, maxDaysPerRequest: item.maxDaysPerRequest,
      sortOrder: item.sortOrder, isActive: item.isActive,
    });
    setError(null);
    setOpen(true);
  };

  const validate = (): string | null => {
    if (!draft.nameAr.trim()) return 'الاسم مطلوب';
    return null;
  };

  const save = () => {
    const err = validate();
    if (err) { setError(err); return; }
    const payload = {
      ...draft,
      code: editId ? draft.code : makeLeaveTypeCode(),
      sortOrder: editId ? draft.sortOrder : items.length + 1,
      nameAr: draft.nameAr.trim(),
      nameEn: draft.nameAr.trim(),
    };
    if (editId) update(editId, payload);
    else add(payload);
    setOpen(false);
  };

  const patch = <K extends keyof DraftState>(k: K, v: DraftState[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="luxe" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          إضافة نوع إجازة
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">لا توجد أنواع إجازات. ابدأ بإضافة نوع جديد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-right">الاسم</th>
                  <th className="px-4 py-3 text-right">مدفوع</th>
                  <th className="px-4 py-3 text-right">يخصم من الرصيد</th>
                  <th className="px-4 py-3 text-right">حد الطلب</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => (
                  <tr key={item.id} className="group border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => openEdit(item)}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.nameAr}</p>
                    </td>
                    <td className="px-4 py-3">
                      {item.paid ? <Check className="h-4 w-4 text-emerald-600" /> : <Minus className="h-4 w-4 text-muted-foreground/40" />}
                    </td>
                    <td className="px-4 py-3">
                      {item.deductsFromBalance ? <Check className="h-4 w-4 text-emerald-600" /> : <Minus className="h-4 w-4 text-muted-foreground/40" />}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {item.maxDaysPerRequest !== null ? `${item.maxDaysPerRequest} يوم` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                        item.isActive
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-border bg-muted text-muted-foreground',
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', item.isActive ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                        {item.isActive ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" type="button" onClick={() => openEdit(item)} aria-label="تعديل">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" type="button" className="text-destructive hover:text-destructive" aria-label="حذف" onClick={() => setConfirmId(item.id)}>
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
        <div className="border-t border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
          {sorted.length} من {items.length} نوع
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border-border p-0">
          <div className="shrink-0 border-b border-border px-6 py-5">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{editId ? 'تعديل نوع الإجازة' : 'إضافة نوع إجازة'}</DialogTitle>
              <DialogDescription>أدخل تفاصيل نوع الإجازة والسياسات المرتبطة بها.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lt-name-ar">الاسم <span className="text-destructive">*</span></Label>
                <Input id="lt-name-ar" value={draft.nameAr} onChange={(e) => patch('nameAr', e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lt-max">الحد الأقصى للطلب الواحد (أيام) — اتركه فارغاً لعدم وجود حد</Label>
                <Input
                  id="lt-max"
                  type="number"
                  min={0}
                  dir="ltr"
                  placeholder="لا يوجد حد"
                  value={draft.maxDaysPerRequest ?? ''}
                  onChange={(e) => patch('maxDaysPerRequest', e.target.value === '' ? null : Number(e.target.value))}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-semibold">السياسات</p>
              {([
                ['paid', 'إجازة مدفوعة الراتب'],
                ['deductsFromBalance', 'تُخصم من رصيد الإجازات'],
                ['requiresApproval', 'تتطلب موافقة مدير'],
                ['isActive', 'نشط'],
              ] as [keyof DraftState, string][]).map(([key, label]) => (
                <label key={key} className={cn(
                  'flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all',
                  draft[key]
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-muted/10 hover:border-border hover:bg-muted/20',
                )}>
                  <span className="text-sm font-medium">{label}</span>
                  <Checkbox
                    checked={draft[key] as boolean}
                    onCheckedChange={(v) => patch(key, v === true)}
                  />
                </label>
              ))}
            </div>

            {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:justify-start sm:space-x-2 sm:space-x-reverse">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button variant="luxe" type="button" onClick={save}>{editId ? 'حفظ التعديلات' : 'إضافة النوع'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent className="border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف نوع الإجازة</DialogTitle>
            <DialogDescription>هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد من حذف هذا النوع؟</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start sm:space-x-2 sm:space-x-reverse">
            <Button variant="outline" onClick={() => setConfirmId(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => { if (confirmId) remove(confirmId); setConfirmId(null); }}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
