/** True when the current route belongs to the HR application. */
export function isHrAppPath(pathname: string): boolean {
  return pathname === '/hr' || pathname.startsWith('/hr/');
}

/** True when the current route belongs to the System application. */
export function isSystemAppPath(pathname: string): boolean {
  return pathname === '/system' || pathname.startsWith('/system/');
}

/** True on the applications launcher home page. */
export function isLauncherPath(pathname: string): boolean {
  return pathname === '/';
}

/**
 * True when the current route belongs to the Ecommerce admin module.
 * These routes carry no `/ecommerce` prefix (see ecommerceAdminRoutes) so this must be kept in
 * sync with `isEcommerceAdminNavPath` in `@/features/ecommerce/admin/constants/nav`.
 */
export function isEcommerceAppPath(pathname: string): boolean {
  const bases = [
    '/overview',
    '/products',
    '/categories',
    '/brands',
    '/orders',
    '/customers',
    '/cms',
    '/inventory',
  ];
  return bases.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}
