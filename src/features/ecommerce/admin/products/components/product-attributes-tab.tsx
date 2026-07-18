'use client';

import { Link2, Trash2 } from 'lucide-react';
import { useFieldArray, type Control, type FieldErrors } from 'react-hook-form';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCatalogAttributes } from '@/features/ecommerce/admin/attributes/hooks/use-catalog-attributes';
import {
  ATTRIBUTE_DISPLAY_OPTIONS,
  VARIANT_CREATION_OPTIONS,
  type ProductFormInput,
} from '@/features/ecommerce/admin/products/schemas/product-schema';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import {
  normalizeAttributeValue,
  type CatalogAttribute,
} from '@/features/ecommerce/domain/types/catalog-attribute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/shared/utils';

type Props = {
  control: Control<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
};

function newLineId() {
  return `pline-${Math.random().toString(36).slice(2, 9)}`;
}

export function ProductAttributesTab({ control, errors }: Props) {
  const companyId = getStorefrontCompanyId();
  const { data: catalogData, isLoading } = useCatalogAttributes({ companyId, limit: 100 });
  const { fields, append, remove } = useFieldArray({ control, name: 'attributes' });

  const catalog = (catalogData?.items ?? []).filter((item) => item.isActive);
  const linkedIds = new Set(fields.map((field) => field.attributeId).filter(Boolean));

  function applyFromCatalog(attribute: CatalogAttribute) {
    if (linkedIds.has(attribute.id)) return;
    append({
      id: newLineId(),
      attributeId: attribute.id,
      nameAr: attribute.nameAr,
      displayType: attribute.displayType,
      createVariant: attribute.createVariant,
      values: attribute.values.map((raw) => {
        const value = normalizeAttributeValue(raw, attribute.displayType);
        return {
          id: value.id,
          nameAr: value.nameAr,
          freeText: value.freeText,
          defaultExtraPrice: value.defaultExtraPrice,
          colorHex: value.colorHex,
          imageUrl: value.imageUrl,
        };
      }),
    });
  }

  const displayLabel = (value: string) =>
    ATTRIBUTE_DISPLAY_OPTIONS.find((option) => option.value === value)?.labelAr ?? value;
  const variantLabel = (value: string) =>
    VARIANT_CREATION_OPTIONS.find((option) => option.value === value)?.labelAr ?? value;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">الخصائص والمتغيرات</p>
          <p className="mt-1 text-xs text-muted-foreground">
            اختر خصائص من التهيئة (صفحة الخصائص) لربطها بهذا المنتج. لا تُنشأ الخصائص هنا من الصفر.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={ecommerceAdminRoutes.attributes}>
            <Link2 className="me-1 h-3.5 w-3.5" />
            إدارة الخصائص
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">خصائص جاهزة من التهيئة</p>
        {isLoading ? <p className="text-xs text-muted-foreground">جاري التحميل…</p> : null}
        {!isLoading && catalog.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            لا توجد خصائص مفعّلة. أنشئها من قائمة المنتجات ← الكتالوج ← الخصائص.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {catalog.map((attribute) => {
            const linked = linkedIds.has(attribute.id);
            return (
              <button
                key={attribute.id}
                type="button"
                disabled={linked}
                onClick={() => applyFromCatalog(attribute)}
                className={
                  linked
                    ? 'rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground'
                    : 'rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10'
                }
              >
                {linked ? `✓ ${attribute.nameAr}` : `+ ${attribute.nameAr}`}
              </button>
            );
          })}
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          لم تُربط خصائص بهذا المنتج بعد.
        </div>
      ) : null}

      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2 rounded-xl border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{field.nameAr}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge variant="subtle">{displayLabel(field.displayType)}</Badge>
                <Badge variant="outline">{variantLabel(field.createVariant)}</Badge>
                {field.attributeId ? <Badge variant="outline">من التهيئة</Badge> : null}
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label="إزالة الخاصية" onClick={() => remove(index)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {field.values.map((value) => (
              <span
                key={value.id}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs text-foreground',
                )}
              >
                {field.displayType === 'color' && value.colorHex ? (
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: value.colorHex }}
                    title={value.colorHex}
                  />
                ) : null}
                {field.displayType === 'image' && value.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={value.imageUrl}
                    alt=""
                    className="h-5 w-5 shrink-0 rounded object-cover"
                  />
                ) : null}
                {value.nameAr}
                {value.defaultExtraPrice ? (
                  <span className="text-muted-foreground">(+{value.defaultExtraPrice})</span>
                ) : null}
              </span>
            ))}
          </div>
          {errors.attributes?.[index]?.nameAr ? (
            <p className="text-xs text-destructive">{errors.attributes[index]?.nameAr?.message}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
