/** أقسام التطبيق الديناميكية تحت `/hr/leaves/[section]` */
export const LEAVE_APP_SECTION_SLUGS = ['leave-types', 'public-holidays'] as const;

export type LeaveAppSectionSlug = (typeof LEAVE_APP_SECTION_SLUGS)[number];
