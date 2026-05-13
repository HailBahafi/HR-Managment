import * as React from 'react';
import { ApplicantManagementClient } from '@/features/hr/recruitment/applicants/components/applicant-management-client';

export default function RecruitmentApplicantsPage() {
  return (
    <React.Suspense fallback={null}>
      <ApplicantManagementClient />
    </React.Suspense>
  );
}
