'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Loader2, Coins, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  allowanceTypesApi,
  type AllowanceTypeDto,
  type CreateAllowanceTypeDto,
  type AllowanceCalculationType,
} from '@/features/hr/contracts/lib/api/allowance-types';

// ── helpers ───────────────────────────────────────────────────────────────────

const CALC_TYPE_LABEL: Record<AllowanceCalculationType, string> = {
  fixed_amount:     'مبلغ ثابت',
  percent_of_basic: 'نسبة من الأساسي',
};

function fmtAmount(item: AllowanceTypeDto): string {
  if (item.calculationType === 'fixed_amount' && item.typicalAmount) {
    return `${parseFloat(item.typicalAmount).toLocaleString('ar-SA')} ${item.currency}`;
  }
  if (item.calculationType === 'percent_of_basic' && item.typicalPercent) {
    return `${parseFloat(item.typicalPercent)}%`;
  }
  return '—';
}

// ── empty form ────────────────────────────────────────────────────────────────

type DraftForm = {
  code: string;
  nameAr: string;
  nameEn: string;
  calculationType: AllowanceCalculationType;
  typicalAmount: string;
  typicalPercent: string;
  currency: string;
  isTaxable: boolean;
  isIncludedInGosi: boolean;
  sortOrder: string;
  isActive: boolean;
  notes: string;
};

const EMPTY_FORM: DraftForm = {
  code: '', nameAr: '', nameEn: '', calculationType: 'fixed_amount',
  typicalAmount: '', typicalPercent: '', currency: 'SAR',
  isTaxable: true, isIncludedInGosi: false, sortOrder: '0', isActive: true, notes: '',
};

function formFromDto(dto: AllowanceTypeDto): DraftForm {
  return {
    code: dto.code,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? '',
    calculationType: dto.calculationType,
    typicalAmount: dto.typicalAmount ?? '',
    typicalPercent: dto.typicalPercent ?? '',
    currency: dto.currency,
    isTaxable: dto.isTaxable,
    isIncludedInGosi: dto.isIncludedInGosi,
    sortOrder: String(dto.sortOrder),
    isActive: dto.isActive,
    notes: dto.notes ?? '',
  };
}

// ── form dialog ────────────────────────────────────────────────────────────────

