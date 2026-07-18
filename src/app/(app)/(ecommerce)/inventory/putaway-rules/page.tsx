import * as React from 'react';
import { PutawayRulesListPage } from '@/features/ecommerce/admin/inventory/putaway-rules/components/putaway-rules-list-page';

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <PutawayRulesListPage />
    </React.Suspense>
  );
}
