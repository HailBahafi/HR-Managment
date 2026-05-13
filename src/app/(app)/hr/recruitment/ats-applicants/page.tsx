'use client';

import { Suspense } from 'react';
import { ApplicantsListClient } from '@/features/hr/recruitment/ats/components/applicants-list-client';

export default function AtsApplicantsPage() {
  return (
    <Suspense fallback={null}>
      <ApplicantsListClient />
    </Suspense>
  );
}
