import { redirect } from 'next/navigation';

interface Props { params: Promise<{ periodId: string }> }

export default async function PeriodRootPage({ params }: Props) {
  const { periodId } = await params;
  redirect(`/hr/contracts/period/${encodeURIComponent(periodId)}/compensation`);
}
