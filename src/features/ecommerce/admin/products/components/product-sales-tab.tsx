'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { EntityFormRow } from '@/features/ecommerce/admin/shared/components/entity-form-row';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
};

export function ProductSalesTab({ register }: Props) {
  return (
    <div className="space-y-1">
      <p className="mb-3 text-xs text-muted-foreground">
        قنوات البيع تُضبط من أعلى النموذج (المبيعات / نقطة البيع). هنا بيانات العرض والمتجر فقط.
      </p>

      <EntityFormRow label="الاسم الإنجليزي" htmlFor="product-name-en">
        <Input id="product-name-en" className="max-w-sm" {...register('nameEn')} />
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
