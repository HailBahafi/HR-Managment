import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';

const COMPANY_CONFIGS: Record<string, CompanyConfigRecord> = {
  'demo-company': {
    id: 'demo-company',
    name: { ar: 'سوق النخبة', en: 'Elite Market' },
    logoUrl: null,
    faviconUrl: null,
    seo: {
      homeTitle: {
        ar: 'تسوّق البقالة والمشروبات والوجبات الخفيفة أونلاين',
        en: 'Shop groceries, beverages & snacks online',
      },
      homeDescription: {
        ar: 'سوق النخبة — مشروبات، بقالة، مخبوزات، ألبان، مجمدات، وتنظيف بتوصيل سريع داخل السعودية.',
        en: 'Elite Market — beverages, grocery, bakery, dairy, frozen foods & cleaning with fast delivery across Saudi Arabia.',
      },
      productsTitle: { ar: 'كل المنتجات', en: 'All products' },
      productsDescription: {
        ar: 'تصفّح آلاف المنتجات من البقالة والمشروبات والعناية الشخصية.',
        en: 'Browse thousands of grocery, beverage, and personal care products.',
      },
      defaultOgImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
    },
    contact: {
      phone: '+966 50 000 0000',
      email: 'support@elite-market.example',
      address: 'Riyadh, Saudi Arabia',
    },
    social: {
      instagram: 'https://instagram.com/elitemarket',
      twitter: 'https://twitter.com/elitemarket',
      whatsapp: 'https://wa.me/966500000000',
    },
    theme: {
      primary: '175 55% 22%',
      secondary: '38 75% 55%',
      accent: '175 30% 92%',
    },
    navigation: [
      { label: { ar: 'الرئيسية', en: 'Home' }, href: '/store' },
      { label: { ar: 'المنتجات', en: 'Products' }, href: '/store/products' },
      { label: { ar: 'من نحن', en: 'About' }, href: '/store/about' },
      { label: { ar: 'تواصل', en: 'Contact' }, href: '/store/contact' },
    ],
    secondaryNavigation: [],
    footer: {
      copyrightOwnerName: { ar: 'سوق النخبة', en: 'Elite Market' },
      commercialRegistration: '7014367010',
      linkGroups: [
        {
          id: 'company',
          title: { ar: 'الشركة', en: 'Company' },
          links: [
            { label: { ar: 'من نحن', en: 'About us' }, href: '/store/about' },
            { label: { ar: 'تواصل معنا', en: 'Contact us' }, href: '/store/contact' },
            { label: { ar: 'الشروط والأحكام', en: 'Terms & conditions' }, href: '/store/legal/terms' },
            { label: { ar: 'سياسة الخصوصية', en: 'Privacy policy' }, href: '/store/legal/privacy' },
          ],
        },
        {
          id: 'help',
          title: { ar: 'المساعدة', en: 'Help' },
          links: [
            { label: { ar: 'الأسئلة الشائعة', en: 'FAQ' }, href: '/store/faq' },
            { label: { ar: 'التوصيل والشحن', en: 'Delivery & shipping' }, href: '/store/legal/returns' },
            { label: { ar: 'سياسة الإرجاع', en: 'Returns policy' }, href: '/store/legal/returns' },
          ],
        },
        {
          id: 'shop',
          title: { ar: 'التسوق', en: 'Shop' },
          links: [
            { label: { ar: 'المنتجات', en: 'Products' }, href: '/store/products' },
            { label: { ar: 'التصنيفات', en: 'Categories' }, href: '/store/categories' },
            { label: { ar: 'العلامات التجارية', en: 'Brands' }, href: '/store/brands' },
            { label: { ar: 'بحث', en: 'Search' }, href: '/store/search' },
          ],
        },
      ],
    },
    defaultLocale: 'ar',
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
  },
};

export function getCompanyConfigMock(companyId: string): CompanyConfigRecord | null {
  const record = COMPANY_CONFIGS[companyId];
  return record ? (JSON.parse(JSON.stringify(record)) as CompanyConfigRecord) : null;
}

/** Persists company CMS config in the same in-memory store the storefront reads. */
export function saveCompanyConfigMock(record: CompanyConfigRecord): CompanyConfigRecord {
  COMPANY_CONFIGS[record.id] = JSON.parse(JSON.stringify(record)) as CompanyConfigRecord;
  return JSON.parse(JSON.stringify(COMPANY_CONFIGS[record.id])) as CompanyConfigRecord;
}
