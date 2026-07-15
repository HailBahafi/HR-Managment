import { formValuesToCreateInput, productToFormValues } from '@/features/ecommerce/admin/products/lib/product-form-mapping';
import type { Product } from '@/features/ecommerce/domain/types/product';
import type { ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';

const BASE_PRODUCT: Product = {
  id: 'prod-1',
  companyId: 'demo-company',
  sku: 'SKU-1',
  slug: 'test-product',
  nameAr: 'منتج تجريبي',
  media: [],
  price: { amount: 100, currency: 'SAR' },
  categoryId: 'cat-1',
  brandId: 'brand-1',
  status: 'active',
  stockStatus: 'in_stock',
  inventory: { trackInventory: true, quantity: 5, lowStockThreshold: 5, allowBackorder: false },
  tags: ['مطبخ', 'خشب'],
  seo: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('productToFormValues', () => {
  it('maps a product with no media and no optional fields to empty-array/empty-string form defaults', () => {
    const values = productToFormValues({ ...BASE_PRODUCT, tags: undefined });
    expect(values.media).toEqual([]);
    expect(values.nameEn).toBe('');
    expect(values.categoryId).toBe('cat-1');
    expect(values.brandId).toBe('brand-1');
    expect(values.priceAmount).toBe(100);
    expect(values.compareAtPriceAmount).toBeUndefined();
    expect(values.status).toBe('active');
    expect(values.stockQuantity).toBe(5);
    expect(values.tagsInput).toBe('');
  });

  it('maps media items sorted by position, preserving each isPrimary flag', () => {
    const product: Product = {
      ...BASE_PRODUCT,
      media: [
        { id: 'm2', url: 'https://example.com/b.jpg', alt: 'ب', type: 'image', position: 1, isPrimary: true },
        { id: 'm1', url: 'https://example.com/a.jpg', alt: 'صورة أ', type: 'image', position: 0, isPrimary: false },
      ],
    };
    const values = productToFormValues(product);
    expect(values.media).toEqual([
      { url: 'https://example.com/a.jpg', alt: 'صورة أ', isPrimary: false },
      { url: 'https://example.com/b.jpg', alt: 'ب', isPrimary: true },
    ]);
  });

  it('formats tags as a comma-separated string for the input', () => {
    expect(productToFormValues(BASE_PRODUCT).tagsInput).toBe('مطبخ, خشب');
  });

  it('maps a null categoryId/brandId to undefined (not null) for the select fields', () => {
    const product: Product = { ...BASE_PRODUCT, categoryId: null, brandId: null };
    expect(productToFormValues(product).categoryId).toBeUndefined();
    expect(productToFormValues(product).brandId).toBeUndefined();
  });
});

describe('formValuesToCreateInput', () => {
  const BASE_VALUES: ProductFormValues = {
    sku: 'SKU-2',
    nameAr: 'منتج آخر',
    nameEn: '',
    slug: 'another-product',
    description: '',
    categoryId: undefined,
    brandId: undefined,
    status: 'active',
    stockStatus: 'in_stock',
    stockQuantity: 3,
    trackInventory: true,
    allowBackorder: false,
    tagsInput: '',
    priceAmount: 250,
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

  it('injects the given companyId and maps a missing category/brand to null', () => {
    const input = formValuesToCreateInput(BASE_VALUES, 'demo-company');
    expect(input.companyId).toBe('demo-company');
    expect(input.categoryId).toBeNull();
    expect(input.brandId).toBeNull();
    expect(input.media).toEqual([]);
  });

  it('passes status/stockStatus through unchanged', () => {
    expect(formValuesToCreateInput(BASE_VALUES, 'demo-company').status).toBe('active');
    expect(formValuesToCreateInput({ ...BASE_VALUES, status: 'draft' }, 'demo-company').status).toBe('draft');
  });

  it('builds inventory from stockQuantity/trackInventory/allowBackorder', () => {
    const input = formValuesToCreateInput(BASE_VALUES, 'demo-company');
    expect(input.inventory).toEqual({ trackInventory: true, quantity: 3, lowStockThreshold: 5, allowBackorder: false });
  });

  it('parses comma-separated tagsInput into a string array, trimming whitespace', () => {
    const input = formValuesToCreateInput({ ...BASE_VALUES, tagsInput: ' مطبخ ,  خشب ,' }, 'demo-company');
    expect(input.tags).toEqual(['مطبخ', 'خشب']);
  });

  it('maps an empty tagsInput to undefined, not an empty array', () => {
    expect(formValuesToCreateInput(BASE_VALUES, 'demo-company').tags).toBeUndefined();
  });

  it('builds a Money object for compareAtPrice only when an amount is present, reusing the form currency', () => {
    const withCompare = formValuesToCreateInput({ ...BASE_VALUES, compareAtPriceAmount: 300 }, 'demo-company');
    expect(withCompare.compareAtPrice).toEqual({ amount: 300, currency: 'SAR' });

    const withoutCompare = formValuesToCreateInput(BASE_VALUES, 'demo-company');
    expect(withoutCompare.compareAtPrice).toBeUndefined();
  });

  it('maps each media entry with its array index as position', () => {
    const input = formValuesToCreateInput(
      {
        ...BASE_VALUES,
        media: [
          { url: 'https://example.com/a.jpg', alt: '', isPrimary: false },
          { url: 'https://example.com/b.jpg', alt: 'ب', isPrimary: true },
        ],
      },
      'demo-company',
    );
    expect(input.media).toHaveLength(2);
    expect(input.media[0]).toMatchObject({ url: 'https://example.com/a.jpg', alt: 'منتج آخر', position: 0, isPrimary: false });
    expect(input.media[1]).toMatchObject({ url: 'https://example.com/b.jpg', alt: 'ب', position: 1, isPrimary: true });
  });

  it('defaults the first media entry to primary when none is explicitly marked', () => {
    const input = formValuesToCreateInput(
      { ...BASE_VALUES, media: [{ url: 'https://example.com/a.jpg', alt: '', isPrimary: false }] },
      'demo-company',
    );
    expect(input.media[0].isPrimary).toBe(true);
  });

  it('collapses empty-string optional fields to undefined rather than storing blank strings', () => {
    const input = formValuesToCreateInput(BASE_VALUES, 'demo-company');
    expect(input.nameEn).toBeUndefined();
    expect(input.description).toBeUndefined();
    expect(input.seo.metaTitle).toBeUndefined();
    expect(input.seo.metaDescription).toBeUndefined();
  });
});
