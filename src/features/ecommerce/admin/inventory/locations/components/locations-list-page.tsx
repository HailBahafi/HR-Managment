'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Pencil, Plus, Trash2, Warehouse } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useWarehouses } from '@/features/ecommerce/admin/inventory/warehouses/hooks/use-warehouses';
import { useWarehouseLocations } from '@/features/ecommerce/admin/inventory/locations/hooks/use-warehouse-locations';
import { useWarehouseLocationMutations } from '@/features/ecommerce/admin/inventory/locations/hooks/use-warehouse-location-mutations';
import {
  LOCATION_TYPE_OPTIONS,
  REMOVAL_STRATEGY_OPTIONS,
  WAREHOUSE_LOCATION_FORM_DEFAULT_VALUES,
  warehouseLocationFormSchema,
  type WarehouseLocationFormValues,
} from '@/features/ecommerce/admin/inventory/schemas/warehouse-schemas';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import type { WarehouseLocation } from '@/features/ecommerce/domain/types/warehouse';
import { PageHeader } from '@/components/layouts/page-header';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogMaxHeightClass,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL_WAREHOUSES = '__all__';
const NO_PARENT = '__none__';

const TYPE_LABEL: Record<string, string> = {
  internal: 'داخلي',
  view: 'عرض',
  supplier: 'مورد',
  customer: 'عميل',
  inventory: 'جرد',
};

function toFormValues(location: WarehouseLocation): WarehouseLocationFormValues {
  return {
    nameAr: location.nameAr,
    parentLocationId: location.parentLocationId ?? '',
    locationType: location.locationType ?? 'internal',
    storageCategory: location.storageCategory ?? '',
    barcode: location.barcode ?? '',
    replenish: location.replenish ?? false,
    cycleCountFrequencyDays: location.cycleCountFrequencyDays ?? 0,
    lastCountAt: location.lastCountAt ? location.lastCountAt.slice(0, 10) : '',
    nextCountAt: location.nextCountAt ? location.nextCountAt.slice(0, 10) : '',
    removalStrategy: location.removalStrategy ?? 'fifo',
    isActive: location.isActive,
  };
}

