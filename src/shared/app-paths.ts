/** True when the current route belongs to the HR application. */
export function isHrAppPath(pathname: string): boolean {
  return pathname === '/hr' || pathname.startsWith('/hr/');
}

/** True on the applications launcher home page. */
export function isLauncherPath(pathname: string): boolean {
  return pathname === '/';
}
