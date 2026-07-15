'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useWarehouseLocations } from '@/features/ecommerce/admin/inventory/locations/hooks/use-warehouse-locations';
import { useWarehouseLocationMutations } from '@/features/ecommerce/admin/inventory/locations/hooks/use-warehouse-location-mutations';
import {
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

type Props = {
  warehouseId: string;
};

function toFormValues(location: WarehouseLocation): WarehouseLocationFormValues {
  return {
    code: location.code,
    nameAr: location.nameAr,
    nameEn: location.nameEn ?? '',
    aisle: location.aisle ?? '',
    rack: location.rack ?? '',
    bin: location.bin ?? '',
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
    limit: 100,
  });
  const { create, update, remove } = useWarehouseLocationMutations(warehouseId);

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
    const payload = {
      companyId,
      warehouseId,
      code: values.code.trim(),
      nameAr: values.nameAr.trim(),
      nameEn: values.nameEn?.trim() || undefined,
      aisle: values.aisle?.trim() || undefined,
      rack: values.rack?.trim() || undefined,
      bin: values.bin?.trim() || undefined,
      isActive: values.isActive,
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
      key: 'coords',
      title: 'ممر / رف / بن',
      render: (row) => (
        <span className="text-sm text-muted-foreground" dir="ltr">
          {[row.aisle, row.rack, row.bin].filter(Boolean).join(' / ') || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (row) => <Badge variant={row.isActive ? 'success' : 'subtle'}>{row.isActive ? 'نشط' : 'معطّل'}</Badge>,
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
          <Button variant="ghost" size="icon" aria-label="حذف الموقع" onClick={() => setToDelete(row)}>
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
        data={data?.items ?? []}
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
            <DialogDescription>المواقع تحدد أماكن التخزين داخل المستودع (ممر، رف، بن).</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="loc-code">الرمز</Label>
                <Input id="loc-code" dir="ltr" {...form.register('code')} />
                {form.formState.errors.code ? (
                  <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc-name-ar">الاسم</Label>
                <Input id="loc-name-ar" {...form.register('nameAr')} />
                {form.formState.errors.nameAr ? (
                  <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-name-en">الاسم بالإنجليزية</Label>
              <Input id="loc-name-en" dir="ltr" {...form.register('nameEn')} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="loc-aisle">الممر</Label>
                <Input id="loc-aisle" dir="ltr" {...form.register('aisle')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc-rack">الرف</Label>
                <Input id="loc-rack" dir="ltr" {...form.register('rack')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc-bin">البن</Label>
                <Input id="loc-bin" dir="ltr" {...form.register('bin')} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <p className="text-sm font-medium">موقع نشط</p>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="حالة الموقع" />
                )}
              />
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
