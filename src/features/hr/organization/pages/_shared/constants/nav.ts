import { Bell, Building2, Landmark } from 'lucide-react';
import { hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';

export const hrSettingsNavGroups = [
  {
    labelAr: 'الإعدادات',
    items: [
      {
        slug: 'company' as const,
        labelAr: 'إعدادات الشركة',
        href: hrOrganizationRoutes.pagesCompany,
        icon: Landmark,
      },
      {
        slug: 'hr' as const,
        labelAr: 'إعدادات الموارد البشرية',
        href: hrOrganizationRoutes.pagesHr,
        icon: Bell,
      },
      {
        slug: 'organization' as const,
        labelAr: 'إعدادات النظام والمنظمة',
        href: hrOrganizationRoutes.pagesOrganization,
        icon: Building2,
      },
    ],
  },
] as const;

export type HrSettingsSectionSlug = 'hr' | 'organization' | 'company';

const SECTION_HREF: Record<HrSettingsSectionSlug, string> = {
  hr: hrOrganizationRoutes.pagesHr,
  organization: hrOrganizationRoutes.pagesOrganization,
  company: hrOrganizationRoutes.pagesCompany,
};

export function hrSettingsSectionHref(slug: HrSettingsSectionSlug): string {
  return SECTION_HREF[slug];
}

export function isHrSettingsPathActive(pathname: string, slug: HrSettingsSectionSlug): boolean {
  const href = hrSettingsSectionHref(slug);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isHrSettingsNavPath(pathname: string): boolean {
  return (
    pathname === hrOrganizationRoutes.pages ||
    pathname.startsWith(`${hrOrganizationRoutes.pages}/`)
  );
}

export const settingsNavIcon = Building2;
