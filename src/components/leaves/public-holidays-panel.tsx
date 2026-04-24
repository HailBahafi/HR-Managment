'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useHolidaysStore } from '@/lib/leaves/store';
import type { HRPublicHolidayRecord } from '@/lib/leaves/types';
import { cn } from '@/lib/utils';

type DraftState = Omit<HRPublicHolidayRecord, 'id' | 'updatedAt'>;

const EMPTY_DRAFT: DraftState = {
  code: '', nameAr: '', nameEn: '', date: '', recurring: true, sortOrder: 0, isActive: true,
};

const MONTH_NAMES = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function formatDate(date: string) {
  const [m, d] = date.split('-').map(Number);
  if (!m || !d) return date;
  return `${d} ${MONTH_NAMES[m - 1] ?? ''}`;
}

export function PublicHolidaysPanel() {
  const { items, add, update, remove } = useHolidaysStore();
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftState>(EMPTY_DRAFT);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const sorted = React.useMemo(() =>
    [...items]
      .filter((x) => {
        const q = search.toLowerCase();
        return !q || x.code.toLowerCase().includes(q) || x.nameAr.includes(q) || x.nameEn.toLowerCase().includes(q);
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

  const openEdit = (item: HRPublicHolidayRecord) => {
    setEditId(item.id);
    setDraft({ code: item.code, nameAr: item.nameAr, nameEn: item.nameEn, date: item.date, recurring: item.recurring, sortOrder: item.sortOrder, isActive: item.isActive });
    setError(null);
    setOpen(true);
  };

  const validate = (): string | null => {
    if (!draft.code.trim()) return 'الرمز مطلوب';
    if (!draft.nameAr.trim()) return 'الاسم بالعربية مطلوب';
    if (!draft.date.match(/^\d{2}-\d{2}$/)) return 'التاريخ يجب أن يكون بصيغة MM-DD (مثال: 09-23)';
    return null;
  };

  const save = () => {
    const err = validate();
    if (err) { setError(err); return; }
    const payload = { ...draft, code: draft.code.trim().toUpperCase(), nameAr: draft.nameAr.trim() };
    if (editId) update(editId, payload);
    else add(payload);
    setOpen(false);
  };

  const patch = <K extends keyof DraftState>(k: K, v: DraftState[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Input placeholder="بحث بالرمز أو الاسم…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="luxe" className="gap-2 shrink-0" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          إضافة عطلة رسمية
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">لا توجد عطل رسمية. ابدأ بإضافة عطلة جديدة.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="px-4 py-3 text-right">الاسم</th>
                  <th className="px-4 py-3 text-right">الرمز</th>
                  <th className="px-4 py-3 text-right">التكرار</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => (
                  <tr key={item.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-primary" dir="ltr">{item.date}</span>
                      <p className="text-[10px] text-muted-foreground">{formatDate(item.date)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.nameAr}</p>
                      {item.nameEn && <p className="text-xs text-muted-foreground" dir="ltr">{item.nameEn}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.code}</td>
                    <td className="px-4 py-3">
                      {item.recurring ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                          <RefreshCw className="h-2.5 w-2.5" />
                          سنوي
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">مرة واحدة</span>
                      )}
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
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
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
          {sorted.length} من {items.length} عطلة
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border-border p-0">
          <div className="shrink-0 border-b border-border px-6 py-5">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{editId ? 'تعديل العطلة الرسمية' : 'إضافة عطلة رسمية'}</DialogTitle>
              <DialogDescription>التاريخ بصيغة MM-DD (الشهر-اليوم).</DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>الرمز <span className="text-destructive">*</span></Label>
                <Input placeholder="NATIONAL" dir="ltr" className="font-mono uppercase" value={draft.code} onChange={(e) => patch('code', e.target.value.toUpperCase())} />
              </div>
              <div className="space-y-2">
                <Label>التاريخ (MM-DD) <span className="text-destructive">*</span></Label>
                <Input placeholder="09-23" dir="ltr" className="font-mono" value={draft.date} onChange={(e) => patch('date', e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>الاسم بالعربية <span className="text-destructive">*</span></Label>
                <Input value={draft.nameAr} onChange={(e) => patch('nameAr', e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>الاسم بالإنجليزية</Label>
                <Input dir="ltr" value={draft.nameEn} onChange={(e) => patch('nameEn', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>الترتيب</Label>
                <Input type="number" min={0} value={draft.sortOrder} onChange={(e) => patch('sortOrder', Number(e.target.value) || 0)} />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              {([
                ['recurring', 'تتكرر سنوياً (نفس الشهر واليوم)'],
                ['isActive', 'نشط'],
              ] as [keyof DraftState, string][]).map(([key, label]) => (
                <label key={key} className={cn(
                  'flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all',
                  draft[key]
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-muted/10 hover:border-border hover:bg-muted/20',
                )}>
                  <span className="text-sm font-medium">{label}</span>
                  <Checkbox checked={draft[key] as boolean} onCheckedChange={(v) => patch(key, v === true)} />
                </label>
              ))}
            </div>

            {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:justify-start sm:space-x-2 sm:space-x-reverse">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button variant="luxe" type="button" onClick={save}>{editId ? 'حفظ التعديلات' : 'إضافة العطلة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <Dialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent className="border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف العطلة الرسمية</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف هذه العطلة؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
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
