import { AtsPublicApplicationClient } from '@/features/hr/recruitment/shared/ats-public-application-client';

export default async function PublicJobPage({ params }: { params: Promise<{ jobSlug: string }> }) {
  const { jobSlug } = await params;
  return <AtsPublicApplicationClient jobSlug={jobSlug} />;
}
