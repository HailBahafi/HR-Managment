'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import {
  PRODUCT_INVOICE_POLICY_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
  PRODUCT_TRACKING_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  type ProductFormInput,
} from '@/features/ecommerce/admin/products/schemas/product-schema';
import { EntityFormRow } from '@/features/ecommerce/admin/shared/components/entity-form-row';
import type { Brand } from '@/features/ecommerce/domain/types/brand';
import type { Category } from '@/features/ecommerce/domain/types/category';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';

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
      <EntityFormRow label="نوع المنتج">
        <Controller
          control={control}
          name="productType"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="نوع المنتج">
              {PRODUCT_TYPE_OPTIONS.map((option) => {
                const selected = field.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => field.onChange(option.value)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      selected
                        ? 'border-primary bg-primary/10 font-medium text-primary'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {option.labelAr}
                  </button>
                );
              })}
            </div>
          )}
        />
      </EntityFormRow>

      <EntityFormRow label="سياسة الفوترة" htmlFor="product-invoice-policy">
        <Controller
          control={control}
          name="invoicePolicy"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="product-invoice-policy" aria-label="سياسة الفوترة" className="max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_INVOICE_POLICY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.labelAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </EntityFormRow>

      <EntityFormRow label="التتبع" htmlFor="product-tracking">
        <Controller
          control={control}
          name="tracking"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="product-tracking" aria-label="التتبع" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TRACKING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.labelAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </EntityFormRow>

      <EntityFormRow label="سعر البيع" htmlFor="product-list-price">
        <div className="flex max-w-xs items-center gap-2">
          <Input
            id="product-list-price"
            type="number"
            min={0}
            step="0.01"
            dir="ltr"
            className="max-w-[8rem]"
            {...register('listPrice')}
          />
          <span className="text-sm text-muted-foreground">ر.س</span>
        </div>
        {errors.listPrice ? <p className="mt-1 text-xs text-destructive">{errors.listPrice.message}</p> : null}
      </EntityFormRow>

      <EntityFormRow label="سعر الشراء" htmlFor="product-cost-price">
        <div className="flex max-w-xs items-center gap-2">
          <Input
            id="product-cost-price"
            type="number"
            min={0}
            step="0.01"
            dir="ltr"
            className="max-w-[8rem]"
            {...register('costPrice')}
          />
          <span className="text-sm text-muted-foreground">ر.س</span>
        </div>
        {errors.costPrice ? <p className="mt-1 text-xs text-destructive">{errors.costPrice.message}</p> : null}
      </EntityFormRow>

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

      <EntityFormRow label="علامات التصنيف" htmlFor="product-tags">
        <Input
          id="product-tags"
          className="max-w-sm"
          placeholder="مفصولة بفواصل — مثال: مطبخ، خشب"
          {...register('tagsInput')}
        />
      </EntityFormRow>

      <div className="pt-4">
        <p className="mb-1 text-sm font-semibold text-foreground">ملاحظات داخلية</p>
        <p className="mb-2 text-xs text-muted-foreground">تُستخدم هذه الملاحظة للأغراض الداخلية فقط.</p>
        <Textarea id="product-description" rows={4} className="resize-none" {...register('description')} />
      </div>
    </div>
  );
}
