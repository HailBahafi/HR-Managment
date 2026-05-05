/** Branding for HR letterhead PDFs — Rose Trading Est. */
export const ROSE_TRADING_EST = {
  nameAr: 'مؤسسة روز للتجارة',
  nameEn: 'ROSE TRADING EST',
  crNumber: '1010688907',
} as const;

/** Full Arabic+Latin string for UI only. In `@react-pdf`, split Arabic vs digits (see `CompanyLetterheadHeader`). */
export const ROSE_TRADING_CR_AR = `س.ت ${ROSE_TRADING_EST.crNumber}`;
