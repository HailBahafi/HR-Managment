export const HR_DISCIPLINE_BASE = '/hr/discipline' as const;

export function hrDisciplineSectionHref(slug: string): string {
  return `${HR_DISCIPLINE_BASE}/${slug}`;
}

/** تفعيل التبويب عندما يطابق المسار قسم الانضباط (يشمل مسارات فرعية محتملة). */
export function isDisciplineSectionPathActive(pathname: string, slug: string): boolean {
  return pathname.includes(`${HR_DISCIPLINE_BASE}/${slug}`);
}
