'use client';

import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  control: Control<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
};

export function ProductPricesTab({ control, errors, register }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'priceLines' });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="product-base-price">سعر الوحدة الافتراضي</Label>
          <Input id="product-base-price" type="number" step="0.01" min="0" dir="ltr" {...register('priceAmount')} />
          {errors.priceAmount ? <p className="text-xs text-destructive">{errors.priceAmount.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-compare-price">السعر قبل الخصم</Label>
          <Input
            id="product-compare-price"
            type="number"
            step="0.01"
            min="0"
            dir="ltr"
            {...register('compareAtPriceAmount')}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start font-medium">قائمة الأسعار</th>
              <th className="px-3 py-2 text-start font-medium">أقل كمية</th>
              <th className="px-3 py-2 text-start font-medium">Packaging</th>
              <th className="px-3 py-2 text-start font-medium">سعر الوحدة</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <Input {...register(`priceLines.${index}.priceList`)} placeholder="قائمة الافتراضي" />
                </td>
                <td className="px-3 py-2">
                  <Input type="number" min={0} dir="ltr" {...register(`priceLines.${index}.minQty`)} />
                </td>
                <td className="px-3 py-2">
                  <Input dir="ltr" {...register(`priceLines.${index}.packaging`)} />
                </td>
                <td className="px-3 py-2">
                  <Input type="number" step="0.01" min={0} dir="ltr" {...register(`priceLines.${index}.unitPrice`)} />
                </td>
                <td className="px-3 py-2">
                  <Button type="button" variant="ghost" size="icon" aria-label="حذف السعر" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={5} className="px-3 py-2">
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() =>
                    append({
                      id: `pl-${Math.random().toString(36).slice(2, 8)}`,
                      priceList: '',
                      minQty: 1,
                      packaging: '',
                      unitPrice: 0,
                    })
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    إضافة سعر
                  </span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
