'use client';

import * as React from 'react';
import {
  Plus, Pencil, Trash2, AlertTriangle, Loader2, FileStack, Coins, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { contractTemplatesApi } from '@/features/hr/contracts/contract-templates/lib/api/contract-templates';
import type { ContractTemplateDto } from '@/features/hr/contracts/contract-templates/types/contract-template';
import {
  TEMPLATE_CONTRACT_NATURE_LABELS,
  TEMPLATE_WORK_ARRANGEMENT_LABELS,
} from '@/features/hr/contracts/contract-templates/constants/contract-template-options';
import { ContractTemplateFormDialog } from '@/features/hr/contracts/contract-templates/dialogs/contract-template-form-dialog';

function fmtSalary(amount: string | null | undefined, currency: string): string {
  if (!amount) return '—';
  const n = parseFloat(amount);
  if (Number.isNaN(n)) return '—';
  return `${n.toLocaleString('ar-SA')} ${currency}`;
}

function totalAllowances(lines: ContractTemplateDto['allowanceLines']): number {
  return (lines ?? []).reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
}

export function ContractTemplatesClient() {
  useSetPageTitle({
    titleAr: 'قوالب العقود',
    descriptionAr: 'قوالب جاهزة لإنشاء عقود العمل — الراتب والبدلات والإعدادات الافتراضية.',
    iconName: 'FileStack',
  });

  const companyId = useAuthStore((s) => s.activeCompanyId) ?? '';

  const [items, setItems] = React.useState<ContractTemplateDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<ContractTemplateDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ContractTemplateDto | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await contractTemplatesApi.list({ companyId, limit: 200 });
      setItems(
        [...res.items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.nameAr.localeCompare(b.nameAr, 'ar')),
      );
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'contract-templates.load');
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
      await contractTemplatesApi.delete(deleteTarget.id);
      toast.success('تم حذف قالب العقد');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'contract-templates.delete');
      toast.error(displayMessage);
    } finally {
      setDeleting(false);
    }
  };

  usePageHeaderActions(
    () => (
      <Button
        variant="luxe"
        size="sm"
        className="h-8 gap-1.5 px-3 text-xs"
        onClick={() => { setEditItem(null); setFormOpen(true); }}
      >
        <Plus className="h-3.5 w-3.5" /> قالب جديد
      </Button>
    ),
    [],
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
            <FileStack className="h-7 w-7" />
          </div>
          <p className="font-display text-base font-semibold">لا توجد قوالب عقود بعد</p>
          <p className="text-sm text-muted-foreground">أنشئ أول قالب لتسريع إعداد عقود الموظفين</p>
          <Button
            variant="luxe"
            size="sm"
            className="mt-1 gap-1.5"
            onClick={() => { setEditItem(null); setFormOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5" /> قالب جديد
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const allowanceTotal = totalAllowances(item.allowanceLines);
            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileStack className="h-5 w-5" />
                    </div>
                    <Badge variant={item.isActive ? 'success' : 'secondary'} className="px-1.5 py-px text-[9px]">
                      {item.isActive ? 'نشط' : 'موقوف'}
                    </Badge>
                  </div>

                  <h3 className="mb-0.5 truncate font-display text-base font-bold leading-snug transition-colors group-hover:text-primary">
                    {item.nameAr}
                  </h3>
                  {item.nameEn && (
                    <p className="mb-2 truncate text-[11px] text-muted-foreground" dir="ltr">{item.nameEn}</p>
                  )}

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <Badge variant="subtle" className="text-[10px]">
                      {TEMPLATE_CONTRACT_NATURE_LABELS[item.defaultContractNature as keyof typeof TEMPLATE_CONTRACT_NATURE_LABELS]
                        ?? item.defaultContractNature}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {TEMPLATE_WORK_ARRANGEMENT_LABELS[item.defaultWorkArrangement as keyof typeof TEMPLATE_WORK_ARRANGEMENT_LABELS]
                        ?? item.defaultWorkArrangement}
                    </Badge>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-border bg-muted/20 px-2.5 py-2">
                      <p className="text-[10px] text-muted-foreground">الراتب المقترح</p>
                      <p className="font-mono font-semibold text-primary">
                        {fmtSalary(item.suggestedBaseSalary, item.currency)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 px-2.5 py-2">
                      <p className="text-[10px] text-muted-foreground">إجمالي البدلات</p>
                      <p className="font-mono font-semibold">
                        {allowanceTotal > 0
                          ? `${allowanceTotal.toLocaleString('ar-SA')} ${item.currency}`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <span className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5', item.allowanceLines?.length ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border')}>
                      <Coins className="h-2.5 w-2.5" />
                      {(item.allowanceLines?.length ?? 0)} بدل
                    </span>
                    <span className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5', item.articles?.length ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border')}>
                      <BookOpen className="h-2.5 w-2.5" />
                      {(item.articles?.length ?? 0)} مادة
                    </span>
                    {item.defaultProbationDays != null && (
                      <span className="rounded-full border border-border px-2 py-0.5">
                        تجربة {item.defaultProbationDays} يوم
                      </span>
                    )}
                  </div>

                  {item.allowancesHint && (
                    <p className="mb-3 line-clamp-2 text-[11px] text-muted-foreground">{item.allowancesHint}</p>
                  )}

                  <p className="mb-4 font-mono text-[10px] text-muted-foreground" dir="ltr">{item.code}</p>

                  <div className="flex items-center gap-1 border-t border-border/60 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={() => { setEditItem(item); setFormOpen(true); }}
                    >
                      <Pencil className="h-3 w-3" /> تعديل
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-3 w-3" /> حذف
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ContractTemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        companyId={companyId}
        onSaved={load}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm border-border" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> حذف قالب العقد
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
