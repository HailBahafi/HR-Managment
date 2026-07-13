'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCategories } from '@/features/ecommerce/admin/categories/hooks/use-categories';
import { useBrands } from '@/features/ecommerce/admin/brands/hooks/use-brands';
import { useProductMutations } from '@/features/ecommerce/admin/products/hooks/use-product-mutations';
import {
  PRODUCT_FORM_DEFAULT_VALUES,
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  formValuesToCreateInput,
  productToFormValues,
} from '@/features/ecommerce/admin/products/lib/product-form-mapping';
import { ProductInventoryFields } from '@/features/ecommerce/admin/products/components/product-inventory-fields';
import { ProductOrganizationFields } from '@/features/ecommerce/admin/products/components/product-organization-fields';
import { ProductMediaFields } from '@/features/ecommerce/admin/products/components/product-media-fields';
import type { Product } from '@/features/ecommerce/domain/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  dialogMaxHeightClass,
} from '@/components/ui/dialog';

type Props = {
  /** Product being edited, or `null`/`undefined` to create a new one. Only read while `open`. */
  product?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductFormDialog({ product, open, onOpenChange }: Props) {
  const companyId = getStorefrontCompanyId();
  const { data: categoriesData } = useCategories({ companyId, limit: 100 });
  const { data: brandsData } = useBrands({ companyId, limit: 100 });
  const { create, update } = useProductMutations();
  const isEditing = Boolean(product);
  const isSaving = create.isPending || update.isPending;

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: PRODUCT_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(product ? productToFormValues(product) : PRODUCT_FORM_DEFAULT_VALUES);
  }, [open, product, form]);

  const onSubmit = async (values: ProductFormValues) => {
    if (!companyId) return;
    const input = formValuesToCreateInput(values, companyId);

    if (product) {
      await update.mutateAsync({ companyId, id: product.id, patch: input });
    } else {
      await create.mutateAsync(input);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogMaxHeightClass} max-w-lg overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'حدّث بيانات المنتج ثم احفظ التغييرات.' : 'أدخل بيانات المنتج الجديد.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit(onSubmit)(e);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="product-name-ar">اسم المنتج</Label>
              <Input id="product-name-ar" {...form.register('nameAr')} />
              {form.formState.errors.nameAr ? (
                <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-sku">رمز المنتج (SKU)</Label>
              <Input id="product-sku" dir="ltr" {...form.register('sku')} />
              {form.formState.errors.sku ? (
                <p className="text-xs text-destructive">{form.formState.errors.sku.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-slug">الرابط المختصر (Slug)</Label>
            <Input id="product-slug" dir="ltr" placeholder="office-chair" {...form.register('slug')} />
            {form.formState.errors.slug ? (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-description">الوصف</Label>
            <Textarea id="product-description" rows={3} {...form.register('description')} />
          </div>

          <ProductOrganizationFields control={form.control} register={form.register} brands={brandsData?.items} />

          <ProductInventoryFields
            control={form.control}
            errors={form.formState.errors}
            register={form.register}
            categories={categoriesData?.items}
          />

          <ProductMediaFields control={form.control} register={form.register} />

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isSaving || !companyId}>
              {isSaving ? 'جاري الحفظ…' : isEditing ? 'حفظ التغييرات' : 'إضافة المنتج'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
