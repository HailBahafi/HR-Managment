import type { BranchResponseDto } from '@/features/hr/organization/lib/api/branches';

export type BranchRow = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  nameEn: string | null;
  city: string;
  district: string | null;
  address: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  latitude: string | null;
  longitude: string | null;
  manager: string;
  isHeadquarters: boolean;
  isActive: boolean;
  notes: string | null;
};

export type BranchDraftForm = {
  name: string;
  nameEn: string;
  city: string;
  district: string;
  address: string;
  postalCode: string;
  email: string;
  phone: string;
  mobile: string;
  managerName: string;
  isHeadquarters: boolean;
  isActive: boolean;
  notes: string;
};

export const BRANCH_EMPTY_FORM: BranchDraftForm = {
  name: '',
  nameEn: '',
  city: '',
  district: '',
  address: '',
  postalCode: '',
  email: '',
  phone: '',
  mobile: '',
  managerName: '',
  isHeadquarters: false,
  isActive: true,
  notes: '',
};

export function mapBranchResponse(branch: BranchResponseDto): BranchRow {
  return {
    id: branch.id,
    companyId: branch.companyId,
    code: branch.code,
    name: branch.nameAr,
    nameEn: branch.nameEn,
    city: branch.city ?? '',
    district: branch.district,
    address: branch.address,
    postalCode: branch.postalCode,
    email: branch.email,
    phone: branch.phone,
    mobile: branch.mobile,
    latitude: branch.latitude,
    longitude: branch.longitude,
    manager: branch.managerName ?? '',
    isHeadquarters: branch.isHeadquarters,
    isActive: branch.isActive,
    notes: branch.notes,
  };
}

export function branchRowToDraftForm(branch: BranchRow): BranchDraftForm {
  return {
    name: branch.name,
    nameEn: branch.nameEn ?? '',
    city: branch.city,
    district: branch.district ?? '',
    address: branch.address ?? '',
    postalCode: branch.postalCode ?? '',
    email: branch.email ?? '',
    phone: branch.phone ?? '',
    mobile: branch.mobile ?? '',
    managerName: branch.manager,
    isHeadquarters: branch.isHeadquarters,
    isActive: branch.isActive,
    notes: branch.notes ?? '',
  };
}

export function draftFormToCreatePayload(form: BranchDraftForm, companyId: string, code: string) {
  return {
    companyId,
    code,
    nameAr: form.name.trim(),
    nameEn: form.nameEn.trim() || null,
    city: form.city.trim() || null,
    district: form.district.trim() || null,
    address: form.address.trim() || null,
    postalCode: form.postalCode.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    mobile: form.mobile.trim() || null,
    managerName: form.managerName.trim() || null,
    isHeadquarters: form.isHeadquarters,
    isActive: form.isActive,
    notes: form.notes.trim() || null,
  };
}

export function draftFormToUpdatePayload(form: BranchDraftForm) {
  return {
    nameAr: form.name.trim(),
    nameEn: form.nameEn.trim() || null,
    city: form.city.trim() || null,
    district: form.district.trim() || null,
    address: form.address.trim() || null,
    postalCode: form.postalCode.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    mobile: form.mobile.trim() || null,
    managerName: form.managerName.trim() || null,
    isHeadquarters: form.isHeadquarters,
    isActive: form.isActive,
    notes: form.notes.trim() || null,
  };
}
