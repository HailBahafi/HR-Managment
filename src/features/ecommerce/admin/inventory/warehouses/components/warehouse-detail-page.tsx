'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, MapPin, PackageMinus, PackagePlus, RefreshCw, Warehouse } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useWarehouse } from '@/features/ecommerce/admin/inventory/warehouses/hooks/use-warehouses';
import { WarehouseLocationsPanel } from '@/features/ecommerce/admin/inventory/locations/components/warehouse-locations-panel';
import { WarehouseOperationsPanel } from '@/features/ecommerce/admin/inventory/operations/components/warehouse-operations-panel';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import type { WarehouseOperationKind } from '@/features/ecommerce/domain/types/warehouse';
import { PageHeader } from '@/components/layouts/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';

type WarehouseTab = 'locations' | WarehouseOperationKind;

const TABS: { id: WarehouseTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'locations', label: 'المواقع', icon: MapPin },
  { id: 'issue', label: 'صرف', icon: PackageMinus },
  { id: 'receipt', label: 'استلام', icon: PackagePlus },
  { id: 'internal', label: 'حركات داخلية', icon: RefreshCw },
];

function isWarehouseTab(value: string | null): value is WarehouseTab {
  return value === 'locations' || value === 'issue' || value === 'receipt' || value === 'internal';
}

export function WarehouseDetailPage() {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const params = useParams<{ warehouseId: string }>();
  const searchParams = useSearchParams();
  const warehouseId = params.warehouseId;

  const tabParam = searchParams.get('tab');
  const activeTab: WarehouseTab = isWarehouseTab(tabParam) ? tabParam : 'locations';

  const { data: warehouse, isLoading, isError } = useWarehouse(companyId, warehouseId);

  const setTab = (tab: WarehouseTab) => {
    const href =
      tab === 'locations'
        ? ecommerceAdminRoutes.warehouseDetail(warehouseId)
        : `${ecommerceAdminRoutes.warehouseDetail(warehouseId)}?tab=${tab}`;
    router.replace(href, { scroll: false });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">جاري تحميل المستودع…</p>;
  }

  if (isError || !warehouse) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-destructive">تعذر العثور على المستودع.</p>
        <Button variant="outline" onClick={() => router.push(ecommerceAdminRoutes.warehouses)}>
          العودة للمخازن
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Warehouse}
        title={warehouse.nameAr}
        description={warehouse.description || warehouse.address || 'إدارة مواقع وعمليات هذا المستودع.'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={warehouse.status === 'active' ? 'success' : 'subtle'}>
              {warehouse.status === 'active' ? 'نشط' : 'غير نشط'}
            </Badge>
            <Button variant="outline" onClick={() => router.push(ecommerceAdminRoutes.warehouses)}>
              <ArrowRight className="h-4 w-4" />
              كل المستودعات
            </Button>
          </div>
        }
      />

      <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-soft">
        <span className="font-medium text-foreground" dir="ltr">
          {warehouse.code}
        </span>
        {warehouse.address ? <span className="mx-2">·</span> : null}
        {warehouse.address}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-t-lg px-3.5 py-2.5 text-sm transition-colors',
                selected
                  ? 'border-b-2 border-primary font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'locations' ? <WarehouseLocationsPanel warehouseId={warehouseId} /> : null}
      {activeTab === 'issue' ? <WarehouseOperationsPanel warehouseId={warehouseId} kind="issue" /> : null}
      {activeTab === 'receipt' ? <WarehouseOperationsPanel warehouseId={warehouseId} kind="receipt" /> : null}
      {activeTab === 'internal' ? <WarehouseOperationsPanel warehouseId={warehouseId} kind="internal" /> : null}
    </div>
  );
}
