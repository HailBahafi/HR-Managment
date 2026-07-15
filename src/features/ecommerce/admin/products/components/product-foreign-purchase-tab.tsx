'use client';

import { Globe2 } from 'lucide-react';

type Props = {
  productNameAr: string;
};

/** Placeholder surface until the Purchases app is available. */
export function ProductForeignPurchaseTab({ productNameAr }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
        <Globe2 className="h-6 w-6 text-muted-foreground" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">تم الشراء في الخارج</p>
        <p className="text-xs text-muted-foreground">
          مستندات الشراء الخارجي لـ «{productNameAr}» ستظهر هنا بعد تفعيل تطبيق المشتريات.
        </p>
      </div>
      <p className="rounded-lg bg-muted/60 px-3 py-1.5 text-xs tabular-nums text-muted-foreground">0 مستند</p>
    </div>
  );
}
