'use client';

import * as React from 'react';
import { useSetPageTitle } from '@/components/page-title-context';
import { DepartmentsTab } from '@/components/hr-requests/departments-tab';

export default function HRDepartmentsPage() {
  useSetPageTitle({ titleAr: 'الأقسام', descriptionAr: 'الهيكل التنظيمي وإدارة الأقسام', iconName: 'Building2' });
  return <DepartmentsTab />;
}
