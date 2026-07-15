'use client';

import * as React from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCatalogAttributeMutations } from '@/features/ecommerce/admin/attributes/hooks/use-catalog-attributes';
import {
  ATTRIBUTE_DISPLAY_OPTIONS,
  CATALOG_ATTRIBUTE_FORM_DEFAULTS,
  VARIANT_CREATION_OPTIONS,
  catalogAttributeFormSchema,
  createEmptyAttributeValue,
  type CatalogAttributeFormInput,
  type CatalogAttributeFormValues,
} from '@/features/ecommerce/admin/attributes/schemas/catalog-attribute-schema';
import type { CatalogAttribute } from '@/features/ecommerce/domain/types/catalog-attribute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  attribute?: CatalogAttribute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormValues(attribute: CatalogAttribute): CatalogAttributeFormInput {
  return {
    nameAr: attribute.nameAr,
    displayType: attribute.displayType,
    createVariant: attribute.createVariant,
    isActive: attribute.isActive,
    values: attribute.values.map((value) => ({
      id: value.id,
      nameAr: value.nameAr,
      freeText: value.freeText ?? '',
      defaultExtraPrice: value.defaultExtraPrice ?? 0,
      extra: value.extra ?? '',
    })),
  };
}

export function CatalogAttributeFormDialog({ attribute, open, onOpenChange }: Props) {
  const companyId = getStorefrontCompanyId();
  const { create, update } = useCatalogAttributeMutations();
  const isEditing = Boolean(attribute);
  const isSaving = create.isPending || update.isPending;

  const form = useForm<CatalogAttributeFormInput, unknown, CatalogAttributeFormValues>({
    resolver: zodResolver(catalogAttributeFormSchema),
    defaultValues: CATALOG_ATTRIBUTE_FORM_DEFAULTS,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'values' });

  React.useEffect(() => {
    if (!open) return;
    form.reset(attribute ? toFormValues(attribute) : CATALOG_ATTRIBUTE_FORM_DEFAULTS);
  }, [open, attribute, form]);

  const onSubmit = async (values: CatalogAttributeFormValues) => {
    if (!companyId) return;
    const payload = {
      companyId,
      nameAr: values.nameAr.trim(),
      displayType: values.displayType,
      createVariant: values.createVariant,
      isActive: values.isActive,
      values: values.values.map((value) => ({
        id: value.id,
        nameAr: value.nameAr.trim(),
        freeText: value.freeText?.trim() || undefined,
        defaultExtraPrice: value.defaultExtraPrice ?? 0,
        extra: value.extra?.trim() || undefined,
      })),
    };

    if (attribute) {
      await update.mutateAsync({ companyId, id: attribute.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-3xl sm:max-w-3xl')}>
        <div className={dialogShellHeaderClass}>
          <DialogTitle className="text-base font-semibold">
            {isEditing ? 'تعديل الخاصية' : 'خاصية جديدة'}
          </DialogTitle>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit(onSubmit)(event);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={cn(dialogShellBodyClass, 'space-y-5')}>
            <div className="space-y-1 border-b border-border pb-4">
              <p className="text-xs text-muted-foreground">اسم الخاصية</p>
              <Input
                placeholder="مثال: اللون"
                className="h-auto border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
                {...form.register('nameAr')}
              />
              {form.formState.errors.nameAr ? (
                <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>نوع العرض</Label>
                <Controller
                  control={form.control}
                  name="displayType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-label="نوع العرض">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTRIBUTE_DISPLAY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.labelAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex items-end gap-2 pb-1">
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch checked={field.value} onCheckedChange={field.onChange} id="attr-active" />
                      <Label htmlFor="attr-active">مفعّلة</Label>
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>إنشاء المتغيِّر</Label>
              <Controller
                control={form.control}
                name="createVariant"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="إنشاء المتغيِّر">
                    {VARIANT_CREATION_OPTIONS.map((option) => {
                      const selected = field.value === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-sm transition-colors',
                            selected
                              ? 'border-primary bg-primary/10 font-medium text-primary'
                              : 'border-border text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {option.labelAr}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">قيم الخاصية</p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">القيمة</th>
                      <th className="px-3 py-2 text-start font-medium">نص حر</th>
                      <th className="px-3 py-2 text-start font-medium">السعر الإضافي الافتراضي</th>
                      <th className="px-3 py-2 text-start font-medium">لون/رابط</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">
                          <Input {...form.register(`values.${index}.nameAr`)} placeholder="قيمة" />
                        </td>
                        <td className="px-3 py-2">
                          <Input {...form.register(`values.${index}.freeText`)} placeholder="اختياري" />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            dir="ltr"
                            className="w-28"
                            {...form.register(`values.${index}.defaultExtraPrice`)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input dir="ltr" placeholder="#hex" {...form.register(`values.${index}.extra`)} />
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="حذف القيمة"
                            disabled={fields.length <= 1}
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => append(createEmptyAttributeValue())}
              >
                <span className="inline-flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  إضافة بند
                </span>
              </button>
              {form.formState.errors.values?.message ? (
                <p className="text-xs text-destructive">{form.formState.errors.values.message}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
            <Button type="submit" disabled={isSaving || !companyId}>
              {isSaving ? 'جاري الحفظ…' : 'حفظ'}
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
