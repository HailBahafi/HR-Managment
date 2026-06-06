import { Suspense } from 'react';
import { MonthlyInputsPage } from '@/features/hr/contracts/monthly-inputs/components/monthly-inputs-page';

export default function ContractsMonthlyInputsRoutePage() {
  return (
    <Suspense fallback={null}>
      <MonthlyInputsPage />
    </Suspense>
  );
}
