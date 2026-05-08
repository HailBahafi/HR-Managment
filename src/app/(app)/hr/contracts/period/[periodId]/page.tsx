import { redirect } from 'next/navigation';
import { hrContractsPeriodCompensationHref } from '@/features/hr/contracts/constants/routes';

interface Props { params: Promise<{ periodId: string }> }

export default async function PeriodRootPage({ params }: Props) {
  const { periodId } = await params;
  redirect(hrContractsPeriodCompensationHref(periodId));
}
