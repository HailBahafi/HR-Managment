import type { AtsFormField } from '@/features/hr/recruitment/lib/ats/types';

/** Form fields that represent the applicant identity (filled fresh each application). */
export function isApplicantIdentityField(field: AtsFormField): boolean {
  if (field.type === 'file') return false;
  const label = field.label.trim();
  return (
    /اسم|name/i.test(label) ||
    /بريد|email/i.test(label) ||
    /جوال|هاتف|mobile|phone|tel/i.test(label) ||
    /هوية|identity|id\s*number/i.test(label)
  );
}

export function splitApplicantFormFields(fields: AtsFormField[]) {
  const identityFields = fields.filter(isApplicantIdentityField);
  const supplementalFields = fields.filter((f) => !isApplicantIdentityField(f));
  return { identityFields, supplementalFields };
}
