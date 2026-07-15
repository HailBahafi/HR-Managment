'use client';

import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { EntityFormRow } from '@/features/ecommerce/admin/shared/components/entity-form-row';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  control: Control<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
};

export function ProductSalesTab({ errors, register }: Props) {
  return (
    <div className="space-y-1">
      <EntityFormRow label="الاسم الإنجليزي" htmlFor="product-name-en">
        <Input id="product-name-en" className="max-w-sm" {...register('nameEn')} />
      </EntityFormRow>

      <EntityFormRow label="عملة السعر" htmlFor="product-currency">
        <Input id="product-currency" dir="ltr" className="max-w-[8rem]" {...register('priceCurrency')} />
        {errors.priceCurrency ? (
          <p className="mt-1 text-xs text-destructive">{errors.priceCurrency.message}</p>
        ) : null}
      </EntityFormRow>

      <EntityFormRow label="السعر قبل الخصم" htmlFor="product-compare-at">
        <Input
          id="product-compare-at"
          type="number"
          step="0.01"
          min={0}
          dir="ltr"
          className="max-w-[8rem]"
          {...register('compareAtPriceAmount')}
        />
      </EntityFormRow>

      <div className="space-y-1.5 border-b border-border/70 py-3">
        <Label htmlFor="product-meta-title" className="text-sm text-muted-foreground">
          عنوان SEO
        </Label>
        <Input id="product-meta-title" className="max-w-lg" {...register('metaTitle')} />
      </div>

      <div className="space-y-1.5 py-3">
        <Label htmlFor="product-meta-description" className="text-sm text-muted-foreground">
          وصف SEO
        </Label>
        <Textarea id="product-meta-description" rows={3} className="max-w-lg resize-none" {...register('metaDescription')} />
      </div>
    </div>
  );
}
