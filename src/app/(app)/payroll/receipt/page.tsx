'use client';

import dynamic from 'next/dynamic';

const ReceiptClient = dynamic(
  () => import('./receipt-client').then(m => m.ReceiptClient),
  { ssr: false },
);

export default function SalaryReceiptPage() {
  return <ReceiptClient />;
}
