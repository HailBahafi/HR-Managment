'use client';

import { Suspense } from 'react';
import { JobCreatePage } from '@/features/hr/recruitment/ats/components/job-create-page';

export default function AtsJobCreatePage() {
  return (
    <Suspense fallback={null}>
      <JobCreatePage />
    </Suspense>
  );
}
