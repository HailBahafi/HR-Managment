/** Demo tenant from backend seed — see docs/recruitment-api-integration-notes.md */
export const RECRUITMENT_DEMO_TENANT_ID = 'a1000001-0001-4000-8000-000000000001';
export const RECRUITMENT_DEMO_TENANT_SLUG = 'demo-recruitment';

export function getConfiguredRecruitmentTenantId(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_RECRUITMENT_TENANT_ID?.trim();
  return fromEnv || null;
}

export function getPublicRecruitmentTenantSlug(): string {
  const fromEnv = process.env.NEXT_PUBLIC_RECRUITMENT_TENANT_SLUG?.trim();
  return fromEnv || RECRUITMENT_DEMO_TENANT_SLUG;
}
