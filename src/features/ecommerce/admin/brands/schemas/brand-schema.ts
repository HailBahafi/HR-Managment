import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const brandFormSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم العلامة التجارية مطلوب'),
  nameEn: z.string().trim().optional(),
  slug: z
    .string()
    .trim()
    .min(1, 'الرابط المختصر مطلوب')
    .regex(slugPattern, 'الرابط المختصر يجب أن يكون بأحرف إنجليزية صغيرة وأرقام وشرطات فقط'),
  description: z.string().trim().optional(),
  websiteUrl: z.union([z.string().trim().url('رابط الموقع غير صالح'), z.literal('')]).optional(),
  logoUrl: z.union([z.string().trim().url('رابط الشعار غير صالح'), z.literal('')]).optional(),
  isActive: z.boolean(),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;

export const BRAND_FORM_DEFAULT_VALUES: BrandFormValues = {
  nameAr: '',
  nameEn: '',
  slug: '',
  description: '',
  websiteUrl: '',
  logoUrl: '',
  isActive: true,
  metaTitle: '',
  metaDescription: '',
};
