'use client';

import dynamic from 'next/dynamic';

const LeaveBalanceCreditClient = dynamic(
  () =>
    import('@/features/hr/leaves/balance-credit/components/leave-balance-credit-client').then((m) => ({
      default: m.LeaveBalanceCreditClient,
    })),
  { ssr: false, loading: () => <div className="py-24 text-center text-sm text-muted-foreground">جاري التحميل…</div> },
);

export function LeaveBalanceCreditPageLoader() {
  return <LeaveBalanceCreditClient />;
}
