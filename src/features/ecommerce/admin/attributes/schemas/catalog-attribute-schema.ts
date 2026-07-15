import { z } from 'zod';

export const ATTRIBUTE_DISPLAY_OPTIONS = [
  { value: 'radio', labelAr: 'راديو' },
  { value: 'pills', labelAr: 'حبوب' },
  { value: 'select', labelAr: 'تحديد' },
  { value: 'color', labelAr: 'ألوان' },
  { value: 'image', labelAr: 'صور' },
  { value: 'multi', labelAr: 'صناديق اختيار متعددة' },
] as const;

export const VARIANT_CREATION_OPTIONS = [
  { value: 'always', labelAr: 'فوراً' },
  { value: 'dynamic', labelAr: 'ديناميكياً' },
  { value: 'never', labelAr: 'مطلقاً' },
] as const;

const valueSchema = z.object({
  id: z.string(),
  nameAr: z.string().trim().min(1, 'القيمة مطلوبة'),
  freeText: z.string().trim().optional(),
  defaultExtraPrice: z.coerce.number().min(0).optional(),
  extra: z.string().trim().optional(),
});

export const catalogAttributeFormSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم الخاصية مطلوب'),
  displayType: z.enum(['radio', 'pills', 'select', 'color', 'image', 'multi']),
  createVariant: z.enum(['always', 'dynamic', 'never']),
  isActive: z.boolean(),
  values: z.array(valueSchema).min(1, 'أضف قيمة واحدة على الأقل'),
});

export type CatalogAttributeFormValues = z.infer<typeof catalogAttributeFormSchema>;
export type CatalogAttributeFormInput = z.input<typeof catalogAttributeFormSchema>;

export function createEmptyAttributeValue() {
  return {
    id: `val-${Math.random().toString(36).slice(2, 9)}`,
    nameAr: '',
    freeText: '',
    defaultExtraPrice: 0,
    extra: '',
  };
}

export const CATALOG_ATTRIBUTE_FORM_DEFAULTS: CatalogAttributeFormInput = {
  nameAr: '',
  displayType: 'radio',
  createVariant: 'always',
  isActive: true,
  values: [createEmptyAttributeValue()],
};
