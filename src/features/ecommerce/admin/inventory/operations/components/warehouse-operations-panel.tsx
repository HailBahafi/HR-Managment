'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useWarehouseLocations } from '@/features/ecommerce/admin/inventory/locations/hooks/use-warehouse-locations';
import { useWarehouseOperations } from '@/features/ecommerce/admin/inventory/operations/hooks/use-warehouse-operations';
import { useWarehouseOperationMutations } from '@/features/ecommerce/admin/inventory/operations/hooks/use-warehouse-operation-mutations';
import {
  WAREHOUSE_OPERATION_FORM_DEFAULT_VALUES,
  warehouseOperationFormSchema,
  type WarehouseOperationFormValues,
} from '@/features/ecommerce/admin/inventory/schemas/warehouse-schemas';
import type {
  WarehouseOperation,
  WarehouseOperationKind,
} from '@/features/ecommerce/domain/types/warehouse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const KIND_META: Record<
  WarehouseOperationKind,
  { title: string; createLabel: string; empty: string; needsFrom: boolean; needsTo: boolean }
> = {
  issue: {
    title: 'عمليات الصرف',
    createLabel: 'مستند صرف',
    empty: 'لا توجد عمليات صرف بعد.',
    needsFrom: true,
    needsTo: false,
  },
  receipt: {
    title: 'عمليات الاستلام',
    createLabel: 'مستند استلام',
    empty: 'لا توجد عمليات استلام بعد.',
    needsFrom: false,
    needsTo: true,
  },
  internal: {
    title: 'الحركات الداخلية',
    createLabel: 'حركة داخلية',
    empty: 'لا توجد حركات داخلية بعد.',
    needsFrom: true,
    needsTo: true,
  },
};

const STATUS_LABEL: Record<WarehouseOperation['status'], string> = {
  draft: 'مسودة',
  posted: 'مرحّل',
  cancelled: 'ملغى',
};

type Props = {
  warehouseId: string;
  kind: WarehouseOperationKind;
};

