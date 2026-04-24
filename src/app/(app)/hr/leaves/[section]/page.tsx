import { notFound } from 'next/navigation';
import { LeaveTypesPanel } from '@/components/leaves/leave-types-panel';
import { PublicHolidaysPanel } from '@/components/leaves/public-holidays-panel';

const SECTIONS: Record<string, { title: string; description: string; Component: React.ComponentType }> = {
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

import * as React from 'react';

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
  return Object.keys(SECTIONS).map((section) => ({ section }));
}
