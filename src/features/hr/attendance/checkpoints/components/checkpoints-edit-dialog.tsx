'use client';

import { Loader2, LocateFixed, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPicker } from '@/components/ui/map-picker';
import type { AttendanceCheckInPoint } from '@/lib/attendance/types';
import { cn } from '@/lib/utils';
import type { CheckpointsPanelModel } from '@/features/hr/attendance/checkpoints/hooks/useCheckpointsPanelModel';

export function CheckpointsEditDialog({
  model,
  checkpoints,
}: {
  model: CheckpointsPanelModel;
  checkpoints: AttendanceCheckInPoint[];
}) {
  const {
    open,
    setOpen,
    draft,
    setDraft,
    error,
    geoQuery,
    setGeoQuery,
    geoLoading,
    geoError,
    geoSuggestions,
    pickSuggestion,
    save,
    setGeoSuggestions,
  } = model;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[96vh] w-full min-w-0 max-w-5xl flex-col overflow-hidden border-border p-0">
        <div className="shrink-0 p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {draft && checkpoints.some((c) => c.id === draft.id) ? 'تعديل نقطة التسجيل' : 'نقطة تسجيل جديدة'}
            </DialogTitle>
            <DialogDescription>
              اكتب اسم المكان لعرض اقتراحات من خدمات الخرائط أو انقر على الخريطة واسحب الدبوس. تظهر أدوات نطاق القبول أثناء
              التعديل فقط أسفل يمين الخريطة.
            </DialogDescription>
          </DialogHeader>
        </div>

        {draft && (
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-6 pb-2">
            <div className="min-w-0 space-y-5">
              <div className="space-y-2">
                <Label>بحث عن عنوان أو مكان</Label>
                <p className="text-[11px] text-muted-foreground">يمكنك البحث بالاسم أو الشارع أو العنوان الوطني — تظهر الاقتراحات تلقائياً.</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={geoQuery}
                      onChange={(e) => setGeoQuery(e.target.value)}
                      autoComplete="off"
                      placeholder="مثال: برج المملكة الرياض، حي الملز، RDAA…"
                      className={cn('pe-9 font-sans', geoLoading && 'opacity-80')}
                      dir="rtl"
                    />
                    {geoLoading && (
                      <Loader2 className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                    {geoSuggestions.length > 0 && (
                      <ul
                        className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover py-1 text-sm text-popover-foreground shadow-lg"
                        role="listbox"
                      >
                        {geoSuggestions.map((s, i) => (
                          <li key={`${s.latitude}-${s.longitude}-${i}`}>
                            <button
                              type="button"
                              role="option"
                              className="flex w-full items-start gap-2 px-3 py-2.5 text-right transition-colors hover:bg-accent hover:text-accent-foreground"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                pickSuggestion(s);
                              }}
                            >
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="min-w-0 flex-1 leading-snug">{s.title}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    title="استخدام موقعي الحالي"
                    onClick={() => {
                      if (!navigator.geolocation) return;
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setDraft((d) =>
                            d ? { ...d, latitude: pos.coords.latitude, longitude: pos.coords.longitude } : d,
                          );
                          setGeoSuggestions([]);
                        },
                        undefined,
                        { timeout: 8000 },
                      );
                    }}
                  >
                    <LocateFixed className="h-4 w-4" />
                  </Button>
                </div>
                {geoError && <p className="text-xs text-destructive">{geoError}</p>}
              </div>

              <div className="mx-2 min-w-0 overflow-hidden rounded-xl ring-1 ring-border">
                <MapPicker
                  height={520}
                  value={{ latitude: draft.latitude, longitude: draft.longitude, radiusMeters: draft.radiusMeters }}
                  onChange={(v) =>
                    setDraft({ ...draft, latitude: v.latitude, longitude: v.longitude, radiusMeters: v.radiusMeters })
                  }
                  interactive
                />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>الاسم</Label>
                  <Input value={draft.nameAr} onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>خط العرض</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    dir="ltr"
                    className="font-mono"
                    value={draft.latitude}
                    onChange={(e) => setDraft({ ...draft, latitude: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>خط الطول</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    dir="ltr"
                    className="font-mono"
                    value={draft.longitude}
                    onChange={(e) => setDraft({ ...draft, longitude: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>نصف القطر (م)</Label>
                  <Input
                    type="number"
                    min={10}
                    max={2000}
                    dir="ltr"
                    className="font-mono"
                    value={draft.radiusMeters}
                    onChange={(e) => setDraft({ ...draft, radiusMeters: Number(e.target.value) || 10 })}
                  />
                </div>
                <div className="flex items-center justify-between self-end rounded-lg border border-border bg-muted/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">نشط</p>
                    <p className="text-xs text-muted-foreground">يمكن إيقاف النقطة دون حذفها</p>
                  </div>
                  <Switch checked={draft.isActive} onCheckedChange={(v) => setDraft({ ...draft, isActive: v })} />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
        )}

        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:justify-start sm:space-x-2 sm:space-x-reverse">
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button variant="luxe" type="button" onClick={save}>
            حفظ النقطة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
