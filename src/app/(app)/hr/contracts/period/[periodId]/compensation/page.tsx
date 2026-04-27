'use client';

import { useParams } from 'next/navigation';
import { CompensationReportPanel } from '@/components/contracts/compensation-report-panel';

export default function CompensationPage() {
  const { periodId } = useParams<{ periodId: string }>();
  return <CompensationReportPanel periodId={periodId} />;
}
