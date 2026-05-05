'use client';

import { CompanyLetterheadHeader } from '@/components/pdf/company-letterhead-header';

export type PdfHrBrandHeaderProps = {
  /** Kept for call-site compatibility; letterhead uses fixed Rose Trading Est branding. */
  companyNameAr: string;
  companyNameEn: string;
  logoSrc?: string;
};

export function PdfHrBrandHeader({ companyNameAr: _ar, companyNameEn: _en, logoSrc }: PdfHrBrandHeaderProps) {
  return <CompanyLetterheadHeader logoSrc={logoSrc} />;
}
