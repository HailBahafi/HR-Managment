'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useWarehouseLocations } from '@/features/ecommerce/admin/inventory/locations/hooks/use-warehouse-locations';
import { useWarehouseLocationMutations } from '@/features/ecommerce/admin/inventory/locations/hooks/use-warehouse-location-mutations';
import {
  LOCATION_TYPE_OPTIONS,
  REMOVAL_STRATEGY_OPTIONS,
  WAREHOUSE_LOCATION_FORM_DEFAULT_VALUES,
  warehouseLocationFormSchema,
  type WarehouseLocationFormValues,
} from '@/features/ecommerce/admin/inventory/schemas/warehouse-schemas';
import type { WarehouseLocation } from '@/features/ecommerce/domain/types/warehouse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ListToolbar } from '@/components/ui/list-toolbar';
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

type Props = {
  warehouseId: string;
};

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

export function WarehouseLocationsPanel({ warehouseId }: Props) {
  const companyId = getStorefrontCompanyId();
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [formState, setFormState] = React.useState<{ open: boolean; location: WarehouseLocation | null }>({
    open: false,
    location: null,
  });
  const [toDelete, setToDelete] = React.useState<WarehouseLocation | null>(null);

  React.useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError } = useWarehouseLocations({
    companyId,
    warehouseId,
    search: search || undefined,
    page: 1,
    limit: 200,
  });
  const { create, update, remove } = useWarehouseLocationMutations(warehouseId);
  const locations = data?.items ?? [];
  const parentOptions = locations.filter((location) => location.id !== formState.location?.id);
  const nameById = React.useMemo(() => new Map(locations.map((location) => [location.id, location.nameAr])), [locations]);

  const form = useForm<WarehouseLocationFormValues>({
    resolver: zodResolver(warehouseLocationFormSchema),
    defaultValues: WAREHOUSE_LOCATION_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (!formState.open) return;
    form.reset(formState.location ? toFormValues(formState.location) : WAREHOUSE_LOCATION_FORM_DEFAULT_VALUES);
  }, [formState, form]);

  const isSaving = create.isPending || update.isPending;

  const onSubmit = async (values: WarehouseLocationFormValues) => {
    if (!companyId) return;
    const code =
      formState.location?.code ??
      values.nameAr
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 32);

    const payload = {
      companyId,
      warehouseId,
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
      render: (row) =>
        row.isSystem ? <Badge variant="outline">تلقائي</Badge> : null,
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ListToolbar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="ابحث في المواقع…"
          className="min-w-[220px] flex-1"
        />
        <Button onClick={() => setFormState({ open: true, location: null })} disabled={!companyId}>
          <Plus className="h-4 w-4" />
          إضافة موقع
        </Button>
      </div>

      {isError ? <p className="text-sm text-destructive">تعذر تحميل المواقع.</p> : null}

      <DataTable
        columns={columns}
        data={locations}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        emptyText="لا توجد مواقع لهذا المستودع بعد."
      />

      <Dialog
        open={formState.open}
        onOpenChange={(open) => setFormState((s) => ({ ...s, open, location: open ? s.location : null }))}
      >
        <DialogContent className={`${dialogMaxHeightClass} max-w-lg overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{formState.location ? 'تعديل الموقع' : 'إضافة موقع'}</DialogTitle>
            <DialogDescription>مثال: رف 1 داخل ممر 1 — اختر الموقع الرئيسي ونوع التخزين باختصار.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
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
              <Button type="submit" disabled={isSaving || !companyId}>
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
            <DialogDescription>حذف «{toDelete?.nameAr}» من هذا المستودع.</DialogDescription>
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
