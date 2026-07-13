'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useOrders } from '@/features/ecommerce/admin/orders/hooks/use-orders';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import { PageHeader } from '@/components/layouts/page-header';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { DataTable, AppPagination, type ColumnDef } from '@/components/ui/data-table';
import { DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const ALL_STATUS = '__all__';

const ORDER_STATUS_LABELS_AR: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
  refunded: 'مسترد',
};

const ORDER_STATUS_VARIANT: Record<OrderStatus, NonNullable<BadgeProps['variant']>> = {
  pending: 'subtle',
  confirmed: 'outline',
  processing: 'warning',
  shipped: 'gold',
  delivered: 'success',
  cancelled: 'destructive',
  refunded: 'destructive',
};

export function OrdersListPage() {
  const companyId = useAuthStore((s) => s.activeCompanyId) ?? '';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const status = (searchParams.get('status') as OrderStatus | null) ?? undefined;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;

  const [searchInput, setSearchInput] = React.useState(search);

  function updateParams(next: { q?: string; status?: string; page?: number; pageSize?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q) params.set('q', next.q);
      else params.delete('q');
    }
    if (next.status !== undefined) {
      if (next.status) params.set('status', next.status);
      else params.delete('status');
    }
    if (next.page !== undefined) {
      if (next.page > 1) params.set('page', String(next.page));
      else params.delete('page');
    }
    if (next.pageSize !== undefined) {
      if (next.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(next.pageSize));
      else params.delete('pageSize');
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const searchRef = React.useRef(search);
  const updateParamsRef = React.useRef(updateParams);
  searchRef.current = search;
  updateParamsRef.current = updateParams;

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput.trim() !== searchRef.current) {
        updateParamsRef.current({ q: searchInput.trim(), page: 1 });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError } = useOrders({ companyId, search: search || undefined, status, page, limit: pageSize });

  const columns: ColumnDef<Order>[] = [
    {
      key: 'order',
      title: 'الطلب',
      render: (order) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground" dir="ltr">{order.orderNumber}</span>
          <span className="text-xs text-muted-foreground">{order.customerNameAr}</span>
        </div>
      ),
    },
    {
      key: 'items',
      title: 'العناصر',
      render: (order) => <span className="tabular-nums text-muted-foreground">{order.items.length}</span>,
    },
    {
      key: 'total',
      title: 'الإجمالي',
      render: (order) => <span className="font-medium tabular-nums">{formatPrice(order.totalAmount)}</span>,
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (order) => <Badge variant={ORDER_STATUS_VARIANT[order.status]}>{ORDER_STATUS_LABELS_AR[order.status]}</Badge>,
    },
    {
      key: 'createdAt',
      title: 'التاريخ',
      render: (order) => (
        <span className="text-sm text-muted-foreground" dir="ltr">
          {new Date(order.createdAt).toLocaleDateString('ar-SA')}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader icon={ShoppingCart} title="الطلبات" description="تتبع طلبات العملاء وحالة الشحن." />

      <ListToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="ابحث برقم الطلب أو اسم العميل…"
        filters={
          <Select
            value={status ?? ALL_STATUS}
            onValueChange={(next) => updateParams({ status: next === ALL_STATUS ? '' : next, page: 1 })}
          >
            <SelectTrigger aria-label="الحالة" className="w-full sm:w-auto">
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUS}>كل الحالات</SelectItem>
              {Object.entries(ORDER_STATUS_LABELS_AR).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل الطلبات.</p> : null}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(order) => order.id}
        loading={isLoading}
        emptyText="لا توجد طلبات بعد."
      />

      {data ? (
        <AppPagination
          page={page}
          pageSize={pageSize}
          total={data.pagination.total}
          onPageChange={(nextPage) => updateParams({ page: nextPage })}
          onPageSizeChange={(size) => updateParams({ pageSize: size, page: 1 })}
        />
      ) : null}
    </div>
  );
}
