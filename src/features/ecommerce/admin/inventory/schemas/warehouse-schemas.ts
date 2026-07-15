import { z } from 'zod';

export const warehouseFormSchema = z.object({
  code: z.string().min(1, 'رمز المستودع مطلوب').max(32),
  nameAr: z.string().min(1, 'اسم المستودع مطلوب').max(120),
  nameEn: z.string().max(120).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  address: z.string().max(250).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
});

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

export const WAREHOUSE_FORM_DEFAULT_VALUES: WarehouseFormValues = {
  code: '',
  nameAr: '',
  nameEn: '',
  description: '',
  address: '',
  status: 'active',
};

export const warehouseLocationFormSchema = z.object({
  code: z.string().min(1, 'رمز الموقع مطلوب').max(32),
  nameAr: z.string().min(1, 'اسم الموقع مطلوب').max(120),
  nameEn: z.string().max(120).optional().or(z.literal('')),
  aisle: z.string().max(32).optional().or(z.literal('')),
  rack: z.string().max(32).optional().or(z.literal('')),
  bin: z.string().max(32).optional().or(z.literal('')),
  isActive: z.boolean(),
});

export type WarehouseLocationFormValues = z.infer<typeof warehouseLocationFormSchema>;

export const WAREHOUSE_LOCATION_FORM_DEFAULT_VALUES: WarehouseLocationFormValues = {
  code: '',
  nameAr: '',
  nameEn: '',
  aisle: '',
  rack: '',
  bin: '',
  isActive: true,
};

export const warehouseOperationFormSchema = z.object({
  reference: z.string().min(1, 'المرجع مطلوب').max(64),
  status: z.enum(['draft', 'posted', 'cancelled']),
  occurredAt: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().max(500).optional().or(z.literal('')),
  productName: z.string().min(1, 'اسم المنتج مطلوب').max(160),
  sku: z.string().max(64).optional().or(z.literal('')),
  quantity: z.number({ error: 'الكمية مطلوبة' }).positive('الكمية يجب أن تكون أكبر من صفر'),
  fromLocationId: z.string().optional().or(z.literal('')),
  toLocationId: z.string().optional().or(z.literal('')),
});

export type WarehouseOperationFormValues = z.infer<typeof warehouseOperationFormSchema>;

export const WAREHOUSE_OPERATION_FORM_DEFAULT_VALUES: WarehouseOperationFormValues = {
  reference: '',
  status: 'draft',
  occurredAt: new Date().toISOString().slice(0, 16),
  notes: '',
  productName: '',
  sku: '',
  quantity: 1,
  fromLocationId: '',
  toLocationId: '',
};
