'use client';

import { Controller, type Control, type UseFormRegister } from 'react-hook-form';
import { PRODUCT_STATUS_OPTIONS } from '@/features/ecommerce/admin/products/schemas/product-schema';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import type { Brand } from '@/features/ecommerce/domain/types/brand';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const NO_BRAND_VALUE = '__none__';

type Props = {
  control: Control<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
  brands: Brand[] | undefined;
};

/** Lifecycle status / brand / tags fields — kept separate from `ProductInventoryFields` so each stays under the Component Architecture Contract's preferred 200-line size. */
export function ProductOrganizationFields({ control, register, brands }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="product-status">الحالة</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="product-status" aria-label="الحالة">
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
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="product-brand">العلامة التجارية</Label>
          <Controller
            control={control}
            name="brandId"
            render={({ field }) => (
              <Select
                value={field.value ?? NO_BRAND_VALUE}
                onValueChange={(value) => field.onChange(value === NO_BRAND_VALUE ? undefined : value)}
              >
                <SelectTrigger id="product-brand" aria-label="العلامة التجارية">
                  <SelectValue placeholder="بدون علامة تجارية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_BRAND_VALUE}>بدون علامة تجارية</SelectItem>
                  {brands?.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="product-tags">الوسوم (مفصولة بفاصلة)</Label>
        <Input id="product-tags" placeholder="مطبخ, خشب" {...register('tagsInput')} />
      </div>
    </>
  );
}
