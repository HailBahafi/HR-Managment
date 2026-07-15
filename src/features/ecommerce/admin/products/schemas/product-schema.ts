import { z } from 'zod';

export { STOCK_STATUS_OPTIONS } from '@/features/ecommerce/domain/constants/stock-status';
export { PRODUCT_STATUS_OPTIONS } from '@/features/ecommerce/domain/constants/product-status';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PRODUCT_TYPE_OPTIONS = [
  { value: 'goods', labelAr: 'البضائع' },
  { value: 'service', labelAr: 'الخدمة' },
  { value: 'combo', labelAr: 'مجموعة' },
] as const;

export const PRODUCT_TRACKING_OPTIONS = [
  { value: 'none', labelAr: 'حسب الكمية' },
  { value: 'lot', labelAr: 'أرقام المجموعات' },
  { value: 'serial', labelAr: 'الأرقام التسلسلية' },
] as const;

const priceLineSchema = z.object({
  id: z.string(),
  priceList: z.string().trim().min(1, 'قائمة الأسعار مطلوبة'),
  minQty: z.coerce.number().min(0),
  packaging: z.string().trim().optional(),
  unitPrice: z.coerce.number().min(0),
});

const purchaseLineSchema = z.object({
  id: z.string(),
  supplier: z.string().trim().min(1, 'المورد مطلوب'),
  supplierProductName: z.string().trim().optional(),
  supplierProductCode: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  quantity: z.coerce.number().min(0),
  uom: z.string().trim().optional(),
  unitPrice: z.coerce.number().min(0),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  leadTimeDays: z.coerce.number().int().min(0).optional(),
});

export const productFormSchema = z.object({
  sku: z.string().trim().min(1, 'رمز المنتج (SKU) مطلوب'),
  nameAr: z.string().trim().min(1, 'اسم المنتج مطلوب'),
  nameEn: z.string().trim().optional(),
  slug: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || slugPattern.test(value),
      'الرابط المختصر يجب أن يكون بأحرف إنجليزية صغيرة وأرقام وشرطات فقط',
    ),
  description: z.string().trim().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']),
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'preorder', 'discontinued']),
  stockQuantity: z.coerce.number().int('يجب أن تكون الكمية عددًا صحيحًا').min(0, 'الكمية لا يمكن أن تكون سالبة'),
  trackInventory: z.boolean(),
  allowBackorder: z.boolean(),
  tagsInput: z.string().trim().optional(),
  priceAmount: z.coerce.number().min(0, 'السعر لا يمكن أن يكون سالبًا'),
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
  productType: z.enum(['goods', 'service', 'combo']),
  tracking: z.enum(['none', 'lot', 'serial']),
  barcode: z.string().trim().optional(),
  uom: z.string().trim().optional(),
  salesTax: z.string().trim().optional(),
  purchaseTax: z.string().trim().optional(),
  costAmount: z.coerce.number().min(0),
  posAvailable: z.boolean(),
  saleOk: z.boolean(),
  purchaseOk: z.boolean(),
  attributeNotes: z.string().trim().optional(),
  weightKg: z.coerce.number().min(0),
  volumeM3: z.coerce.number().min(0),
  responsible: z.string().trim().optional(),
  receiptDescription: z.string().trim().optional(),
  deliveryDescription: z.string().trim().optional(),
  internalMoveDescription: z.string().trim().optional(),
  priceLines: z.array(priceLineSchema),
  purchaseLines: z.array(purchaseLineSchema),
});

export type ProductFormInput = z.input<typeof productFormSchema>;
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
  priceAmount: 1,
  priceCurrency: 'SAR',
  compareAtPriceAmount: undefined,
  media: [],
  metaTitle: '',
  metaDescription: '',
  productType: 'goods',
  tracking: 'none',
  barcode: '',
  uom: 'وحدات',
  salesTax: '',
  purchaseTax: '',
  costAmount: 0,
  posAvailable: false,
  saleOk: true,
  purchaseOk: true,
  attributeNotes: '',
  weightKg: 0,
  volumeM3: 0,
  responsible: '',
  receiptDescription: '',
  deliveryDescription: '',
  internalMoveDescription: '',
  priceLines: [],
  purchaseLines: [],
};
