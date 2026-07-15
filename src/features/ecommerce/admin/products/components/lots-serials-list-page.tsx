'use client';

import { Hash } from 'lucide-react';
import { PageHeader } from '@/components/layouts/page-header';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';

type LotSerialRow = {
  id: string;
  name: string;
  productName: string;
  kind: 'lot' | 'serial';
  quantity: number;
  warehouseName: string;
};

const MOCK_ROWS: LotSerialRow[] = [
  {
    id: 'lot-1',
    name: 'LOT-2026-001',
    productName: 'حليب طازج 1 لتر',
    kind: 'lot',
    quantity: 120,
    warehouseName: 'المستودع الرئيسي',
  },
  {
    id: 'ser-1',
    name: 'SN-88421',
    productName: 'جهاز قياس حرارة',
    kind: 'serial',
    quantity: 1,
    warehouseName: 'المستودع الرئيسي',
  },
];

export function LotsSerialsListPage() {
  const columns: ColumnDef<LotSerialRow>[] = [
    {
      key: 'name',
      title: 'الرقم',
      render: (row) => (
        <span className="font-medium" dir="ltr">
          {row.name}
        </span>
      ),
    },
    {
      key: 'kind',
      title: 'النوع',
      render: (row) => (
        <Badge variant="subtle">{row.kind === 'lot' ? 'رقم مجموعة' : 'رقم تسلسلي'}</Badge>
      ),
    },
    {
      key: 'product',
      title: 'المنتج',
      render: (row) => row.productName,
    },
    {
      key: 'qty',
      title: 'الكمية',
      render: (row) => <span dir="ltr">{row.quantity}</span>,
    },
    {
      key: 'warehouse',
      title: 'المستودع',
      render: (row) => row.warehouseName,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Hash}
        title="أرقام المجموعات / الأرقام التسلسلية"
        description="تتبع الدفعات والأرقام التسلسلية للمنتجات التي تستخدم التتبع."
      />
      <DataTable columns={columns} data={MOCK_ROWS} keyExtractor={(row) => row.id} emptyText="لا توجد أرقام بعد." />
    </div>
  );
}
