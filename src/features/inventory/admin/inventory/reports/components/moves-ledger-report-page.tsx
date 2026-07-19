'use client';

import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useWarehouseOperations } from '@/features/ecommerce/admin/inventory/operations/hooks/use-warehouse-operations';
import { useWarehouseLocations } from '@/features/ecommerce/admin/inventory/locations/hooks/use-warehouse-locations';
import { useWarehouses } from '@/features/ecommerce/admin/inventory/warehouses/hooks/use-warehouses';
import { WarehouseOperationDetailDialog } from '@/features/ecommerce/admin/inventory/operations/components/warehouse-operation-detail-dialog';
import {
  flattenOperationsToMoveRows,
  type StockMoveLedgerRow,
} from '@/features/ecommerce/admin/inventory/reports/lib/report-moves';
import {
  WAREHOUSE_OPERATION_KINDS,
  WAREHOUSE_OPERATION_KIND_META,
} from '@/features/ecommerce/domain/constants/warehouse-operation-kinds';
import { WAREHOUSE_OPERATION_STATUS_LABELS_AR } from '@/features/ecommerce/domain/constants/warehouse-operation-status';
import type {
  WarehouseOperation,
  WarehouseOperationKind,
  WarehouseOperationStatus,
} from '@/features/ecommerce/domain/types/warehouse';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function statusBadgeVariant(
  status: WarehouseOperationStatus,
): 'subtle' | 'warning' | 'success' | 'destructive' {
  if (status === 'ready') return 'warning';
  if (status === 'done') return 'success';
  if (status === 'cancelled') return 'destructive';
  return 'subtle';
}

export function MovesLedgerReportPage() {
  const companyId = getStorefrontCompanyId();
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [warehouseId, setWarehouseId] = React.useState('all');
  const [kind, setKind] = React.useState<'all' | WarehouseOperationKind>('all');
  const [status, setStatus] = React.useState<'all' | WarehouseOperationStatus>('done');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [selectedOp, setSelectedOp] = React.useState<WarehouseOperation | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useWarehouseOperations({
    companyId,
    all: true,
    warehouseId: warehouseId === 'all' ? undefined : warehouseId,
    kind: kind === 'all' ? undefined : kind,
    status: status === 'all' ? undefined : status,
    page: 1,
    limit: 500,
  });
  const { data: warehousesData } = useWarehouses({ companyId, limit: 100 });
  const { data: locationsData } = useWarehouseLocations({ companyId, limit: 500 });

  const warehouses = warehousesData?.items ?? [];
  const locations = locationsData?.items ?? [];
  const warehouseName = React.useMemo(
    () => new Map(warehouses.map((item) => [item.id, item.nameAr])),
    [warehouses],
  );
  const locationName = React.useMemo(() => {
    const map = new Map(locations.map((item) => [item.id, item.nameAr || item.code]));
    return (id?: string) => (id ? (map.get(id) ?? '') : '');
  }, [locations]);

  const rows = React.useMemo(
    () => flattenOperationsToMoveRows(data?.items ?? [], locations, locationName),
    [data?.items, locations, locationName],
  );

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((row) => {
      if (dateFrom && row.occurredAt.slice(0, 10) < dateFrom) return false;
      if (dateTo && row.occurredAt.slice(0, 10) > dateTo) return false;
      if (!q) return true;
      return (
        row.reference.toLowerCase().includes(q) ||
        row.productName.toLowerCase().includes(q) ||
        (row.sku?.toLowerCase().includes(q) ?? false) ||
        row.fromLabel.toLowerCase().includes(q) ||
        row.toLabel.toLowerCase().includes(q)
      );
    });
  }, [rows, search, dateFrom, dateTo]);

  const columns: ColumnDef<StockMoveLedgerRow>[] = [
    {
      key: 'date',
      title: 'التاريخ',
      render: (row) => (
        <span className="text-sm whitespace-nowrap">
          {new Date(row.occurredAt).toLocaleString('ar-SA')}
        </span>
      ),
    },
    {
      key: 'reference',
      title: 'المرجع',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium" dir="ltr">
            {row.reference}
          </span>
          <span className="text-xs text-muted-foreground">
            {WAREHOUSE_OPERATION_KIND_META[row.kind].labelAr}
          </span>
        </div>
      ),
    },
    {
      key: 'warehouse',
      title: 'المستودع',
      render: (row) => <span className="text-sm">{warehouseName.get(row.warehouseId) ?? '—'}</span>,
    },
    {
      key: 'product',
      title: 'المنتج',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.productName}</span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {row.sku || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'route',
      title: 'من → إلى',
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.fromLabel} ← {row.toLabel}
        </span>
      ),
    },
    {
      key: 'qty',
      title: 'الكمية',
      render: (row) => (
        <span className="font-semibold tabular-nums" dir="ltr">
          {row.quantity}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (row) => (
        <Badge variant={statusBadgeVariant(row.status)}>
          {WAREHOUSE_OPERATION_STATUS_LABELS_AR[row.status]}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr="سجل الحركات" iconName="FileText" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">سجل الحركات</h1>
        <p className="text-sm text-muted-foreground">
          دفتر حركات المخزون على مستوى البنود — من مستندات العمليات المُنفَّذة والمسودات.
        </p>
      </div>

      <ListToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="ابحث بالمرجع أو المنتج…"
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger className="h-10 w-[150px]" aria-label="المستودع">
                <SelectValue placeholder="المستودع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المستودعات</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={kind}
              onValueChange={(value) => setKind(value as typeof kind)}
            >
              <SelectTrigger className="h-10 w-[150px]" aria-label="نوع الحركة">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {WAREHOUSE_OPERATION_KINDS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {WAREHOUSE_OPERATION_KIND_META[item].labelAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as typeof status)}
            >
              <SelectTrigger className="h-10 w-[130px]" aria-label="الحالة">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {(Object.keys(WAREHOUSE_OPERATION_STATUS_LABELS_AR) as WarehouseOperationStatus[]).map(
                  (item) => (
                    <SelectItem key={item} value={item}>
                      {WAREHOUSE_OPERATION_STATUS_LABELS_AR[item]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="h-10 w-[140px]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="من تاريخ"
            />
            <Input
              type="date"
              className="h-10 w-[140px]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="إلى تاريخ"
            />
          </div>
        }
      />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل سجل الحركات.</p> : null}

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.key}
        loading={isLoading}
        emptyText="لا توجد حركات مطابقة."
        onRowClick={(row) => setSelectedOp(row.operation)}
      />

      <WarehouseOperationDetailDialog
        open={Boolean(selectedOp)}
        onOpenChange={(open) => {
          if (!open) setSelectedOp(null);
        }}
        operation={selectedOp}
      />
    </div>
  );
}
