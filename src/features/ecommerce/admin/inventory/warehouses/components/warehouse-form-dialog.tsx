'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useWarehouseMutations } from '@/features/ecommerce/admin/inventory/warehouses/hooks/use-warehouse-mutations';
import {
  WAREHOUSE_FORM_DEFAULT_VALUES,
  warehouseFormSchema,
  type WarehouseFormValues,
} from '@/features/ecommerce/admin/inventory/schemas/warehouse-schemas';
import type { Warehouse } from '@/features/ecommerce/domain/types/warehouse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  dialogMaxHeightClass,
} from '@/components/ui/dialog';

type Props = {
  warehouse?: Warehouse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormValues(warehouse: Warehouse): WarehouseFormValues {
  return {
    code: warehouse.code,
    nameAr: warehouse.nameAr,
    nameEn: warehouse.nameEn ?? '',
    description: warehouse.description ?? '',
    address: warehouse.address ?? '',
    status: warehouse.status,
  };
}

export function WarehouseFormDialog({ warehouse, open, onOpenChange }: Props) {
  const companyId = getStorefrontCompanyId();
  const { create, update } = useWarehouseMutations();
  const isEditing = Boolean(warehouse);
  const isSaving = create.isPending || update.isPending;

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: WAREHOUSE_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(warehouse ? toFormValues(warehouse) : WAREHOUSE_FORM_DEFAULT_VALUES);
  }, [open, warehouse, form]);

  const onSubmit = async (values: WarehouseFormValues) => {
    if (!companyId) return;
    const payload = {
      companyId,
      code: values.code.trim(),
      nameAr: values.nameAr.trim(),
      nameEn: values.nameEn?.trim() || undefined,
      description: values.description?.trim() || undefined,
      address: values.address?.trim() || undefined,
      status: values.status,
    };

    if (warehouse) {
      await update.mutateAsync({ companyId, id: warehouse.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogMaxHeightClass} max-w-lg overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل المستودع' : 'إضافة مستودع'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'حدّث بيانات المستودع ثم احفظ.' : 'أنشئ مستودعًا جديدًا لإدارة المواقع والعمليات.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit(onSubmit)(e);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wh-code">الرمز</Label>
              <Input id="wh-code" dir="ltr" {...form.register('code')} />
              {form.formState.errors.code ? (
                <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wh-name-ar">الاسم</Label>
              <Input id="wh-name-ar" {...form.register('nameAr')} />
              {form.formState.errors.nameAr ? (
                <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wh-name-en">الاسم بالإنجليزية</Label>
            <Input id="wh-name-en" dir="ltr" {...form.register('nameEn')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wh-address">العنوان</Label>
            <Input id="wh-address" {...form.register('address')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wh-description">الوصف</Label>
            <Textarea id="wh-description" className="min-h-[72px] resize-none" {...form.register('description')} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">مستودع نشط</p>
              <p className="text-xs text-muted-foreground">المستودعات غير النشطة لا تُستخدم في العمليات الجديدة</p>
            </div>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Switch
                  checked={field.value === 'active'}
                  onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                  aria-label="حالة المستودع"
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSaving || !companyId}>
              {isSaving ? 'جاري الحفظ…' : isEditing ? 'حفظ التغييرات' : 'إضافة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
