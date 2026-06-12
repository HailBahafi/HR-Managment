import type { CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';

export type CompanyRow = CompanyResponseDto;

export type CompanyDraftForm = {
  code: string;
  nameAr: string;
  nameEn: string;
  email: string;
  phone: string;
  mobile: string;
  city: string;
  country: string;
  commercialRegistrationNo: string;
  taxNumber: string;
  website: string;
  address: string;
  district: string;
  postalCode: string;
  timezone: string;
  currencyCode: string;
  languageCode: string;
  isActive: boolean;
  notes: string;
};

export const COMPANY_EMPTY_FORM: CompanyDraftForm = {
  code: '',
  nameAr: '',
  nameEn: '',
  email: '',
  phone: '',
  mobile: '',
  city: '',
  country: 'SA',
  commercialRegistrationNo: '',
  taxNumber: '',
  website: '',
  address: '',
  district: '',
  postalCode: '',
  timezone: 'Asia/Riyadh',
  currencyCode: 'SAR',
  languageCode: 'ar',
  isActive: true,
  notes: '',
};

export function companyToDraftForm(company: CompanyRow): CompanyDraftForm {
  return {
    code: company.code,
    nameAr: company.nameAr,
    nameEn: company.nameEn ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
    mobile: company.mobile ?? '',
    city: company.city ?? '',
    country: company.country ?? 'SA',
    commercialRegistrationNo: company.commercialRegistrationNo ?? '',
    taxNumber: company.taxNumber ?? '',
    website: company.website ?? '',
    address: company.address ?? '',
    district: company.district ?? '',
    postalCode: company.postalCode ?? '',
    timezone: company.timezone,
    currencyCode: company.currencyCode,
    languageCode: company.languageCode,
    isActive: company.isActive,
    notes: company.notes ?? '',
  };
}
