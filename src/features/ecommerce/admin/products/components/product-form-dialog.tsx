'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useBrands } from '@/features/ecommerce/admin/brands/hooks/use-brands';
import { useCategories } from '@/features/ecommerce/admin/categories/hooks/use-categories';
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
import { ProductFormHeader } from '@/features/ecommerce/admin/products/components/product-form-header';
import { ProductGeneralTab } from '@/features/ecommerce/admin/products/components/product-general-tab';
import { ProductAttributesTab } from '@/features/ecommerce/admin/products/components/product-attributes-tab';
import { ProductSalesTab } from '@/features/ecommerce/admin/products/components/product-sales-tab';
import { ProductPricesTab } from '@/features/ecommerce/admin/products/components/product-prices-tab';
import { ProductPurchaseTab } from '@/features/ecommerce/admin/products/components/product-purchase-tab';
import { ProductInventoryTab } from '@/features/ecommerce/admin/products/components/product-inventory-tab';
import { ProductLogisticsTab } from '@/features/ecommerce/admin/products/components/product-logistics-tab';
import type { Product } from '@/features/ecommerce/domain/types/product';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';

type Props = {
  product?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ensureSlug(values: ProductFormValues): ProductFormValues {
  if (values.slug?.trim()) return values;
  const fromSku = values.sku
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return { ...values, slug: fromSku || `product-${Date.now()}` };
}

const TAB_TRIGGER_CLASS =
  'rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none';

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
    const input = formValuesToCreateInput(ensureSlug(values), companyId);

    if (product) {
      await update.mutateAsync({ companyId, id: product.id, patch: input });
    } else {
      await create.mutateAsync(input);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-4xl sm:max-w-4xl')}>
        <div className={dialogShellHeaderClass}>
          <DialogTitle className="text-base font-semibold">
            {isEditing ? 'تعديل المنتج' : 'منتج جديد'}
          </DialogTitle>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit(onSubmit)(e);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={cn(dialogShellBodyClass, 'space-y-5')}>
            <ProductFormHeader
              control={form.control}
              register={form.register}
              setValue={form.setValue}
              nameError={form.formState.errors.nameAr?.message}
            />

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger value="general" className={TAB_TRIGGER_CLASS}>
                  المعلومات العامة
                </TabsTrigger>
                <TabsTrigger value="attributes" className={TAB_TRIGGER_CLASS}>
                  الخصائص والمتغيرات
                </TabsTrigger>
                <TabsTrigger value="sales" className={TAB_TRIGGER_CLASS}>
                  المبيعات
                </TabsTrigger>
                <TabsTrigger value="prices" className={TAB_TRIGGER_CLASS}>
                  الأسعار
                </TabsTrigger>
                <TabsTrigger value="purchase" className={TAB_TRIGGER_CLASS}>
                  الشراء
                </TabsTrigger>
                <TabsTrigger value="inventory" className={TAB_TRIGGER_CLASS}>
                  المخزون
                </TabsTrigger>
                <TabsTrigger value="logistics" className={TAB_TRIGGER_CLASS}>
                  اللوجستيات
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-4">
                <ProductGeneralTab
                  control={form.control}
                  errors={form.formState.errors}
                  register={form.register}
                  categories={categoriesData?.items}
                  brands={brandsData?.items}
                />
              </TabsContent>
              <TabsContent value="attributes" className="mt-4">
                <ProductAttributesTab register={form.register} />
              </TabsContent>
              <TabsContent value="sales" className="mt-4">
                <ProductSalesTab control={form.control} errors={form.formState.errors} register={form.register} />
              </TabsContent>
              <TabsContent value="prices" className="mt-4">
                <ProductPricesTab control={form.control} errors={form.formState.errors} register={form.register} />
              </TabsContent>
              <TabsContent value="purchase" className="mt-4">
                <ProductPurchaseTab control={form.control} errors={form.formState.errors} register={form.register} />
              </TabsContent>
              <TabsContent value="inventory" className="mt-4">
                <ProductInventoryTab control={form.control} errors={form.formState.errors} register={form.register} />
              </TabsContent>
              <TabsContent value="logistics" className="mt-4">
                <ProductLogisticsTab errors={form.formState.errors} register={form.register} />
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
            <Button type="submit" disabled={isSaving || !companyId}>
              {isSaving ? 'جاري الحفظ…' : isEditing ? 'حفظ' : 'إنشاء المنتج'}
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
