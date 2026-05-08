import { notFound } from 'next/navigation';
import * as React from 'react';
import { LeaveTypesPanel } from '@/features/hr/leaves/leave-types/components/leave-types-panel';
import { PublicHolidaysPanel } from '@/features/hr/leaves/public-holidays/components/public-holidays-panel';
import { LEAVE_APP_SECTION_SLUGS } from '@/features/hr/leaves/constants/leave-app-sections';

const SECTIONS: Record<
  string,
  { title: string; description: string; Component: React.ComponentType }
> = {
  'leave-types': {
    title: 'أنواع الإجازات',
    description: 'تعريف وإدارة أنواع الإجازات المتاحة في المنظمة.',
    Component: LeaveTypesPanel,
  },
  'public-holidays': {
    title: 'العطل الرسمية',
    description: 'إدارة قائمة العطل الرسمية السنوية.',
    Component: PublicHolidaysPanel,
  },
};

interface Props {
  params: Promise<{ section: string }>;
}

export default async function LeaveSectionPage({ params }: Props) {
  const { section } = await params;
  const def = SECTIONS[section];
  if (!def) notFound();
  const { Component } = def;
  return <Component />;
}

export function generateStaticParams() {
  return LEAVE_APP_SECTION_SLUGS.map((section) => ({ section }));
}
