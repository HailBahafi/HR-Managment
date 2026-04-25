'use client';

import { ClipboardList } from 'lucide-react';
import { SetPageTitle } from '@/components/set-page-title';

export function HRRequestsPageTitle() {
  return (
    <SetPageTitle
      titleAr="إدارة الطلبات"
      descriptionAr="الطلبات العامة، الأنواع، القوالب، وسلاسل الموافقة"
      icon={ClipboardList}
    />
  );
}
