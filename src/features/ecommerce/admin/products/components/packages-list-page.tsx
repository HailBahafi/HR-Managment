'use client';

import { Boxes } from 'lucide-react';
import { PageHeader } from '@/components/layouts/page-header';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';

type PackageRow = {
  id: string;
  name: string;
  packagingType: string;
  containedQty: number;
  productName: string;
  status: 'available' | 'in_transit' | 'delivered';
};

const MOCK_ROWS: PackageRow[] = [
  {
    id: 'pkg-1',
    name: 'PKG-10045',
    packagingType: 'كرتون',
    containedQty: 24,
    productName: 'عصير برتقال 250مل',
    status: 'available',
  },
  {
    id: 'pkg-2',
    name: 'PKG-10088',
    packagingType: 'منصة',
    containedQty: 48,
    productName: 'مياه معدنية 330مل',
    status: 'in_transit',
  },
];

const STATUS_LABEL: Record<PackageRow['status'], string> = {
  available: 'متاح',
  in_transit: 'قيد النقل',
  delivered: 'تم التسليم',
};

export function PackagesListPage() {
  const columns: ColumnDef<PackageRow>[] = [
    {
      key: 'name',
      title: 'الطرود',
      render: (row) => (
        <span className="font-medium" dir="ltr">
          {row.name}
        </span>
      ),
    },
    {
      key: 'type',
      title: 'نوع التعبئة',
      render: (row) => row.packagingType,
    },
    {
      key: 'product',
      title: 'المنتج',
      render: (row) => row.productName,
    },
    {
      key: 'qty',
      title: 'الكمية المحتواة',
      render: (row) => <span dir="ltr">{row.containedQty}</span>,
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (row) => <Badge variant="subtle">{STATUS_LABEL[row.status]}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Boxes}
        title="الطرود"
        description="إدارة الطرود ووحدات التعبئة المرتبطة بالمنتجات والشحن."
      />
      <DataTable columns={columns} data={MOCK_ROWS} keyExtractor={(row) => row.id} emptyText="لا توجد طرود بعد." />
    </div>
  );
}
