import {
  EXTERNAL_PARTY_KIND_LABELS,
  type ExternalPartyKind,
} from '@/features/hr/organization/lib/directory/external-contacts-store';

export type ContactsKindFilter = 'all' | ExternalPartyKind;

export const CONTACT_KIND_FILTER_OPTIONS: { value: ContactsKindFilter; label: string }[] = [
  { value: 'all', label: 'كل الأنواع' },
  ...(Object.entries(EXTERNAL_PARTY_KIND_LABELS) as [ExternalPartyKind, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

export type ContactsDraftForm = {
  kind: ExternalPartyKind;
  nameAr: string;
  phone: string;
  email: string;
  organizationAr: string;
  notes: string;
};

export const CONTACTS_EMPTY_FORM: ContactsDraftForm = {
  kind: 'customer',
  nameAr: '',
  phone: '',
  email: '',
  organizationAr: '',
  notes: '',
};
