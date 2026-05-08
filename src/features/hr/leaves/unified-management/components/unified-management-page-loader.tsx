'use client';

import dynamic from 'next/dynamic';

const UnifiedManagementClient = dynamic(
  () =>
    import('@/features/hr/leaves/unified-management/components/unified-management-client').then((m) => ({
      default: m.UnifiedManagementClient,
    })),
  { ssr: false, loading: () => <div className="py-24 text-center text-sm text-muted-foreground">جاري التحميل…</div> },
);

export function UnifiedManagementPageLoader() {
  return <UnifiedManagementClient />;
}
