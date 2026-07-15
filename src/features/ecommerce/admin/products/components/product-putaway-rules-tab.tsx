'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  usePutawayLocationOptions,
  usePutawayRuleMutations,
  usePutawayRules,
} from '@/features/ecommerce/admin/inventory/putaway-rules/hooks/use-putaway-rules';
import { PACKAGING_TYPE_OPTIONS } from '@/features/ecommerce/admin/products/schemas/product-schema';
import type { PackagingType } from '@/features/ecommerce/domain/types/product';
import type { PutawayRule } from '@/features/ecommerce/domain/types/putaway-rule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NO_PACKAGING = '__none__';

type Props = {
  companyId: string;
  productId: string;
  productNameAr: string;
};

type Draft = {
  arriveLocationId: string;
  storeLocationId: string;
  subLocationId: string;
  packagingType: PackagingType | '';
  storageCategory: string;
};

const EMPTY_DRAFT: Draft = {
  arriveLocationId: '',
  storeLocationId: '',
  subLocationId: '',
  packagingType: '',
  storageCategory: '',
};

export function ProductPutawayRulesTab({ companyId, productId, productNameAr }: Props) {
  const { data, isLoading } = usePutawayRules({ companyId, productId, limit: 100 });
  const { data: locations = [] } = usePutawayLocationOptions(companyId);
  const { create, update, remove } = usePutawayRuleMutations(companyId);
  const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);

  const locationLabel = (id: string) => {
    const found = locations.find((item) => item.id === id);
    return found ? `${found.warehouseNameAr} / ${found.nameAr}` : id;
  };

  async function onCreate() {
    if (!draft.arriveLocationId || !draft.storeLocationId) return;
    const arrive = locations.find((item) => item.id === draft.arriveLocationId);
    if (!arrive) return;
    await create.mutateAsync({
      companyId,
      warehouseId: arrive.warehouseId,
      arriveLocationId: draft.arriveLocationId,
      productId,
      categoryId: null,
      packagingType: draft.packagingType || null,
      storeLocationId: draft.storeLocationId,
      subLocationId: draft.subLocationId || null,
      storageCategory: draft.storageCategory || undefined,
    });
    setDraft(EMPTY_DRAFT);
  }

  async function patchRule(rule: PutawayRule, patch: Partial<PutawayRule>) {
    await update.mutateAsync({ id: rule.id, patch });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">قواعد التخزين — {productNameAr}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          عند وصول المنتج إلى موقع معيّن، حدّد أين يُخزَّن (وموقعًا فرعيًا اختياريًا) حسب نوع الطرد.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start font-medium">عندما يصل المنتج</th>
              <th className="px-3 py-2 text-start font-medium">نوع الطرد</th>
              <th className="px-3 py-2 text-start font-medium">التخزين في</th>
              <th className="px-3 py-2 text-start font-medium">الموقع الفرعي</th>
              <th className="px-3 py-2 text-start font-medium">فئة التخزين</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-muted-foreground">
                  جاري التحميل…
                </td>
              </tr>
            ) : null}

            {(data?.items ?? []).map((rule) => (
              <tr key={rule.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <Select
                    value={rule.arriveLocationId}
                    onValueChange={(value) => {
                      const loc = locations.find((item) => item.id === value);
                      void patchRule(rule, {
                        arriveLocationId: value,
                        warehouseId: loc?.warehouseId ?? rule.warehouseId,
                      });
                    }}
                  >
                    <SelectTrigger aria-label="عندما يصل المنتج">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.warehouseNameAr} / {loc.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={rule.packagingType ?? NO_PACKAGING}
                    onValueChange={(value) =>
                      void patchRule(rule, {
                        packagingType: value === NO_PACKAGING ? null : (value as PackagingType),
                      })
                    }
                  >
                    <SelectTrigger aria-label="نوع الطرد">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PACKAGING}>الكل</SelectItem>
                      {PACKAGING_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.labelAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={rule.storeLocationId}
                    onValueChange={(value) => void patchRule(rule, { storeLocationId: value })}
                  >
                    <SelectTrigger aria-label="التخزين في">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.warehouseNameAr} / {loc.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={rule.subLocationId ?? NO_PACKAGING}
                    onValueChange={(value) =>
                      void patchRule(rule, { subLocationId: value === NO_PACKAGING ? null : value })
                    }
                  >
                    <SelectTrigger aria-label="الموقع الفرعي">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PACKAGING}>بدون</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    defaultValue={rule.storageCategory ?? ''}
                    placeholder="اختياري"
                    onBlur={(event) => {
                      const next = event.target.value.trim();
                      if (next !== (rule.storageCategory ?? '')) {
                        void patchRule(rule, { storageCategory: next || undefined });
                      }
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="حذف القاعدة"
                    onClick={() => void remove.mutateAsync(rule.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}

            {!isLoading && (data?.items.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  لا توجد قواعد تخزين لهذا المنتج بعد.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
        <p className="text-sm font-medium">قاعدة جديدة</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            value={draft.arriveLocationId || undefined}
            onValueChange={(value) => setDraft((prev) => ({ ...prev, arriveLocationId: value }))}
          >
            <SelectTrigger aria-label="عندما يصل المنتج">
              <SelectValue placeholder="عندما يصل المنتج" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {locationLabel(loc.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={draft.packagingType || NO_PACKAGING}
            onValueChange={(value) =>
              setDraft((prev) => ({
                ...prev,
                packagingType: value === NO_PACKAGING ? '' : (value as PackagingType),
              }))
            }
          >
            <SelectTrigger aria-label="نوع الطرد">
              <SelectValue placeholder="نوع الطرد" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PACKAGING}>الكل</SelectItem>
              {PACKAGING_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.labelAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={draft.storeLocationId || undefined}
            onValueChange={(value) => setDraft((prev) => ({ ...prev, storeLocationId: value }))}
          >
            <SelectTrigger aria-label="التخزين في">
              <SelectValue placeholder="التخزين في" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {locationLabel(loc.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={draft.subLocationId || NO_PACKAGING}
            onValueChange={(value) =>
              setDraft((prev) => ({ ...prev, subLocationId: value === NO_PACKAGING ? '' : value }))
            }
          >
            <SelectTrigger aria-label="الموقع الفرعي">
              <SelectValue placeholder="الموقع الفرعي" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PACKAGING}>بدون</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="فئة التخزين"
            value={draft.storageCategory}
            onChange={(event) => setDraft((prev) => ({ ...prev, storageCategory: event.target.value }))}
          />
        </div>

        <Button
          type="button"
          size="sm"
          disabled={!draft.arriveLocationId || !draft.storeLocationId || create.isPending}
          onClick={() => void onCreate()}
        >
          <Plus className="me-1 h-3.5 w-3.5" />
          إضافة قاعدة
        </Button>
      </div>
    </div>
  );
}
