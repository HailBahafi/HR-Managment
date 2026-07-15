'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Settings2, MapPinned } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCategories } from '@/features/ecommerce/admin/categories/hooks/use-categories';
import { useProducts } from '@/features/ecommerce/admin/products/hooks/use-products';
import {
  usePutawayLocationOptions,
  usePutawayRuleMutations,
  usePutawayRules,
} from '@/features/ecommerce/admin/inventory/putaway-rules/hooks/use-putaway-rules';
import { PACKAGING_TYPE_OPTIONS } from '@/features/ecommerce/admin/products/schemas/product-schema';
import type { PackagingType } from '@/features/ecommerce/domain/types/product';
import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { EntityFormRow } from '@/features/ecommerce/admin/shared/components/entity-form-row';
import { cn } from '@/shared/utils';

const NONE = '__none__';

type Draft = {
  arriveLocationId: string;
  productId: string;
  categoryId: string;
  packagingType: PackagingType | '';
  storeLocationId: string;
  subLocationId: string;
  storageCategory: string;
};

const EMPTY: Draft = {
  arriveLocationId: '',
  productId: '',
  categoryId: '',
  packagingType: '',
  storeLocationId: '',
  subLocationId: '',
  storageCategory: '',
};

export function PutawayRulesListPage() {
  const companyId = getStorefrontCompanyId();
  const searchParams = useSearchParams();
  const categoryIdFilter = searchParams.get('categoryId') ?? '';
  const productIdFilter = searchParams.get('productId') ?? '';
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>(() => ({
    ...EMPTY,
    categoryId: categoryIdFilter,
    productId: productIdFilter,
  }));

  React.useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      categoryId: categoryIdFilter || prev.categoryId,
      productId: productIdFilter || prev.productId,
    }));
  }, [categoryIdFilter, productIdFilter]);

  const { data, isLoading } = usePutawayRules({
    companyId,
    categoryId: categoryIdFilter || undefined,
    productId: productIdFilter || undefined,
    limit: 100,
  });
  const { data: locations = [] } = usePutawayLocationOptions(companyId);
  const { data: productsData } = useProducts({ companyId, limit: 200 });
  const { data: categoriesData } = useCategories({ companyId, limit: 200 });
  const { create, remove } = usePutawayRuleMutations(companyId);

  const products = productsData?.items ?? [];
  const categories = categoriesData?.items ?? [];

  const locationLabel = (id: string) => {
    const found = locations.find((item) => item.id === id);
    return found ? `${found.warehouseNameAr} / ${found.nameAr}` : '—';
  };

  const productLabel = (id?: string | null) =>
    id ? products.find((p) => p.id === id)?.nameAr ?? id : '—';
  const categoryLabel = (id?: string | null) =>
    id ? categories.find((c) => c.id === id)?.nameAr ?? id : '—';
  const packagingLabel = (value?: PackagingType | null) =>
    value ? PACKAGING_TYPE_OPTIONS.find((o) => o.value === value)?.labelAr ?? value : '—';

  const filtered = (data?.items ?? []).filter((rule) => {
    if (!search.trim()) return true;
    const hay = [
      productLabel(rule.productId),
      categoryLabel(rule.categoryId),
      locationLabel(rule.arriveLocationId),
      locationLabel(rule.storeLocationId),
      packagingLabel(rule.packagingType),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(search.trim().toLowerCase());
  });

  async function onCreate() {
    if (!draft.arriveLocationId || !draft.storeLocationId) return;
    if (!draft.productId && !draft.categoryId) return;
    const arrive = locations.find((item) => item.id === draft.arriveLocationId);
    if (!arrive) return;
    await create.mutateAsync({
      companyId,
      warehouseId: arrive.warehouseId,
      arriveLocationId: draft.arriveLocationId,
      productId: draft.productId || null,
      categoryId: draft.categoryId || null,
      packagingType: draft.packagingType || null,
      storeLocationId: draft.storeLocationId,
      subLocationId: draft.subLocationId || null,
      storageCategory: draft.storageCategory || undefined,
    });
    setDraft({
      ...EMPTY,
      categoryId: categoryIdFilter,
      productId: productIdFilter,
    });
    setOpen(false);
  }

  function openCreate() {
    setDraft({
      ...EMPTY,
      categoryId: categoryIdFilter,
      productId: productIdFilter,
    });
    setOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={MapPinned}
        title="قواعد التخزين"
        description="تهيئة مستقلة لمسار الوصول→التخزين. تُربط بالمنتج أو الفئة عند الحاجة."
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus className="me-1 h-4 w-4" />
            جديد
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="بحث…"
          className="max-w-md"
        />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Settings2 className="h-3.5 w-3.5" />
          {productIdFilter
            ? `مصفّى حسب المنتج: ${productLabel(productIdFilter)}`
            : categoryIdFilter
              ? `مصفّى حسب الفئة: ${categoryLabel(categoryIdFilter)}`
              : 'كل القواعد'}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-start font-medium">عندما يصل المنتج</th>
              <th className="px-3 py-2.5 text-start font-medium">المنتج</th>
              <th className="px-3 py-2.5 text-start font-medium">فئة المنتج</th>
              <th className="px-3 py-2.5 text-start font-medium">نوع الطرد</th>
              <th className="px-3 py-2.5 text-start font-medium">التخزين في</th>
              <th className="px-3 py-2.5 text-start font-medium">الموقع الفرعي</th>
              <th className="px-3 py-2.5 text-start font-medium">لديه فئة</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-muted-foreground">
                  جاري التحميل…
                </td>
              </tr>
            ) : null}
            {filtered.map((rule) => (
              <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2.5">{locationLabel(rule.arriveLocationId)}</td>
                <td className="px-3 py-2.5">{productLabel(rule.productId)}</td>
                <td className="px-3 py-2.5">{categoryLabel(rule.categoryId)}</td>
                <td className="px-3 py-2.5">{packagingLabel(rule.packagingType)}</td>
                <td className="px-3 py-2.5">{locationLabel(rule.storeLocationId)}</td>
                <td className="px-3 py-2.5">
                  {rule.subLocationId ? locationLabel(rule.subLocationId) : '—'}
                </td>
                <td className="px-3 py-2.5">{rule.storageCategory || '—'}</td>
                <td className="px-3 py-2.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => void remove.mutateAsync(rule.id)}
                  >
                    حذف
                  </Button>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">
                  لا توجد قواعد تخزين بعد.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn(dialogShellContentClass, 'max-w-xl sm:max-w-xl')}>
          <div className={dialogShellHeaderClass}>
            <DialogTitle className="text-base font-semibold">قاعدة تخزين جديدة</DialogTitle>
          </div>
          <div className={cn(dialogShellBodyClass, 'space-y-1')}>
            <EntityFormRow label="عندما يصل المنتج">
              <Select
                value={draft.arriveLocationId || undefined}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, arriveLocationId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموقع" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.warehouseNameAr} / {loc.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EntityFormRow>
            <EntityFormRow label="المنتج">
              <Select
                value={draft.productId || NONE}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, productId: value === NONE ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختياري إن وُجدت فئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>بدون منتج محدد</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EntityFormRow>
            <EntityFormRow label="فئة المنتج">
              <Select
                value={draft.categoryId || NONE}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, categoryId: value === NONE ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختياري إن وُجد منتج" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>بدون فئة</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EntityFormRow>
            <EntityFormRow label="نوع الطرد">
              <Select
                value={draft.packagingType || NONE}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    packagingType: value === NONE ? '' : (value as PackagingType),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>الكل</SelectItem>
                  {PACKAGING_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EntityFormRow>
            <EntityFormRow label="التخزين في">
              <Select
                value={draft.storeLocationId || undefined}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, storeLocationId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموقع" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.warehouseNameAr} / {loc.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EntityFormRow>
            <EntityFormRow label="الموقع الفرعي">
              <Select
                value={draft.subLocationId || NONE}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, subLocationId: value === NONE ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختياري" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>بدون</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EntityFormRow>
            <EntityFormRow label="فئة التخزين">
              <Input
                value={draft.storageCategory}
                onChange={(event) => setDraft((prev) => ({ ...prev, storageCategory: event.target.value }))}
              />
            </EntityFormRow>
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
            <Button
              type="button"
              disabled={
                create.isPending ||
                !draft.arriveLocationId ||
                !draft.storeLocationId ||
                (!draft.productId && !draft.categoryId)
              }
              onClick={() => void onCreate()}
            >
              حفظ
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
