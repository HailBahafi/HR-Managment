'use client';

import dynamic from 'next/dynamic';

const LeaveBalanceCreditClient = dynamic(
  () => import('@/components/leaves/leave-balance-credit-client').then((m) => ({ default: m.LeaveBalanceCreditClient })),
  { ssr: false, loading: () => <div className="py-24 text-center text-muted-foreground text-sm">جاري التحميل…</div> },
);

export default function LeaveBalanceCreditPage() {
  return <LeaveBalanceCreditClient />;
}
