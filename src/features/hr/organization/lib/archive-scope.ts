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

export type OrganizationListArchiveQuery = {
  archiveScope?: OrganizationArchiveScope;
};

/** @deprecated Use OrganizationListArchiveQuery */
export type OrganizationListStatusQuery = OrganizationListArchiveQuery;

export function organizationListArchiveQuery(
  scope: OrganizationArchiveScope = ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
): OrganizationListArchiveQuery {
  return { archiveScope: scope };
}

/** Pickers and reference loads — non-archived only. */
export function organizationActiveListArchiveQuery(): OrganizationListArchiveQuery {
  return { archiveScope: 'active' };
}

/** @deprecated Use organizationListArchiveQuery */
export function organizationListStatusQuery(
  scope: OrganizationArchiveScope = ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
): OrganizationListArchiveQuery {
  return organizationListArchiveQuery(scope);
}

/** @deprecated Use organizationActiveListArchiveQuery */
export function organizationActiveListStatusQuery(): OrganizationListArchiveQuery {
  return organizationActiveListArchiveQuery();
}
