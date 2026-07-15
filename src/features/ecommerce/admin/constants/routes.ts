/**
 * Ecommerce admin routes live under the `(ecommerce)` route group inside `(app)`.
 *
 * Website storefront tooling is grouped under one nav dropdown; other areas are
 * business domains (Catalog, Sales, …).
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
  brands: '/brands',
  orders: '/orders',
  customers: '/customers',
  warehouses: '/inventory/warehouses',
  warehouseDetail: (warehouseId: string) => `/inventory/warehouses/${warehouseId}`,
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
