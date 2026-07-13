'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { STOCK_STATUS_OPTIONS } from '@/features/ecommerce/admin/products/schemas/product-schema';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import type { Category } from '@/features/ecommerce/domain/types/category';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const NO_CATEGORY_VALUE = '__none__';

type Props = {
  control: Control<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
  categories: Category[] | undefined;
};

/** Price / stock / availability / category fields — split out of `ProductFormDialog` to keep it under the Component Architecture Contract's preferred 200-line size. */
export function ProductInventoryFields({ control, errors, register, categories }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="product-price">السعر</Label>
          <Input id="product-price" type="number" step="0.01" min="0" {...register('priceAmount')} />
          {errors.priceAmount ? <p className="text-xs text-destructive">{errors.priceAmount.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-compare-price">السعر قبل الخصم (اختياري)</Label>
          <Input id="product-compare-price" type="number" step="0.01" min="0" {...register('compareAtPriceAmount')} />
          {errors.compareAtPriceAmount ? (
            <p className="text-xs text-destructive">{errors.compareAtPriceAmount.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="product-stock">الكمية المتوفرة</Label>
          <Input id="product-stock" type="number" min="0" {...register('stockQuantity')} />
          {errors.stockQuantity ? <p className="text-xs text-destructive">{errors.stockQuantity.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-availability">حالة التوفر</Label>
          <Controller
            control={control}
            name="stockStatus"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="product-availability" aria-label="حالة التوفر">
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
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="product-category">التصنيف</Label>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select
              value={field.value ?? NO_CATEGORY_VALUE}
              onValueChange={(value) => field.onChange(value === NO_CATEGORY_VALUE ? undefined : value)}
            >
              <SelectTrigger id="product-category" aria-label="التصنيف">
                <SelectValue placeholder="بدون تصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY_VALUE}>بدون تصنيف</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <Label htmlFor="product-track-inventory">تتبّع المخزون</Label>
          <Controller
            control={control}
            name="trackInventory"
            render={({ field }) => (
              <Switch id="product-track-inventory" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <Label htmlFor="product-allow-backorder">السماح بالطلب عند النفاد</Label>
          <Controller
            control={control}
            name="allowBackorder"
            render={({ field }) => (
              <Switch id="product-allow-backorder" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </div>
    </>
  );
}
