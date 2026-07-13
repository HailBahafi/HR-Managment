import { z } from 'zod';

export { STOCK_STATUS_OPTIONS } from '@/features/ecommerce/domain/constants/stock-status';
export { PRODUCT_STATUS_OPTIONS } from '@/features/ecommerce/domain/constants/product-status';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const productFormSchema = z.object({
  sku: z.string().trim().min(1, 'رمز المنتج (SKU) مطلوب'),
  nameAr: z.string().trim().min(1, 'اسم المنتج مطلوب'),
  nameEn: z.string().trim().optional(),
  slug: z
    .string()
    .trim()
    .min(1, 'الرابط المختصر مطلوب')
    .regex(slugPattern, 'الرابط المختصر يجب أن يكون بأحرف إنجليزية صغيرة وأرقام وشرطات فقط'),
  description: z.string().trim().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']),
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'preorder', 'discontinued']),
  stockQuantity: z.coerce.number().int('يجب أن تكون الكمية عددًا صحيحًا').min(0, 'الكمية لا يمكن أن تكون سالبة'),
  trackInventory: z.boolean(),
  allowBackorder: z.boolean(),
  /** Comma-separated in the UI, parsed into `string[]` at the mapping boundary. */
  tagsInput: z.string().trim().optional(),
  priceAmount: z.coerce.number().positive('السعر يجب أن يكون أكبر من صفر'),
  priceCurrency: z.string().trim().min(1, 'العملة مطلوبة'),
  compareAtPriceAmount: z
    .union([z.coerce.number().positive('يجب أن يكون السعر قبل الخصم أكبر من صفر'), z.literal('')])
    .optional()
    .transform((value) => (value === '' || value === undefined ? undefined : value)),
  media: z.array(
    z.object({
      url: z.string().trim().url('رابط الصورة غير صالح'),
      alt: z.string().trim().optional(),
      isPrimary: z.boolean(),
    }),
  ),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
});

/** Raw values as typed/registered in the form (before zod coercion runs). */
export type ProductFormInput = z.input<typeof productFormSchema>;
/** Parsed values after zod validation/coercion — what `handleSubmit` hands to `onSubmit`. */
export type ProductFormValues = z.output<typeof productFormSchema>;

export const PRODUCT_FORM_DEFAULT_VALUES: ProductFormInput = {
  sku: '',
  nameAr: '',
  nameEn: '',
  slug: '',
  description: '',
  categoryId: undefined,
  brandId: undefined,
  status: 'draft',
  stockStatus: 'in_stock',
  stockQuantity: 0,
  trackInventory: true,
  allowBackorder: false,
  tagsInput: '',
  priceAmount: 0,
  priceCurrency: 'SAR',
  compareAtPriceAmount: undefined,
  media: [],
  metaTitle: '',
  metaDescription: '',
};
