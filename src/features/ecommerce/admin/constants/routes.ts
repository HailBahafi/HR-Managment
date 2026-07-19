/**
 * Ecommerce admin routes live under the `(ecommerce)` route group inside `(app)`.
 *
 * Nav domains: Products → Catalog setup → Inventory → Inventory setup → Sales → Website.
 */
export const ecommerceAdminRoutes = {
  overview: '/overview',
  homepage: '/cms/homepage',
  navigation: '/cms/navigation',
  banners: '/cms/banners',
  content: '/cms/content',
  settings: '/cms/settings',
  products: '/products',
  categories: '/categories',
  attributes: '/attributes',
  brands: '/brands',
  orders: '/orders',
  customers: '/customers',
  warehouses: '/inventory/warehouses',
  warehouseDetail: (warehouseId: string) => `/inventory/warehouses/${warehouseId}`,
  locations: '/inventory/locations',
  locationsForWarehouse: (warehouseId: string) => `/inventory/locations?warehouseId=${warehouseId}`,
  putawayRules: '/inventory/putaway-rules',
  /** تقارير المخزون */
  reportStock: '/inventory/reports/stock',
  reportDetailedStock: '/inventory/reports/detailed-stock',
  reportMoves: '/inventory/reports/moves',
  reportMovesAnalysis: '/inventory/reports/moves-analysis',
  /** صفحات العمليات المستقلة تحت /inventory/{segment} */
  operations: '/inventory/transfers',
  operationsForKind: (kindOrSegment: string) => `/inventory/${
    (
      {
        transfer: 'transfers',
        adjustment: 'adjustments',
        physical_count: 'physical-counts',
        scrap: 'scrap',
        purchase: 'purchases',
        replenishment: 'replenishment',
      } as Record<string, string>
    )[kindOrSegment] ?? kindOrSegment
  }`,
} as const;

export type EcommerceContentTab = 'pages' | 'blog' | 'faq';
export type EcommerceNavigationTab = 'header' | 'footer' | 'announcement';

export function ecommerceContentHref(tab: EcommerceContentTab = 'pages'): string {
  return `${ecommerceAdminRoutes.content}?tab=${tab}`;
}

export function ecommerceNavigationHref(tab: EcommerceNavigationTab = 'header'): string {
  return `${ecommerceAdminRoutes.navigation}?tab=${tab}`;
}

/** Former shallow routes — kept only for redirects to domain pages. */
export const ecommerceAdminLegacyRoutes = {
  footer: '/cms/footer',
  cmsPages: '/cms/pages',
  blog: '/cms/blog',
  faq: '/cms/faq',
  seo: '/cms/seo',
} as const;
