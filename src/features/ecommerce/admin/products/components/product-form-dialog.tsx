'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useBrands } from '@/features/ecommerce/admin/brands/hooks/use-brands';
import { useCategories } from '@/features/ecommerce/admin/categories/hooks/use-categories';
import { usePutawayRules } from '@/features/ecommerce/admin/inventory/putaway-rules/hooks/use-putaway-rules';
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
import { ProductUnitsTab } from '@/features/ecommerce/admin/products/components/product-units-tab';
import { ProductStorefrontTab } from '@/features/ecommerce/admin/products/components/product-storefront-tab';
import { ProductInventoryTab } from '@/features/ecommerce/admin/products/components/product-inventory-tab';
import type { ProductRelatedDocKey } from '@/features/ecommerce/admin/products/components/product-related-docs-bar';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
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

type FormTab = 'general' | 'attributes' | 'units' | 'storefront' | 'availability';

export function ProductFormDialog({ product, open, onOpenChange }: Props) {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const { data: categoriesData } = useCategories({ companyId, limit: 100 });
  const { data: brandsData } = useBrands({ companyId, limit: 100 });
  const { data: putawayData } = usePutawayRules(
    { companyId, productId: product?.id, limit: 1 },
    { enabled: Boolean(product?.id) },
  );
  const { create, update } = useProductMutations();
  const isEditing = Boolean(product);
  const isSaving = create.isPending || update.isPending;
  const [activeTab, setActiveTab] = React.useState<FormTab>('general');

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: PRODUCT_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(product ? productToFormValues(product) : PRODUCT_FORM_DEFAULT_VALUES);
    setActiveTab('general');
  }, [open, product, form]);

  const onSubmit = async (values: ProductFormValues) => {
    if (!companyId) return;
    const input = formValuesToCreateInput(ensureSlug(values), companyId, { existing: product });

    if (product) {
      await update.mutateAsync({ companyId, id: product.id, patch: input });
    } else {
      await create.mutateAsync(input);
    }
    onOpenChange(false);
  };

  function onRelatedDoc(key: ProductRelatedDocKey) {
    if (key !== 'putaway') return;
    if (!product?.id) {
      toast.message('احفظ المنتج أولًا ثم افتح قواعد التخزين.');
      return;
    }
    onOpenChange(false);
    router.push(`${ecommerceAdminRoutes.putawayRules}?productId=${product.id}`);
  }

  const putawayCount = product?.id ? (putawayData?.pagination.total ?? putawayData?.items.length ?? 0) : 0;

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
              onRelatedDocSelect={onRelatedDoc}
              relatedDocs={[
                {
                  key: 'putaway',
                  label: 'قواعد التخزين',
                  count: putawayCount,
                  hint: product?.id
                    ? 'فتح قائمة قواعد التخزين لهذا المنتج'
                    : 'احفظ المنتج أولًا لإضافة قواعد التخزين',
                },
              ]}
            />

            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as FormTab)}
              className="w-full"
            >
              <TabsList className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger value="general" className={TAB_TRIGGER_CLASS}>
                  المعلومات العامة
                </TabsTrigger>
                <TabsTrigger value="attributes" className={TAB_TRIGGER_CLASS}>
                  الخصائص والمتغيرات
                </TabsTrigger>
                <TabsTrigger value="units" className={TAB_TRIGGER_CLASS}>
                  الوحدات والتغليف
                </TabsTrigger>
                <TabsTrigger value="storefront" className={TAB_TRIGGER_CLASS}>
                  عرض المتجر
                </TabsTrigger>
                <TabsTrigger value="availability" className={TAB_TRIGGER_CLASS}>
                  التوفر
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
                <ProductAttributesTab control={form.control} errors={form.formState.errors} />
              </TabsContent>
              <TabsContent value="units" className="mt-4">
                <ProductUnitsTab
                  control={form.control}
                  errors={form.formState.errors}
                  setValue={form.setValue}
                />
              </TabsContent>
              <TabsContent value="storefront" className="mt-4">
                <ProductStorefrontTab errors={form.formState.errors} register={form.register} />
              </TabsContent>
              <TabsContent value="availability" className="mt-4">
                <ProductInventoryTab control={form.control} errors={form.formState.errors} register={form.register} />
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
