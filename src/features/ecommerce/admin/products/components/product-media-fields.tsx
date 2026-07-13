'use client';

import { useFieldArray, type Control, type UseFormRegister } from 'react-hook-form';
import { ArrowDown, ArrowUp, Plus, Star, Trash2 } from 'lucide-react';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  control: Control<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
};

/**
 * Multi-image management via `useFieldArray` — add/remove/reorder (up/down buttons) and mark one
 * primary. Full drag-and-drop reordering is deferred to a later sprint (PRODUCTS_DOMAIN_BLUEPRINT.md).
 */
export function ProductMediaFields({ control, register }: Props) {
  const { fields, append, remove, move, update } = useFieldArray({ control, name: 'media' });

  function setPrimary(index: number) {
    fields.forEach((field, itemIndex) => {
      update(itemIndex, { ...field, isPrimary: itemIndex === index });
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>الصور</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ url: '', alt: '', isPrimary: fields.length === 0 })}
        >
          <Plus className="h-4 w-4" />
          إضافة صورة
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">لا توجد صور بعد.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2 rounded-md border border-border p-2">
              <div className="grid flex-1 grid-cols-2 gap-2">
                <Input
                  dir="ltr"
                  placeholder="رابط الصورة"
                  {...register(`media.${index}.url` as const)}
                />
                <Input placeholder="النص البديل" {...register(`media.${index}.alt` as const)} />
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="تعيين كصورة رئيسية"
                  title={field.isPrimary ? 'الصورة الرئيسية' : 'تعيين كصورة رئيسية'}
                  onClick={() => setPrimary(index)}
                >
                  <Star className={field.isPrimary ? 'h-4 w-4 fill-primary text-primary' : 'h-4 w-4'} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="نقل لأعلى"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="نقل لأسفل"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="حذف الصورة" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