export function WarehouseOperationsPanel({ warehouseId, kind }: Props) {
  const meta = KIND_META[kind];
  const companyId = getStorefrontCompanyId();
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<WarehouseOperation | null>(null);

  React.useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError } = useWarehouseOperations({
    companyId,
    warehouseId,
    kind,
    search: search || undefined,
    page: 1,
    limit: 100,
  });
  const { data: locationsData } = useWarehouseLocations({
    companyId,
    warehouseId,
    page: 1,
    limit: 200,
  });
  const locations = locationsData?.items ?? [];
  const locationNameById = React.useMemo(
    () => new Map(locations.map((location) => [location.id, location.nameAr])),
    [locations],
  );

  const { create, remove } = useWarehouseOperationMutations(warehouseId, kind);
  const form = useForm<WarehouseOperationFormValues>({
    resolver: zodResolver(warehouseOperationFormSchema),
    defaultValues: WAREHOUSE_OPERATION_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      ...WAREHOUSE_OPERATION_FORM_DEFAULT_VALUES,
      occurredAt: new Date().toISOString().slice(0, 16),
      reference: `${kind === 'issue' ? 'ISS' : kind === 'receipt' ? 'RCV' : 'INT'}-${Date.now().toString().slice(-6)}`,
    });
  }, [open, form, kind]);

  const onSubmit = async (values: WarehouseOperationFormValues) => {
    if (!companyId) return;
    await create.mutateAsync({
      companyId,
      warehouseId,
      kind,
      reference: values.reference.trim(),
      status: values.status,
      occurredAt: new Date(values.occurredAt).toISOString(),
      notes: values.notes?.trim() || undefined,
      lines: [
        {
          id: `opl-${Math.random().toString(36).slice(2, 8)}`,
          productName: values.productName.trim(),
          sku: values.sku?.trim() || undefined,
          quantity: values.quantity,
          fromLocationId: values.fromLocationId || undefined,
          toLocationId: values.toLocationId || undefined,
        },
      ],
    });
    setOpen(false);
  };

  const columns: ColumnDef<WarehouseOperation>[] = [
    {
      key: 'reference',
      title: 'المرجع',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium" dir="ltr">
            {row.reference}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(row.occurredAt).toLocaleString('ar-SA')}
          </span>
        </div>
      ),
    },
    {
      key: 'lines',
      title: 'البنود',
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.lines.map((line) => `${line.productName} × ${line.quantity}`).join('، ')}
        </span>
      ),
    },
    {
      key: 'locations',
      title: 'المواقع',
      render: (row) => {
        const line = row.lines[0];
        if (!line) return '—';
        const from = line.fromLocationId ? locationNameById.get(line.fromLocationId) ?? '—' : null;
        const to = line.toLocationId ? locationNameById.get(line.toLocationId) ?? '—' : null;
        if (from && to) return <span className="text-sm">{from} ← {to}</span>;
        if (from) return <span className="text-sm">من: {from}</span>;
        if (to) return <span className="text-sm">إلى: {to}</span>;
        return '—';
      },
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (row) => (
        <Badge variant={row.status === 'posted' ? 'success' : row.status === 'cancelled' ? 'destructive' : 'subtle'}>
          {STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      render: (row) => (
        <Button variant="ghost" size="icon" aria-label="حذف المستند" onClick={() => setToDelete(row)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ListToolbar searchValue={searchInput} onSearchChange={setSearchInput} searchPlaceholder="ابحث بالمرجع أو المنتج…" />
        <Button onClick={() => setOpen(true)} disabled={!companyId}>
          <Plus className="h-4 w-4" />
          {meta.createLabel}
        </Button>
      </div>

      {isError ? <p className="text-sm text-destructive">تعذر تحميل {meta.title}.</p> : null}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        emptyText={meta.empty}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={`${dialogMaxHeightClass} max-w-lg overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{meta.createLabel}</DialogTitle>
            <DialogDescription>أنشئ مستندًا جديدًا لهذا المستودع.</DialogDescription>
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
                <Label htmlFor="op-ref">المرجع</Label>
                <Input id="op-ref" dir="ltr" {...form.register('reference')} />
                {form.formState.errors.reference ? (
                  <p className="text-xs text-destructive">{form.formState.errors.reference.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="op-date">التاريخ</Label>
                <Input id="op-date" type="datetime-local" dir="ltr" {...form.register('occurredAt')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="op-status">الحالة</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="op-status" aria-label="حالة المستند">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="posted">مرحّل</SelectItem>
                      <SelectItem value="cancelled">ملغى</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="op-product">المنتج</Label>
                <Input id="op-product" {...form.register('productName')} />
                {form.formState.errors.productName ? (
                  <p className="text-xs text-destructive">{form.formState.errors.productName.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="op-qty">الكمية</Label>
                <Input
                  id="op-qty"
                  type="number"
                  min={1}
                  step={1}
                  dir="ltr"
                  {...form.register('quantity', { valueAsNumber: true })}
                />
                {form.formState.errors.quantity ? (
                  <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="op-sku">رمز المنتج (SKU)</Label>
              <Input id="op-sku" dir="ltr" {...form.register('sku')} />
            </div>

            {meta.needsFrom ? (
              <div className="space-y-1.5">
                <Label htmlFor="op-from">من موقع</Label>
                <Controller
                  control={form.control}
                  name="fromLocationId"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger id="op-from" aria-label="موقع الصرف">
                        <SelectValue placeholder="اختر موقعًا" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : null}

            {meta.needsTo ? (
              <div className="space-y-1.5">
                <Label htmlFor="op-to">إلى موقع</Label>
                <Controller
                  control={form.control}
                  name="toLocationId"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger id="op-to" aria-label="موقع الاستلام">
                        <SelectValue placeholder="اختر موقعًا" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="op-notes">ملاحظات</Label>
              <Textarea id="op-notes" className="min-h-[72px] resize-none" {...form.register('notes')} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
                إلغاء
              </Button>
              <Button type="submit" disabled={create.isPending || !companyId}>
                {create.isPending ? 'جاري الحفظ…' : 'حفظ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(toDelete)} onOpenChange={(openDialog) => !openDialog && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف المستند؟</DialogTitle>
            <DialogDescription>حذف «{toDelete?.reference}» نهائيًا من هذه القائمة.</DialogDescription>
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
