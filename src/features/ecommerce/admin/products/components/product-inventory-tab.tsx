'use client';

import * as React from 'react';
import { Controller, useWatch, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useProductOnHand } from '@/features/ecommerce/admin/inventory/hooks/use-product-on-hand';
import { STOCK_STATUS_OPTIONS, type ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { EntityFormRow } from '@/features/ecommerce/admin/shared/components/entity-form-row';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
  control: Control<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  productId?: string | null;
};

export function ProductInventoryTab({ control, setValue, productId }: Props) {
  const companyId = getStorefrontCompanyId();
  const variants = useWatch({ control, name: 'variants' }) ?? [];
  const hasVariants = variants.length > 0;
  const { data: onHand, isLoading } = useProductOnHand(companyId, productId ?? undefined);

  const warehouseQty = onHand?.total ?? 0;

  React.useEffect(() => {
    if (!productId || onHand == null) return;
    setValue('stockQuantity', onHand.total, { shouldDirty: false });
  }, [productId, onHand, setValue]);

  const variantIdsKey = variants.map((variant) => variant.id).join('|');

  React.useEffect(() => {
    if (!productId || onHand == null || !hasVariants) return;
    variants.forEach((variant, index) => {
      const qty = onHand.byVariant[variant.id] ?? 0;
      setValue(`variants.${index}.quantity`, qty, { shouldDirty: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when warehouse totals or variant ids change
  }, [productId, onHand, hasVariants, variantIdsKey, setValue]);

  return (
    <div className="space-y-1">
      <p className="mb-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        {productId
          ? 'كمية العرض تُحسب تلقائيًا من مخزون المستودع (المواقع الداخلية) بعد تصديق حركات الاستلام/الصرف. لا يمكن تعديلها يدويًا.'
          : 'احفظ المنتج أولًا ثم صدّق مستندات الاستلام في المستودع لتظهر كمية العرض هنا.'}
      </p>

      <EntityFormRow label="كمية العرض (من المستودع)" htmlFor="product-stock">
        <Input
          id="product-stock"
          type="number"
          dir="ltr"
          className="max-w-[8rem] bg-muted/40"
          value={productId ? (isLoading ? '' : warehouseQty) : 0}
          readOnly
          disabled
        />
        {hasVariants ? (
          <p className="mt-1 text-xs text-muted-foreground">مجموع كميات المتغيرات في المستودع.</p>
        ) : null}
      </EntityFormRow>

      <EntityFormRow label="حالة التوفر" htmlFor="product-availability">
        <Controller
          control={control}
          name="stockStatus"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="product-availability" aria-label="حالة التوفر" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STOCK_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.labelAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </EntityFormRow>

      <EntityFormRow label="تتبع المخزون">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">خصم الكمية عند البيع من مخزون المستودع</p>
          <Controller
            control={control}
            name="trackInventory"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="تتبع المخزون" />
            )}
          />
        </div>
      </EntityFormRow>
    </div>
  );
}
