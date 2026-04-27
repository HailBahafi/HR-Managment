import { Suspense } from 'react';
import { EmploymentContractsClient } from '@/components/contracts/employment-client';

export default function EmploymentContractsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-24 rounded-lg bg-muted/40" />
          <div className="h-12 rounded-full bg-muted/30" />
          <div className="h-96 rounded-lg bg-muted/30" />
        </div>
      }
    >
      <EmploymentContractsClient />
    </Suspense>
  );
}
