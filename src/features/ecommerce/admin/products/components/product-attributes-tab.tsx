'use client';

import type { UseFormRegister } from 'react-hook-form';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  register: UseFormRegister<ProductFormInput>;
};

export function ProductAttributesTab({ register }: Props) {
  return (
    <div className="space-y-3 py-1">
      <div>
        <p className="mb-1 text-sm font-semibold text-foreground">الخصائص والمتغيرات</p>
        <p className="mb-3 text-xs text-muted-foreground">
          يمكن لاحقًا ربط هذا التبويب بجداول خصائص/متغيرات مفصّلة. حاليًا احفظ ملاحظات الإعداد هنا.
        </p>
      </div>
      <Textarea
        id="product-attribute-notes"
        rows={6}
        className="resize-none"
        placeholder="مثال: اللون، المقاس، المواد… أو ملاحظات إعداد المتغيرات"
        {...register('attributeNotes')}
      />
    </div>
  );
}
