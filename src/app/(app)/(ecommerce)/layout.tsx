'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { SetPageTitle } from '@/components/layouts/set-page-title';

export default function EcommerceModuleLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('ecommerceAdmin.module');

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 animate-fade-in">
      <SetPageTitle titleAr={t('title')} descriptionAr={t('description')} iconName="ShoppingCart" />
      {children}
    </div>
  );
}
