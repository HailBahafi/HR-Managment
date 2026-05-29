import type { LucideIcon } from 'lucide-react';
import {
  CalendarRange,
  FileSignature,
  BookOpen,
  FileSpreadsheet,
  UserCheck,
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

/** مصدر واحد لقائمة «الراتب والعقود» (الشريط الجانبي، الشريط العلوي، تنقل الصفحة). */
export const hrContractsNavGroups: HRContractsNavGroup[] = [
  {
    labelAr: 'الراتب',
    items: [
      { slug: 'payroll-periods', labelAr: 'فترات الراتب', icon: CalendarRange },
    ],
  },
  {
    labelAr: 'العقود',
    items: [
      { slug: 'employment', labelAr: 'عقود العمل', icon: FileSignature },
      { slug: 'articles', labelAr: 'مواد العقود', icon: BookOpen },
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
