'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, PackageMinus, PackagePlus } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useWarehouseOperations } from '@/features/ecommerce/admin/inventory/operations/hooks/use-warehouse-operations';
import { useWarehouses } from '@/features/ecommerce/admin/inventory/warehouses/hooks/use-warehouses';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import type { WarehouseOperationKind } from '@/features/ecommerce/domain/types/warehouse';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: WarehouseOperationKind;
  productId: string;
  productNameAr: string;
  onCreateRequest?: () => void;
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'مسودة',
  posted: 'مرحّل',
  cancelled: 'ملغى',
};

const KIND_META: Record<
  WarehouseOperationKind,
  { title: string; hint: string; createLabel: string; Icon: typeof PackagePlus }
> = {
  receipt: {
    title: 'إدخالات المنتج',
    hint: 'الاستلام',
    createLabel: 'طلب استلام جديد',
    Icon: PackagePlus,
  },
  issue: {
    title: 'إخراجات المنتج',
    hint: 'الصرف',
    createLabel: 'طلب صرف جديد',
    Icon: PackageMinus,
  },
  internal: {
    title: 'الحركات الداخلية',
    hint: 'الحركة الداخلية',
    createLabel: 'طلب داخلي جديد',
    Icon: ArrowLeftRight,
  },
};

export function ProductStockMovesListDialog({
  open,
  onOpenChange,
  kind,
  productId,
  productNameAr,
  onCreateRequest,
}: Props) {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const { data, isLoading } = useWarehouseOperations({
    companyId,
    productId,
    kind,
    limit: 100,
  });
  const { data: warehousesData } = useWarehouses({ companyId, limit: 100 });
  const warehouseName = React.useMemo(() => {
    const map = new Map((warehousesData?.items ?? []).map((item) => [item.id, item.nameAr]));
    return (id: string) => map.get(id) ?? id;
  }, [warehousesData?.items]);

  const items = data?.items ?? [];
  const meta = KIND_META[kind];
  const Icon = meta.Icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-2xl sm:max-w-2xl')}>
        <div className={dialogShellHeaderClass}>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Icon className="h-4 w-4 text-primary" />
            {meta.title}
          </DialogTitle>
        </div>

        <div className={cn(dialogShellBodyClass, 'space-y-3')}>
          <p className="text-xs text-muted-foreground">
            طلبات حركة {meta.hint} المرتبطة بـ «{productNameAr}».
          </p>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">جاري التحميل…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              لا توجد طلبات بعد لهذا المنتج.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((op) => {
                const qty = op.lines
                  .filter((line) => line.productId === productId)
                  .reduce((sum, line) => sum + line.quantity, 0);
                return (
                  <li
                    key={op.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground" dir="ltr">
                        {op.reference}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {warehouseName(op.warehouseId)} · الكمية: {qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={op.status === 'posted' ? 'success' : 'subtle'}>
                        {STATUS_LABEL[op.status] ?? op.status}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onOpenChange(false);
                          router.push(
                            `${ecommerceAdminRoutes.warehouseDetail(op.warehouseId)}?tab=${kind}`,
                          );
                        }}
                      >
                        فتح
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
          {onCreateRequest ? (
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onCreateRequest();
              }}
            >
              {meta.createLabel}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
