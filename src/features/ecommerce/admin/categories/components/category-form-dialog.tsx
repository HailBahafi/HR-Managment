'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCategoryMutations } from '@/features/ecommerce/admin/categories/hooks/use-category-mutations';
import { useBrands } from '@/features/ecommerce/admin/brands/hooks/use-brands';
import {
  CATEGORY_FORM_DEFAULT_VALUES,
  categoryFormSchema,
  type CategoryFormValues,
} from '@/features/ecommerce/admin/categories/schemas/category-schema';
import {
  categoryToFormValues,
  formValuesToCreateCategoryInput,
} from '@/features/ecommerce/admin/categories/lib/category-form-mapping';
import type { Category } from '@/features/ecommerce/domain/types/category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  dialogMaxHeightClass,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';

type Props = {
  category?: Category | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CategoryFormDialog({ category, categories, open, onOpenChange }: Props) {
  const companyId = getStorefrontCompanyId();
  const { create, update } = useCategoryMutations();
  const brandsQuery = useBrands({ companyId, limit: 100 });
  const isEditing = Boolean(category);
  const isSaving = create.isPending || update.isPending;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: CATEGORY_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(category ? categoryToFormValues(category) : CATEGORY_FORM_DEFAULT_VALUES);
  }, [open, category, form]);

  const parentOptions = categories.filter((item) => item.id !== category?.id);
  const featuredBrandIds = form.watch('featuredBrandIds');

  const onSubmit = async (values: CategoryFormValues) => {
    if (!companyId) return;
    const input = formValuesToCreateCategoryInput(values, companyId);

    if (category) {
      await update.mutateAsync({ companyId, id: category.id, patch: input });
    } else {
      await create.mutateAsync(input);
    }
    onOpenChange(false);
  };

  function toggleBrand(brandId: string) {
    const current = form.getValues('featuredBrandIds');
    form.setValue(
      'featuredBrandIds',
      current.includes(brandId) ? current.filter((id) => id !== brandId) : [...current, brandId],
      { shouldDirty: true },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogMaxHeightClass} max-w-lg overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</DialogTitle>
          <DialogDescription>
            التصنيفات الجذرية تظهر في شريط التنقل. أضف أبناً/أحفاداً لتعبئة قائمة نون، وحدّد الماركات المميزة لكل جذر.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit(onSubmit)(event);
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nameAr">الاسم (عربي)</Label>
              <Input id="nameAr" {...form.register('nameAr')} />
              {form.formState.errors.nameAr ? (
                <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nameEn">الاسم (إنجليزي)</Label>
              <Input id="nameEn" {...form.register('nameEn')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">الرابط المختصر</Label>
            <Input id="slug" dir="ltr" {...form.register('slug')} />
            {form.formState.errors.slug ? (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>التصنيف الأب</Label>
            <Controller
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <Select
                  value={field.value ?? 'root'}
                  onValueChange={(value) => field.onChange(value === 'root' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="تصنيف جذري" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">— تصنيف جذري (شريط التنقل) —</SelectItem>
                    {parentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">الوصف</Label>
            <Textarea id="description" rows={3} {...form.register('description')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="imageUrl">رابط صورة القائمة الضخمة</Label>
            <Input id="imageUrl" dir="ltr" {...form.register('imageUrl')} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="displayOrder">ترتيب العرض</Label>
              <Controller
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <Input
                    id="displayOrder"
                    type="number"
                    value={field.value}
                    onChange={(event) => field.onChange(Number(event.target.value) || 0)}
                  />
                )}
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Switch checked={field.value} onCheckedChange={field.onChange} id="isActive" />
                    <Label htmlFor="isActive">مفعّل</Label>
                  </div>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ماركات مميزة في القائمة (للتصنيف الجذري)</Label>
            <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border p-2">
              {(brandsQuery.data?.items ?? []).map((brand) => {
                const selected = featuredBrandIds.includes(brand.id);
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => toggleBrand(brand.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors',
                      selected
                        ? 'border-primary bg-primary/10 font-semibold text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {brand.nameAr}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="metaTitle">عنوان SEO</Label>
              <Input id="metaTitle" {...form.register('metaTitle')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="metaDescription">وصف SEO</Label>
              <Input id="metaDescription" {...form.register('metaDescription')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'جارٍ الحفظ…' : 'حفظ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