export function LocationsListPage() {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const warehouseIdFilter = searchParams.get('warehouseId') ?? '';
  const search = searchParams.get('q') ?? '';

  const [searchInput, setSearchInput] = React.useState(search);
  const [formWarehouseId, setFormWarehouseId] = React.useState(warehouseIdFilter);
  const [formState, setFormState] = React.useState<{ open: boolean; location: WarehouseLocation | null }>({
    open: false,
    location: null,
  });
  const [toDelete, setToDelete] = React.useState<WarehouseLocation | null>(null);

  function updateParams(next: { q?: string; warehouseId?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q) params.set('q', next.q);
      else params.delete('q');
    }
    if (next.warehouseId !== undefined) {
      if (next.warehouseId) params.set('warehouseId', next.warehouseId);
      else params.delete('warehouseId');
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput.trim() !== search) {
        updateParams({ q: searchInput.trim() });
      }
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL sync debounce
  }, [searchInput]);

  const { data: warehousesData } = useWarehouses({ companyId, limit: 200 });
  const warehouses = warehousesData?.items ?? [];
  const warehouseNameById = React.useMemo(
    () => new Map(warehouses.map((warehouse) => [warehouse.id, warehouse.nameAr])),
    [warehouses],
  );

  const { data, isLoading, isError } = useWarehouseLocations({
    companyId,
    warehouseId: warehouseIdFilter || undefined,
    search: search || undefined,
    page: 1,
    limit: 200,
  });
  const { create, update, remove } = useWarehouseLocationMutations();
  const locations = data?.items ?? [];

  const parentOptions = locations.filter(
    (location) =>
      location.id !== formState.location?.id &&
      (!formWarehouseId || location.warehouseId === formWarehouseId),
  );
  const nameById = React.useMemo(
    () => new Map(locations.map((location) => [location.id, location.nameAr])),
    [locations],
  );

  const form = useForm<WarehouseLocationFormValues>({
    resolver: zodResolver(warehouseLocationFormSchema),
    defaultValues: WAREHOUSE_LOCATION_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (!formState.open) return;
    form.reset(formState.location ? toFormValues(formState.location) : WAREHOUSE_LOCATION_FORM_DEFAULT_VALUES);
    setFormWarehouseId(formState.location?.warehouseId ?? warehouseIdFilter);
  }, [formState, form, warehouseIdFilter]);

  const isSaving = create.isPending || update.isPending;
  const selectedWarehouseName = warehouseIdFilter
    ? warehouseNameById.get(warehouseIdFilter)
    : undefined;

  const onSubmit = async (values: WarehouseLocationFormValues) => {
    if (!companyId) return;
    const targetWarehouseId = formState.location?.warehouseId || formWarehouseId;
    if (!targetWarehouseId) return;

    const code =
      formState.location?.code ??
      values.nameAr
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 32);

    const payload = {
      companyId,
      warehouseId: targetWarehouseId,
      code,
      nameAr: values.nameAr.trim(),
      parentLocationId: values.parentLocationId || null,
      locationType: values.locationType,
      storageCategory: values.storageCategory?.trim() || undefined,
      barcode: values.barcode?.trim() || undefined,
      replenish: values.replenish,
      cycleCountFrequencyDays: values.cycleCountFrequencyDays,
      lastCountAt: values.lastCountAt ? new Date(values.lastCountAt).toISOString() : undefined,
      nextCountAt: values.nextCountAt ? new Date(values.nextCountAt).toISOString() : undefined,
      removalStrategy: values.removalStrategy,
      isActive: values.isActive,
      isSystem: formState.location?.isSystem ?? false,
    };

    if (formState.location) {
      await update.mutateAsync({ companyId, id: formState.location.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    setFormState({ open: false, location: null });
  };

  const columns: ColumnDef<WarehouseLocation>[] = [
    {
      key: 'location',
      title: 'الموقع',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.nameAr}</span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {row.code}
          </span>
        </div>
      ),
    },
    {
      key: 'warehouse',
      title: 'المستودع',
      render: (row) => (
        <button
          type="button"
          className="text-sm text-primary hover:underline"
          onClick={() => router.push(ecommerceAdminRoutes.warehouseDetail(row.warehouseId))}
        >
          {warehouseNameById.get(row.warehouseId) ?? row.warehouseId}
        </button>
      ),
    },
    {
      key: 'parent',
      title: 'الموقع الرئيسي',
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.parentLocationId ? (nameById.get(row.parentLocationId) ?? '—') : '—'}
        </span>
      ),
    },
    {
      key: 'type',
      title: 'النوع',
      render: (row) => <Badge variant="subtle">{TYPE_LABEL[row.locationType] ?? 'داخلي'}</Badge>,
    },
    {
      key: 'system',
      title: '',
      render: (row) => (row.isSystem ? <Badge variant="outline">تلقائي</Badge> : null),
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      render: (row) => (
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label="تعديل الموقع"
            onClick={() => setFormState({ open: true, location: row })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="حذف الموقع"
            disabled={Boolean(row.isSystem)}
            onClick={() => setToDelete(row)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={MapPin}
        title="المواقع"
        description={
          selectedWarehouseName
            ? `مواقع مستودع «${selectedWarehouseName}». يمكنك إزالة الفلتر لعرض كل المواقع.`
            : 'إدارة مواقع التخزين لجميع المستودعات — صفِّ حسب المستودع أو افتح المستودع من العمود.'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {warehouseIdFilter ? (
              <Button
                variant="outline"
                onClick={() => router.push(ecommerceAdminRoutes.warehouseDetail(warehouseIdFilter))}
              >
                <Warehouse className="h-4 w-4" />
                فتح المستودع
              </Button>
            ) : (
              <Button variant="outline" onClick={() => router.push(ecommerceAdminRoutes.warehouses)}>
                <Warehouse className="h-4 w-4" />
                المستودعات
              </Button>
            )}
            <Button
              onClick={() => setFormState({ open: true, location: null })}
              disabled={!companyId || (warehouses.length === 0 && !warehouseIdFilter)}
            >
              <Plus className="h-4 w-4" />
              إضافة موقع
            </Button>
          </div>
        }
      />

      <ListToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="ابحث في المواقع…"
        filters={
          <Select
            value={warehouseIdFilter || ALL_WAREHOUSES}
            onValueChange={(value) => updateParams({ warehouseId: value === ALL_WAREHOUSES ? '' : value })}
          >
            <SelectTrigger aria-label="تصفية بالمستودع" className="w-full sm:w-56">
              <SelectValue placeholder="كل المستودعات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_WAREHOUSES}>كل المستودعات</SelectItem>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل المواقع.</p> : null}

      <DataTable
        columns={columns}
        data={locations}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        emptyText={
          warehouseIdFilter ? 'لا توجد مواقع لهذا المستودع بعد.' : 'لا توجد مواقع بعد. أضف موقعًا أو أنشئ مستودعًا.'
        }
      />

      <Dialog
        open={formState.open}
        onOpenChange={(open) => setFormState((s) => ({ ...s, open, location: open ? s.location : null }))}
      >
        <DialogContent className={`${dialogMaxHeightClass} max-w-lg overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{formState.location ? 'تعديل الموقع' : 'إضافة موقع'}</DialogTitle>
            <DialogDescription>اختر المستودع ثم عرّف الموقع وخيارات التخزين.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="loc-warehouse">المستودع</Label>
              <Select
                value={formWarehouseId || undefined}
                onValueChange={setFormWarehouseId}
                disabled={Boolean(formState.location)}
              >
                <SelectTrigger id="loc-warehouse" aria-label="المستودع">
                  <SelectValue placeholder="اختر المستودع" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="loc-name">اسم الموقع</Label>
              <Input id="loc-name" placeholder="مثال: رف 1" {...form.register('nameAr')} />
              {form.formState.errors.nameAr ? (
                <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="loc-parent">الموقع الرئيسي</Label>
              <Controller
                control={form.control}
                name="parentLocationId"
                render={({ field }) => (
                  <Select
                    value={field.value || NO_PARENT}
                    onValueChange={(value) => field.onChange(value === NO_PARENT ? '' : value)}
                  >
                    <SelectTrigger id="loc-parent" aria-label="الموقع الرئيسي">
                      <SelectValue placeholder="بدون موقع رئيسي" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PARENT}>بدون موقع رئيسي</SelectItem>
                      {parentOptions.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="loc-type">نوع الموقع</Label>
                <Controller
                  control={form.control}
                  name="locationType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="loc-type" aria-label="نوع الموقع">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc-category">فئة التخزين</Label>
                <Input id="loc-category" placeholder="اختياري" {...form.register('storageCategory')} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="loc-barcode">باركود</Label>
                <Input id="loc-barcode" dir="ltr" {...form.register('barcode')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc-removal">استراتيجية الإزالة</Label>
                <Controller
                  control={form.control}
                  name="removalStrategy"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="loc-removal" aria-label="استراتيجية الإزالة">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REMOVAL_STRATEGY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">تجديد المخزون</p>
                <p className="text-xs text-muted-foreground">اقتراح إعادة التعبئة لهذا الموقع</p>
              </div>
              <Controller
                control={form.control}
                name="replenish"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="تجديد المخزون" />
                )}
              />
            </div>

            <div className="space-y-3 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold">العد الدوري</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="loc-freq">كل كم يوم؟</Label>
                  <Input
                    id="loc-freq"
                    type="number"
                    min={0}
                    dir="ltr"
                    {...form.register('cycleCountFrequencyDays', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc-last-count">آخر جرد</Label>
                  <Input id="loc-last-count" type="date" dir="ltr" {...form.register('lastCountAt')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc-next-count">الجرد التالي</Label>
                  <Input id="loc-next-count" type="date" dir="ltr" {...form.register('nextCountAt')} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormState({ open: false, location: null })}
                disabled={isSaving}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSaving || !companyId || !formWarehouseId}>
                {isSaving ? 'جاري الحفظ…' : 'حفظ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف الموقع؟</DialogTitle>
            <DialogDescription>حذف «{toDelete?.nameAr}».</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={remove.isPending}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={!toDelete || remove.isPending}
              onClick={() => {
                if (!toDelete || !companyId) return;
                void remove.mutateAsync({ companyId, id: toDelete.id }).then(() => setToDelete(null));
              }}
            >
              {remove.isPending ? 'جاري الحذف…' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
