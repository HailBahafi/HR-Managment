'use client';

import * as React from 'react';
import { MapPin, Pencil, Plus, Search, Trash2, Navigation2, Radio, Loader2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { useAttendanceStore } from '@/lib/attendance/store';
import { genId } from '@/lib/attendance/utils';
import { cn } from '@/lib/utils';

function validate(draft: AttendanceCheckInPoint): string | null {
  if (!draft.nameAr.trim()) return 'اسم النقطة بالعربية مطلوب';
  if (draft.latitude < -90 || draft.latitude > 90) return 'خط العرض خارج النطاق';
  if (draft.longitude < -180 || draft.longitude > 180) return 'خط الطول خارج النطاق';
  if (draft.radiusMeters < 10) return 'نصف القطر يجب أن يكون 10 أمتار على الأقل';
  return null;
}

export function CheckpointsPanel() {
  const checkpoints = useAttendanceStore((s) => s.checkpoints);
  const upsertCheckpoint = useAttendanceStore((s) => s.upsertCheckpoint);
  const removeCheckpoint = useAttendanceStore((s) => s.removeCheckpoint);

  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<AttendanceCheckInPoint | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [listQ, setListQ] = React.useState('');
  const [geoQuery, setGeoQuery] = React.useState('');
  const [geoLoading, setGeoLoading] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);

  const visibleCheckpoints = React.useMemo(() => {
    const t = listQ.trim().toLowerCase();
    if (!t) return checkpoints;
    return checkpoints.filter((p) => {
      const blob = [
        p.nameAr,
        p.nameEn ?? '',
        String(p.latitude),
        String(p.longitude),
        String(p.radiusMeters),
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(t);
    });
  }, [checkpoints, listQ]);

  const openCreate = () => {
    setDraft({
      id: genId('cp'),
      nameAr: '',
      nameEn: '',
      latitude: 24.7136,
      longitude: 46.6753,
      radiusMeters: 100,
      isActive: true,
    });
    setError(null);
    setGeoQuery('');
    setGeoError(null);
    setOpen(true);
  };

  const openEdit = (c: AttendanceCheckInPoint) => {
    setDraft({ ...c });
    setError(null);
    setGeoQuery('');
    setGeoError(null);
    setOpen(true);
  };

  const searchPlace = async () => {
    const q = geoQuery.trim();
    if (!q || !draft) return;
    setGeoLoading(true);
    setGeoError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'Accept-Language': 'ar,en' },
      });
      if (!res.ok) throw new Error('network');
      const rows = (await res.json()) as { lat: string; lon: string }[];
      if (!Array.isArray(rows) || rows.length === 0) {
        setGeoError('لم يُعثر على مكان مطابق.');
        return;
      }
      const la = Number(rows[0].lat);
      const lo = Number(rows[0].lon);
      if (!Number.isFinite(la) || !Number.isFinite(lo)) {
        setGeoError('استجابة غير صالحة من خدمة البحث.');
        return;
      }
      setDraft({ ...draft, latitude: la, longitude: lo });
    } catch {
      setGeoError('تعذر البحث. تحقق من الاتصال وحاول مرة أخرى.');
    } finally {
      setGeoLoading(false);
    }
  };

  const save = () => {
    if (!draft) return;
    const err = validate(draft);
    if (err) { setError(err); return; }
    upsertCheckpoint(draft);
    setOpen(false);
    setDraft(null);
  };

  const selectedPoint = selected ? checkpoints.find((p) => p.id === selected) ?? null : null;

  React.useEffect(() => {
    if (selected && !checkpoints.some((p) => p.id === selected)) setSelected(null);
  }, [checkpoints, selected]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">نقاط التسجيل الجغرافية ونطاق القبول بالأمتار.</p>
        <Button variant="luxe" className="gap-2 shrink-0" type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          نقطة جديدة
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={listQ}
            onChange={(e) => setListQ(e.target.value)}
            placeholder="تصفية البطاقات بالاسم أو الإحداثيات…"
            className="h-10 pr-10"
            aria-label="تصفية قائمة النقاط"
          />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          النقاط (
          <span className="number-ar">{visibleCheckpoints.length}</span>
          {listQ.trim() ? (
            <>
              {' '}
              من <span className="number-ar">{checkpoints.length}</span>
            </>
          ) : null}
          )
        </p>

        {checkpoints.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-10 text-center">
            <MapPin className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">لا توجد نقاط بعد</p>
          </div>
        )}

        {checkpoints.length > 0 && visibleCheckpoints.length === 0 && (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground">
            لا توجد نقاط مطابقة للبحث
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCheckpoints.map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected((cur) => (cur === p.id ? null : p.id))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected((cur) => (cur === p.id ? null : p.id));
                }
              }}
              className={cn(
                'group flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3 text-right shadow-soft transition-all outline-none hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                selected === p.id ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-border',
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={cn(
                    'inline-flex h-2 w-2 shrink-0 rounded-full',
                    p.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                  )}
                />
                <p className="truncate font-semibold">{p.nameAr}</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <ChevronLeft
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    selected === p.id && '-rotate-90 text-primary',
                  )}
                />
                <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(p);
                    }}
                    aria-label="تعديل"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-8 w-8 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('حذف النقطة؟')) removeCheckpoint(p.id);
                    }}
                    aria-label="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {checkpoints.length > 0 && !selectedPoint ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            انقر على بطاقة لعرض تفاصيل النقطة والموقع على الخريطة.
          </p>
        ) : null}

        {selectedPoint ? (
          <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{selectedPoint.nameAr}</h3>
                  <Badge variant={selectedPoint.isActive ? 'success' : 'secondary'} className="shrink-0">
                    {selectedPoint.isActive ? 'نشط' : 'موقوف'}
                  </Badge>
                </div>
                {selectedPoint.nameEn ? (
                  <p className="mt-1 truncate text-sm text-muted-foreground" dir="ltr">
                    {selectedPoint.nameEn}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" type="button" className="gap-1.5" onClick={() => openEdit(selectedPoint)}>
                  <Pencil className="h-3.5 w-3.5" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (window.confirm('حذف النقطة؟')) {
                      removeCheckpoint(selectedPoint.id);
                      setSelected(null);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-3 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Radio className="h-3.5 w-3.5 shrink-0" />
                نطاق القبول:{' '}
                <span className="font-mono font-medium text-foreground number-ar">{selectedPoint.radiusMeters}</span> م
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-muted-foreground" dir="ltr">
                <Navigation2 className="h-3.5 w-3.5 shrink-0" />
                {selectedPoint.latitude.toFixed(5)}, {selectedPoint.longitude.toFixed(5)}
              </span>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">الموقع</p>
              <MapPicker
                height={320}
                value={{
                  latitude: selectedPoint.latitude,
                  longitude: selectedPoint.longitude,
                  radiusMeters: selectedPoint.radiusMeters,
                }}
                onChange={() => {}}
                interactive={false}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] w-full min-w-0 max-w-2xl flex-col overflow-hidden border-border p-0">
          <div className="shrink-0 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {draft && checkpoints.some((c) => c.id === draft.id) ? 'تعديل نقطة التسجيل' : 'نقطة تسجيل جديدة'}
              </DialogTitle>
              <DialogDescription>
                ابحث عن عنوان أو مكان للانتقال إليه، أو انقر على الخريطة واسحب الدبوس. تظهر أدوات نطاق القبول أثناء التعديل فقط أسفل يمين الخريطة.
              </DialogDescription>
            </DialogHeader>
          </div>

          {draft && (
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-6 pb-2">
              <div className="min-w-0 space-y-5">
                <div className="space-y-2">
                  <Label>بحث عن مكان (OpenStreetMap)</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={geoQuery}
                      onChange={(e) => setGeoQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void searchPlace();
                        }
                      }}
                      placeholder="مثال: برج المملكة الرياض، أو حي الملز…"
                      className="font-sans sm:flex-1"
                      dir="rtl"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0 gap-2 sm:w-auto"
                      disabled={geoLoading || !geoQuery.trim()}
                      onClick={() => void searchPlace()}
                    >
                      {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      بحث
                    </Button>
                  </div>
                  {geoError ? <p className="text-xs text-destructive">{geoError}</p> : null}
                </div>

                <div className="min-w-0">
                  <MapPicker
                    height={300}
                    value={{ latitude: draft.latitude, longitude: draft.longitude, radiusMeters: draft.radiusMeters }}
                    onChange={(v) => setDraft({ ...draft, latitude: v.latitude, longitude: v.longitude, radiusMeters: v.radiusMeters })}
                    interactive
                  />
                </div>

                <Separator />

                {/* Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>الاسم بالعربية</Label>
                    <Input value={draft.nameAr} onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>الاسم بالإنجليزية (اختياري)</Label>
                    <Input dir="ltr" value={draft.nameEn ?? ''} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} />
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
    </div>
  );
}
