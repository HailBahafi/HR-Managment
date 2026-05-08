/** ألوان أدوار الصلاحيات — قيم CSS variables من `globals.css` (لا ألوان عشوائية). */
export const PERMISSION_ROLE_COLOR_TOKENS = [
  'destructive',
  'primary',
  'warning',
  'gold',
  'success',
  'primary-700',
  'primary-500',
  'muted-foreground',
] as const;

export type PermissionRoleColorToken = (typeof PERMISSION_ROLE_COLOR_TOKENS)[number];

const LEGACY_HEX_TO_TOKEN: Record<string, PermissionRoleColorToken> = {
  '#b91c1c': 'destructive',
  '#0f766e': 'primary',
  '#c2410c': 'warning',
  '#ca8a04': 'gold',
  '#0891b2': 'primary-500',
  '#15803d': 'success',
  '#1d4ed8': 'primary-700',
  '#7c3aed': 'primary-700',
  '#be185d': 'destructive',
  '#475569': 'muted-foreground',
};

export function coercePermissionRoleColorToken(input: string): PermissionRoleColorToken {
  const lower = input.trim().toLowerCase();
  if (LEGACY_HEX_TO_TOKEN[lower]) return LEGACY_HEX_TO_TOKEN[lower];
  if ((PERMISSION_ROLE_COLOR_TOKENS as readonly string[]).includes(lower)) {
    return lower as PermissionRoleColorToken;
  }
  return 'primary';
}

export function permissionRoleCssColor(token: PermissionRoleColorToken): string {
  return `hsl(var(--${token}))`;
}

export function permissionRoleSurface(token: PermissionRoleColorToken, alpha: number): string {
  return `hsl(var(--${token}) / ${alpha})`;
}
