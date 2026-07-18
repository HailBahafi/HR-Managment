'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { STOCK_STATUS_OPTIONS, type ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { EntityFormRow } from '@/features/ecommerce/admin/shared/components/entity-form-row';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
  control: Control<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
};

export function ProductInventoryTab({ control, errors, register }: Props) {
  return (
    <div className="space-y-1">
      <EntityFormRow label="كمية العرض" htmlFor="product-stock">
        <Input id="product-stock" type="number" min={0} dir="ltr" className="max-w-[8rem]" {...register('stockQuantity')} />
        {errors.stockQuantity ? <p className="mt-1 text-xs text-destructive">{errors.stockQuantity.message}</p> : null}
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
          <p className="text-sm text-muted-foreground">خصم الكمية عند البيع</p>
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
