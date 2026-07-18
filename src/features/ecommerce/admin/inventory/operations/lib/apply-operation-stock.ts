import { locationStockApi } from '@/features/ecommerce/admin/orders/lib/api/location-stock';
import { productsApi } from '@/features/ecommerce/admin/products/lib/api/products';
import type { WarehouseOperation } from '@/features/ecommerce/domain/types/warehouse';

/** Apply a validated (done) warehouse operation to location stock, then sync product qty. */
export async function applyDoneOperationToStock(operation: WarehouseOperation): Promise<void> {
  const companyId = operation.companyId;
  const touchedProductIds = new Set<string>();

  for (const line of operation.lines) {
    if (!line.productId) continue;
    const qty = line.quantity;
    if (qty <= 0) continue;

    if (operation.kind === 'receipt') {
      if (!line.toLocationId) continue;
      await locationStockApi.adjust({
        companyId,
        productId: line.productId,
        variantId: line.variantId,
        warehouseId: operation.warehouseId,
        locationId: line.toLocationId,
        delta: qty,
      });
    } else if (operation.kind === 'issue') {
      if (!line.fromLocationId) continue;
      await locationStockApi.adjust({
        companyId,
        productId: line.productId,
        variantId: line.variantId,
        warehouseId: operation.warehouseId,
        locationId: line.fromLocationId,
        delta: -qty,
      });
    } else {
      if (!line.fromLocationId || !line.toLocationId) continue;
      await locationStockApi.adjust({
        companyId,
        productId: line.productId,
        variantId: line.variantId,
        warehouseId: operation.warehouseId,
        locationId: line.fromLocationId,
        delta: -qty,
      });
      await locationStockApi.adjust({
        companyId,
        productId: line.productId,
        variantId: line.variantId,
        warehouseId: operation.warehouseId,
        locationId: line.toLocationId,
        delta: qty,
      });
    }

    touchedProductIds.add(line.productId);
  }

  for (const productId of touchedProductIds) {
    await syncProductQuantityFromWarehouse(companyId, productId);
  }
}

/** Push warehouse on-hand totals into product.inventory (+ variant quantities). */
export async function syncProductQuantityFromWarehouse(
  companyId: string,
  productId: string,
): Promise<void> {
  const product = await productsApi.getById(companyId, productId);
  if (!product) return;

  const { total, byVariant } = await locationStockApi.getOnHandByVariant(companyId, productId);
  const variants = product.variants?.map((variant) => {
    const qty = byVariant[variant.id] ?? 0;
    return {
      ...variant,
      quantity: qty,
      stockStatus:
        qty > 0 ? ('in_stock' as const) : variant.stockStatus === 'preorder' ? variant.stockStatus : ('out_of_stock' as const),
    };
  });

  const hasVariants = Boolean(variants && variants.length > 0);
  const quantity = hasVariants
    ? (variants ?? []).reduce((sum, variant) => sum + variant.quantity, 0)
    : (byVariant[''] ?? total);

  await productsApi.update(companyId, productId, {
    inventory: {
      ...product.inventory,
      quantity,
    },
    ...(variants ? { variants } : {}),
    stockStatus:
      quantity > 0
        ? 'in_stock'
        : product.stockStatus === 'preorder' || product.stockStatus === 'discontinued'
          ? product.stockStatus
          : 'out_of_stock',
  });
}
