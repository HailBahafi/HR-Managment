'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { EntityFormRow } from '@/features/ecommerce/admin/shared/components/entity-form-row';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
};

export function ProductLogisticsTab({ errors, register }: Props) {
  return (
    <div className="space-y-1">
      <EntityFormRow label="المسؤول" htmlFor="product-responsible">
        <Input id="product-responsible" className="max-w-sm" {...register('responsible')} />
      </EntityFormRow>

      <EntityFormRow label="الوزن (كجم)" htmlFor="product-weight">
        <Input id="product-weight" type="number" step="0.01" min={0} dir="ltr" className="max-w-[8rem]" {...register('weightKg')} />
        {errors.weightKg ? <p className="mt-1 text-xs text-destructive">{errors.weightKg.message}</p> : null}
      </EntityFormRow>

      <EntityFormRow label="الحجم (م³)" htmlFor="product-volume">
        <Input id="product-volume" type="number" step="0.01" min={0} dir="ltr" className="max-w-[8rem]" {...register('volumeM3')} />
        {errors.volumeM3 ? <p className="mt-1 text-xs text-destructive">{errors.volumeM3.message}</p> : null}
      </EntityFormRow>

      <EntityFormRow label="وصف الاستلام" htmlFor="product-receipt-desc" className="sm:items-start">
        <Textarea
          id="product-receipt-desc"
          rows={2}
          className="max-w-lg resize-none"
          placeholder="تتم إضافة هذه الملاحظة إلى أوامر الاستلام."
          {...register('receiptDescription')}
        />
      </EntityFormRow>

      <EntityFormRow label="وصف التوصيل" htmlFor="product-delivery-desc" className="sm:items-start">
        <Textarea
          id="product-delivery-desc"
          rows={2}
          className="max-w-lg resize-none"
          placeholder="تمت إضافة هذه الملاحظة إلى أوامر التوصيل."
          {...register('deliveryDescription')}
        />
      </EntityFormRow>

      <EntityFormRow label="وصف الحركة الداخلية" htmlFor="product-internal-desc" className="sm:items-start">
        <Textarea
          id="product-internal-desc"
          rows={2}
          className="max-w-lg resize-none"
          placeholder="تتم إضافة هذه الملاحظة إلى أوامر التحويل الداخلي."
          {...register('internalMoveDescription')}
        />
      </EntityFormRow>
    </div>
  );
}
