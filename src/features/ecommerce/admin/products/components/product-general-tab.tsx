'use client';

import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import {
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
import { Badge } from '@/components/ui/badge';
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
  const priceAmount = useWatch({ control, name: 'priceAmount' }) ?? 0;
  const uom = useWatch({ control, name: 'uom' }) || 'الوحدات';
  const salesTax = useWatch({ control, name: 'salesTax' });
  const purchaseTax = useWatch({ control, name: 'purchaseTax' });

  const taxRate = Number.parseFloat(String(salesTax).replace(/[^\d.]/g, '')) || 0;
  const priceWithTax = priceAmount * (1 + taxRate / 100);

  return (
    <div className="space-y-1">
      <EntityFormRow label="نوع المنتج" hint>
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

      <EntityFormRow label="سعر البيع" htmlFor="product-sale-price" hint>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="product-sale-price"
              type="number"
              step="0.01"
              min={0}
              dir="ltr"
              className="max-w-[8rem]"
              {...register('priceAmount')}
            />
            <span className="text-sm text-muted-foreground">ريال / {uom}</span>
          </div>
          {taxRate > 0 ? (
            <p className="text-xs text-muted-foreground">(= {priceWithTax.toFixed(2)} ريال شامل الضريبة)</p>
          ) : null}
          {errors.priceAmount ? <p className="text-xs text-destructive">{errors.priceAmount.message}</p> : null}
        </div>
      </EntityFormRow>

      <EntityFormRow label="ضرائب المبيعات" htmlFor="product-sales-tax" hint>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="product-sales-tax"
            placeholder="15"
            className="max-w-[8rem]"
            dir="ltr"
            {...register('salesTax')}
          />
          {salesTax ? <Badge variant="subtle">× {String(salesTax).replace('%', '')}%</Badge> : null}
        </div>
      </EntityFormRow>

      <EntityFormRow label="التكلفة" htmlFor="product-cost" hint>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="product-cost"
            type="number"
            step="0.01"
            min={0}
            dir="ltr"
            className="max-w-[8rem]"
            {...register('costAmount')}
          />
          <span className="text-sm text-muted-foreground">ريال / {uom}</span>
        </div>
      </EntityFormRow>

      <EntityFormRow label="ضرائب الشراء" htmlFor="product-purchase-tax" hint>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="product-purchase-tax"
            placeholder="15"
            className="max-w-[8rem]"
            dir="ltr"
            {...register('purchaseTax')}
          />
          {purchaseTax ? <Badge variant="subtle">× {String(purchaseTax).replace('%', '')}%</Badge> : null}
        </div>
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

      <EntityFormRow label="باركود" htmlFor="product-barcode">
        <Input id="product-barcode" dir="ltr" className="max-w-sm" {...register('barcode')} />
      </EntityFormRow>

      <EntityFormRow label="علامات التصنيف" htmlFor="product-tags">
        <Input id="product-tags" className="max-w-sm" placeholder="مفصولة بفواصل" {...register('tagsInput')} />
      </EntityFormRow>

      <EntityFormRow label="الوحدات" htmlFor="product-uom">
        <Input id="product-uom" className="max-w-xs" {...register('uom')} />
      </EntityFormRow>

      <EntityFormRow label="الرابط المختصر" htmlFor="product-slug">
        <Input
          id="product-slug"
          dir="ltr"
          className="max-w-sm"
          placeholder="يُولَّد تلقائيًا من الرقم المرجعي إن تُرك فارغًا"
          {...register('slug')}
        />
        {errors.slug ? <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p> : null}
      </EntityFormRow>

      <div className="pt-6">
        <p className="mb-1 text-sm font-semibold text-foreground">ملاحظات داخلية</p>
        <p className="mb-2 text-xs text-muted-foreground">تُستخدم هذه الملاحظة للأغراض الداخلية فقط.</p>
        <Textarea id="product-description" rows={4} className="resize-none" {...register('description')} />
      </div>
    </div>
  );
}
