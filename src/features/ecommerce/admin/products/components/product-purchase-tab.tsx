'use client';

import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  control: Control<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
};

export function ProductPurchaseTab({ control, register }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'purchaseLines' });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        التكلفة وضريبة الشراء من تبويب المعلومات العامة، وخيار «قابل للشراء» من أعلى النموذج. هنا بنود الموردين.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start font-medium">المورد</th>
              <th className="px-3 py-2 text-start font-medium">اسم منتج المورد</th>
              <th className="px-3 py-2 text-start font-medium">كود منتج المورد</th>
              <th className="px-3 py-2 text-start font-medium">الكمية</th>
              <th className="px-3 py-2 text-start font-medium">سعر الوحدة</th>
              <th className="px-3 py-2 text-start font-medium">خصم %</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <Input {...register(`purchaseLines.${index}.supplier`)} />
                </td>
                <td className="px-3 py-2">
                  <Input {...register(`purchaseLines.${index}.supplierProductName`)} />
                </td>
                <td className="px-3 py-2">
                  <Input dir="ltr" {...register(`purchaseLines.${index}.supplierProductCode`)} />
                </td>
                <td className="px-3 py-2">
                  <Input type="number" min={0} dir="ltr" {...register(`purchaseLines.${index}.quantity`)} />
                </td>
                <td className="px-3 py-2">
                  <Input type="number" step="0.01" min={0} dir="ltr" {...register(`purchaseLines.${index}.unitPrice`)} />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    dir="ltr"
                    {...register(`purchaseLines.${index}.discountPercent`)}
                  />
                </td>
                <td className="px-3 py-2">
                  <Button type="button" variant="ghost" size="icon" aria-label="حذف البند" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={7} className="px-3 py-2">
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() =>
                    append({
                      id: `pu-${Math.random().toString(36).slice(2, 8)}`,
                      supplier: '',
                      supplierProductName: '',
                      supplierProductCode: '',
                      quantity: 1,
                      uom: 'وحدات',
                      unitPrice: 0,
                      discountPercent: 0,
                      leadTimeDays: 0,
                    })
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    إضافة بند
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
