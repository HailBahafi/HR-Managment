/** Archive filter for organization directory list APIs. */
export type OrganizationArchiveScope = 'active' | 'archived' | 'all';

export const ORGANIZATION_ARCHIVE_SCOPE_DEFAULT: OrganizationArchiveScope = 'active';

export const ORGANIZATION_ARCHIVE_SCOPE_OPTIONS: readonly {
  value: OrganizationArchiveScope;
  label: string;
}[] = [
  { value: 'active', label: 'غير مؤرشف' },
  { value: 'archived', label: 'مؤرشف' },
  { value: 'all', label: 'الكل' },
];

export type OrganizationListStatusQuery = {
  status?: OrganizationArchiveScope;
};

export function organizationListStatusQuery(
  scope: OrganizationArchiveScope = ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
): OrganizationListStatusQuery {
  return { status: scope };
}

/** Pickers and reference loads — non-archived only. */
export function organizationActiveListStatusQuery(): OrganizationListStatusQuery {
  return { status: 'active' };
}
