'use client';

import dynamic from 'next/dynamic';

const RequestsUnifiedManagementClient = dynamic(
  () => import('@/components/leaves/unified-management-client').then((m) => ({ default: m.UnifiedManagementClient })),
  { ssr: false, loading: () => <div className="py-24 text-center text-muted-foreground text-sm">جاري التحميل…</div> },
);

export default function RequestsUnifiedManagementPage() {
  return <RequestsUnifiedManagementClient />;
}
