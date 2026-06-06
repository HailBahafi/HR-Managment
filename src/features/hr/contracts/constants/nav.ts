import type { LucideIcon } from 'lucide-react';
import {
  CalendarRange,
  FileSignature,
  BookOpen,
  FileSpreadsheet,
  UserCheck,
  Coins,
  FileStack,
} from 'lucide-react';

export type HRContractsNavItem = {
  slug: string;
  labelAr: string;
  icon: LucideIcon;
};

export type HRContractsNavGroup = {
  labelAr: string;
  items: HRContractsNavItem[];
};

/** الراتب + التقارير — للهيدر (منفصل عن العقود). */
export const hrPayrollNavGroups: HRContractsNavGroup[] = [
  {
    labelAr: 'الراتب',
    items: [
      { slug: 'payroll-periods', labelAr: 'فترات الراتب', icon: CalendarRange },
    ],
  },
  {
    labelAr: 'التقارير',
    items: [
      { slug: 'reports', labelAr: 'كشف مسيرات الرواتب', icon: FileSpreadsheet },
      { slug: 'payroll-salary-approvals', labelAr: 'كشف موافقة الموظفين', icon: UserCheck },
    ],
  },
];

/** العقود فقط — للهيدر. */
export const hrContractsOnlyNavGroups: HRContractsNavGroup[] = [
  {
    labelAr: 'العقود',
    items: [
      { slug: 'contract-templates', labelAr: 'قوالب العقود', icon: FileStack },
      { slug: 'employment', labelAr: 'عقود العمل', icon: FileSignature },
      { slug: 'articles', labelAr: 'مواد العقود', icon: BookOpen },
      { slug: 'allowance-types', labelAr: 'أنواع البدلات', icon: Coins },
    ],
  },
];

/** مصدر واحد للشريط الجانبي وتنقل الصفحة (مجمّع). */
export const hrContractsNavGroups: HRContractsNavGroup[] = [
  ...hrPayrollNavGroups,
  ...hrContractsOnlyNavGroups,
];

const PAYROLL_SLUGS = new Set(
  hrPayrollNavGroups.flatMap((g) => g.items.map((i) => i.slug)),
);

const CONTRACTS_ONLY_SLUGS = new Set(
  hrContractsOnlyNavGroups.flatMap((g) => g.items.map((i) => i.slug)),
);

/** مسارات فرعية تحت `/hr/contracts/period/…` تُعتبر ضمن الراتب. */
export function isHrPayrollNavPath(pathname: string): boolean {
  if (pathname.startsWith('/hr/contracts/period')) return true;
  const segment = pathname.replace(/^\/hr\/contracts\/?/, '').split('/')[0]?.split('?')[0];
  return segment != null && PAYROLL_SLUGS.has(segment);
}

export function isHrContractsOnlyNavPath(pathname: string): boolean {
  const segment = pathname.replace(/^\/hr\/contracts\/?/, '').split('/')[0]?.split('?')[0];
  return segment != null && CONTRACTS_ONLY_SLUGS.has(segment);
}