function AllowanceTypeDialog({
  open, onOpenChange, editItem, companyId, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editItem: AllowanceTypeDto | null;
  companyId: string;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<DraftForm>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm(editItem ? formFromDto(editItem) : EMPTY_FORM);
      setError(null);
    }
  }, [open, editItem]);

  const patch = (p: Partial<DraftForm>) => setForm((f) => ({ ...f, ...p }));

  const handleSave = async () => {
    if (!form.nameAr.trim()) { setError('الاسم العربي مطلوب'); return; }
    if (!form.code.trim()) { setError('الكود مطلوب'); return; }
    setSaving(true); setError(null);
    try {
      const payload: CreateAllowanceTypeDto = {
        companyId,
        code: form.code.trim(),
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim() || null,
        calculationType: form.calculationType,
        typicalAmount: form.calculationType === 'fixed_amount' && form.typicalAmount ? Number(form.typicalAmount) : null,
        typicalPercent: form.calculationType === 'percent_of_basic' && form.typicalPercent ? Number(form.typicalPercent) : null,
        currency: form.currency || 'SAR',
        isTaxable: form.isTaxable,
        isIncludedInGosi: form.isIncludedInGosi,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        notes: form.notes.trim() || null,
      };
      if (editItem) {
        await allowanceTypesApi.update(editItem.id, payload);
        toast.success('تم تحديث نوع البدل');
      } else {
        await allowanceTypesApi.create(payload);
        toast.success('تمت إضافة نوع البدل');
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'allowance-types.save');
      setError(displayMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            {editItem ? 'تعديل نوع البدل' : 'إضافة نوع بدل جديد'}
          </DialogTitle>
          <DialogDescription className="text-xs">أنواع البدلات المعتمدة في كتالوج الشركة</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">الاسم العربي <span className="text-destructive">*</span></Label>
              <Input value={form.nameAr} onChange={(e) => patch({ nameAr: e.target.value })} placeholder="بدل سكن" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">الاسم الإنجليزي</Label>
              <Input value={form.nameEn} onChange={(e) => patch({ nameEn: e.target.value })} placeholder="Housing allowance" className="h-9" dir="ltr" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">الكود <span className="text-destructive">*</span></Label>
              <Input value={form.code} onChange={(e) => patch({ code: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="housing" className="h-9 font-mono" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">الترتيب</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => patch({ sortOrder: e.target.value })} className="h-9" dir="ltr" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">طريقة الاحتساب</Label>
            <Select value={form.calculationType} onValueChange={(v) => patch({ calculationType: v as AllowanceCalculationType })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed_amount">مبلغ ثابت</SelectItem>
                <SelectItem value="percent_of_basic">نسبة من الراتب الأساسي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {form.calculationType === 'fixed_amount' ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">المبلغ الافتراضي</Label>
                <Input type="number" value={form.typicalAmount} onChange={(e) => patch({ typicalAmount: e.target.value })} placeholder="2500" className="h-9" dir="ltr" />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">النسبة الافتراضية (%)</Label>
                <Input type="number" value={form.typicalPercent} onChange={(e) => patch({ typicalPercent: e.target.value })} placeholder="10" className="h-9" dir="ltr" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">العملة</Label>
              <Input value={form.currency} onChange={(e) => patch({ currency: e.target.value })} placeholder="SAR" className="h-9 font-mono" dir="ltr" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <span className="text-xs font-medium">خاضع للضريبة</span>
              <Switch checked={form.isTaxable} onCheckedChange={(v) => patch({ isTaxable: v })} />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <span className="text-xs font-medium">يدخل في GOSI</span>
              <Switch checked={form.isIncludedInGosi} onCheckedChange={(v) => patch({ isIncludedInGosi: v })} />
            </label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">ملاحظات (اختياري)</Label>
            <Textarea value={form.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="تفاصيل إضافية…" className="min-h-[56px] resize-none text-sm" />
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-border px-4 py-3 transition-all hover:bg-muted/20">
            <div>
              <p className="text-sm font-medium">نشط</p>
              <p className="text-xs text-muted-foreground">يمكن إيقاف النوع مؤقتاً دون حذفه</p>
            </div>
            <Switch checked={form.isActive} onCheckedChange={(v) => patch({ isActive: v })} />
          </label>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button variant="luxe" onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {editItem ? 'حفظ التعديلات' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

export function AllowanceTypesClient() {
  useSetPageTitle({
    titleAr: 'أنواع البدلات',
    descriptionAr: 'كتالوج البدلات المعتمدة في الشركة — مبلغ ثابت أو نسبة من الأساسي.',
    iconName: 'Coins',
  });

  const companyId = useAuthStore((s) => s.activeCompanyId) ?? '';

  const [items, setItems] = React.useState<AllowanceTypeDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<AllowanceTypeDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AllowanceTypeDto | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await allowanceTypesApi.getAll({ companyId, limit: 200 });
      setItems(res.items);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'allowance-types.load');
      setError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => { void load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await allowanceTypesApi.remove(deleteTarget.id);
      toast.success('تم حذف نوع البدل');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'allowance-types.delete');
      toast.error(displayMessage);
    } finally {
      setDeleting(false);
    }
  };

  usePageHeaderActions(
    () => (
      <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={() => { setEditItem(null); setFormOpen(true); }}>
        <Plus className="h-3.5 w-3.5" /> نوع بدل جديد
      </Button>
    ),
    [setFormOpen],
  );

  return (
    <div className="space-y-5">

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">جاري التحميل…</div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Coins className="h-7 w-7" />
          </div>
          <p className="font-display text-base font-semibold">لا توجد أنواع بدلات بعد</p>
          <p className="text-sm text-muted-foreground">أضف أول نوع بدل لكتالوج الشركة</p>
          <Button variant="luxe" size="sm" className="gap-1.5 mt-1" onClick={() => { setEditItem(null); setFormOpen(true); }}>
            <Plus className="h-3.5 w-3.5" /> نوع بدل جديد
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
            >
              {/* accent strip */}
              <div className={cn(
                'absolute inset-x-0 top-0 h-0.5',
                item.calculationType === 'fixed_amount'
                  ? 'bg-gradient-to-r from-primary/60 via-primary to-primary/60'
                  : 'bg-gradient-to-r from-amber-400/60 via-amber-400 to-amber-400/60',
              )} />

              <div className="p-5">
                {/* Header */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={item.isActive ? 'success' : 'secondary'}
                      className="text-[9px] px-1.5 py-px"
                    >
                      {item.isActive ? 'نشط' : 'موقوف'}
                    </Badge>
                  </div>
                </div>

                {/* Name */}
                <h3 className="mb-0.5 truncate font-display text-base font-bold leading-snug group-hover:text-primary transition-colors">
                  {item.nameAr}
                </h3>
                {item.nameEn && (
                  <p className="mb-2 truncate text-[11px] text-muted-foreground" dir="ltr">{item.nameEn}</p>
                )}

                {/* Calc type + amount */}
                <div className="mb-3 flex items-center justify-between">
                  <Badge variant="subtle" className="text-[10px]">
                    {CALC_TYPE_LABEL[item.calculationType]}
                  </Badge>
                  <span className="font-mono text-sm font-semibold text-primary">{fmtAmount(item)}</span>
                </div>

                {/* Flags */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  <span className={cn(
                    'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium',
                    item.isTaxable
                      ? 'border-amber-300/50 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                      : 'border-border bg-muted/40 text-muted-foreground',
                  )}>
                    {item.isTaxable ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                    ضريبة
                  </span>
                  <span className={cn(
                    'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium',
                    item.isIncludedInGosi
                      ? 'border-blue-300/50 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                      : 'border-border bg-muted/40 text-muted-foreground',
                  )}>
                    {item.isIncludedInGosi ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                    GOSI
                  </span>
                  <span className="flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                    {item.currency}
                  </span>
                </div>

                {/* Code */}
                <p className="mb-4 font-mono text-[10px] text-muted-foreground" dir="ltr">{item.code}</p>

                {/* Actions */}
                <div className="flex items-center gap-1 border-t border-border/60 pt-3">
                  <Button
                    variant="ghost" size="sm" type="button"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => { setEditItem(item); setFormOpen(true); }}
                  >
                    <Pencil className="h-3 w-3" /> تعديل
                  </Button>
                  <Button
                    variant="ghost" size="sm" type="button"
                    className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="h-3 w-3" /> حذف
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <AllowanceTypeDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        companyId={companyId}
        onSaved={load}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm border-border" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> حذف نوع البدل
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف «{deleteTarget?.nameAr}»؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Trash2 className="h-4 w-4" /> حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
