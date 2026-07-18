'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import {
  PRODUCT_STATUS_OPTIONS,
  type ProductFormInput,
} from '@/features/ecommerce/admin/products/schemas/product-schema';
import { EntityFormRow } from '@/features/ecommerce/admin/shared/components/entity-form-row';
import type { Brand } from '@/features/ecommerce/domain/types/brand';
import type { Category } from '@/features/ecommerce/domain/types/category';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NO_VALUE = '__none__';

type Props = {
  control: Control<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
  categories: Category[] | undefined;
  brands: Brand[] | undefined;
};

export function ProductGeneralTab({ control, errors, register, categories, brands }: Props) {
  return (
    <div className="space-y-1">
      <EntityFormRow label="الفئة" htmlFor="product-category">
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select
              value={field.value ?? NO_VALUE}
              onValueChange={(value) => field.onChange(value === NO_VALUE ? undefined : value)}
            >
              <SelectTrigger id="product-category" aria-label="الفئة" className="max-w-sm">
                <SelectValue placeholder="اختر فئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_VALUE}>بدون فئة</SelectItem>
                {(categories ?? []).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </EntityFormRow>

      <EntityFormRow label="العلامة التجارية" htmlFor="product-brand">
        <Controller
          control={control}
          name="brandId"
          render={({ field }) => (
            <Select
              value={field.value ?? NO_VALUE}
              onValueChange={(value) => field.onChange(value === NO_VALUE ? undefined : value)}
            >
              <SelectTrigger id="product-brand" aria-label="العلامة التجارية" className="max-w-sm">
                <SelectValue placeholder="بدون علامة تجارية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_VALUE}>بدون علامة تجارية</SelectItem>
                {(brands ?? []).map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </EntityFormRow>

      <EntityFormRow label="الحالة" htmlFor="product-status">
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="product-status" aria-label="الحالة" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.labelAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </EntityFormRow>

      <EntityFormRow label="الرقم المرجعي" htmlFor="product-sku">
        <Input id="product-sku" dir="ltr" className="max-w-sm" placeholder="TIPS" {...register('sku')} />
        {errors.sku ? <p className="mt-1 text-xs text-destructive">{errors.sku.message}</p> : null}
      </EntityFormRow>

      <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
        أسعار البيع تُحدَّد لاحقًا من المخزون / قوائم الأسعار. الرابط المختصر يُولَّد تلقائيًا من الرقم المرجعي.
      </div>
    </div>
  );
}
