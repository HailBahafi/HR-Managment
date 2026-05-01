'use client';

import * as React from 'react';
import { MapPin, Pencil, Plus, Trash2, Navigation2, Radio, Loader2, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageFilters } from '@/components/filter-panel-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { autosuggestQuery } from '@/components/here-map/components/geocoding';
import type { GeocodingResult } from '@/components/here-map/types/types';

const GEO_DEBOUNCE_MS = 450;
const GEO_MIN_QUERY_LEN = 2;
const HERE_API_KEY = (process.env.NEXT_PUBLIC_HERE_API_KEY ?? '').trim();

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
  const [geoQuery, setGeoQuery] = React.useState('');
  const justPickedRef = React.useRef(false);

  const { values } = usePageFilters([
    { key: 'q', label: 'بحث النقاط', type: 'text', placeholder: 'الاسم أو الإحداثيات…' },
  ]);
  const listQ = (values.q as string) ?? '';
  const [geoLoading, setGeoLoading] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);
  const [geoSuggestions, setGeoSuggestions] = React.useState<GeocodingResult[]>([]);

  const visibleCheckpoints = React.useMemo(() => {
    const t = listQ.trim().toLowerCase();
    if (!t) return checkpoints;
    return checkpoints.filter((p) => {
      const blob = [
        p.nameAr,
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
    setGeoSuggestions([]);
    setOpen(true);
  };

  const openEdit = (c: AttendanceCheckInPoint) => {
    setDraft({ ...c });
    setError(null);
    setGeoQuery('');
    setGeoError(null);
    setGeoSuggestions([]);
    setOpen(true);
  };

  const pickSuggestion = React.useCallback((row: GeocodingResult) => {
    justPickedRef.current = true;
    setDraft((d) => {
      if (!d) return d;
      if (!Number.isFinite(row.latitude) || !Number.isFinite(row.longitude)) return d;
      return { ...d, latitude: row.latitude, longitude: row.longitude };
    });
    setGeoQuery(row.title);
    setGeoSuggestions([]);
    setGeoError(null);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setGeoSuggestions([]);
      setGeoLoading(false);
      setGeoError(null);
      return;
    }
    if (justPickedRef.current) { justPickedRef.current = false; return; }
    const q = geoQuery.trim();
    if (q.length < GEO_MIN_QUERY_LEN) {
      setGeoSuggestions([]);
      setGeoError(null);
      setGeoLoading(false);
      return;
    }

    const ac = new AbortController();
    setGeoLoading(true);
    setGeoError(null);

    const timer = window.setTimeout(async () => {
      try {
        if (!HERE_API_KEY) {
          setGeoError('مفتاح HERE API غير مُعرّف.');
          setGeoLoading(false);
          return;
        }
        // Pass the current draft location so suggestions are biased to the right area
        const center = draft
          ? { lat: draft.latitude, lng: draft.longitude }
          : { lat: 24.7136, lng: 46.6753 };
        const rows = await autosuggestQuery(q, HERE_API_KEY, center, 8);
        if (ac.signal.aborted) return;
        setGeoSuggestions(rows);
        if (rows.length === 0) setGeoError('لم يُعثر على نتائج.');
        else setGeoError(null);
      } catch (e) {
        if (ac.signal.aborted || (e as Error).name === 'AbortError') return;
        setGeoSuggestions([]);
        setGeoError('تعذر البحث. تحقق من الاتصال بالإنترنت.');
      } finally {
        if (!ac.signal.aborted) setGeoLoading(false);
      }
    }, GEO_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [geoQuery, open]);

  const save = () => {
    if (!draft) return;
    const err = validate(draft);
    if (err) { setError(err); return; }
    upsertCheckpoint({ ...draft, nameEn: draft.nameAr.trim() });
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
      <div className="flex items-center justify-end">
        <Button variant="luxe" className="gap-2 shrink-0" type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          نقطة جديدة
        </Button>
      </div>

      <div className="space-y-3">
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                'group relative overflow-hidden rounded-xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected === p.id
                  ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border',
              )}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary opacity-0 blur-2xl transition-opacity group-hover:opacity-10" />

              <div className="relative p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    p.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/60',
                  )}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                    p.isActive
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-border bg-muted text-muted-foreground',
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', p.isActive ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                    {p.isActive ? 'نشط' : 'موقوف'}
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-display text-base font-bold leading-snug mb-3 group-hover:text-primary transition-colors truncate">
                  {p.nameAr}
                </h3>

                {/* Coords + radius */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Navigation2 className="h-3 w-3 shrink-0" />
                    <span className="font-mono truncate" dir="ltr">
                      {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Radio className="h-3 w-3 shrink-0" />
                    <span>نطاق القبول: <span className="font-mono font-medium text-foreground">{p.radiusMeters}</span> م</span>
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-1 border-t border-border/60 pt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="sm" type="button" className="h-7 gap-1 px-2 text-xs" onClick={() => openEdit(p)}>
                    <Pencil className="h-3 w-3" /> تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => { if (window.confirm('حذف النقطة؟')) removeCheckpoint(p.id); }}
                  >
                    <Trash2 className="h-3 w-3" /> حذف
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
          <div className="space-y-4 rounded-xl p-4 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{selectedPoint.nameAr}</h3>
                  <Badge variant={selectedPoint.isActive ? 'success' : 'secondary'} className="shrink-0">
                    {selectedPoint.isActive ? 'نشط' : 'موقوف'}
                  </Badge>
                </div>
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
        <DialogContent className="flex max-h-[92vh] w-full min-w-0 max-w-4xl flex-col overflow-hidden border-border p-0">
          <div className="shrink-0 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {draft && checkpoints.some((c) => c.id === draft.id) ? 'تعديل نقطة التسجيل' : 'نقطة تسجيل جديدة'}
              </DialogTitle>
              <DialogDescription>
                اكتب اسم المكان لعرض اقتراحات من خدمات الخرائط أو انقر على الخريطة واسحب الدبوس. تظهر أدوات نطاق القبول أثناء التعديل فقط أسفل يمين الخريطة.
              </DialogDescription>
            </DialogHeader>
          </div>

          {draft && (
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-6 pb-2">
              <div className="min-w-0 space-y-5">
                <div className="space-y-2">
                  <Label>بحث عن عنوان أو مكان</Label>
                  <p className="text-[11px] text-muted-foreground">
                    يمكنك البحث بالاسم أو الشارع أو العنوان الوطني — تظهر الاقتراحات تلقائياً.
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={geoQuery}
                        onChange={(e) => setGeoQuery(e.target.value)}
                        autoComplete="off"
                        placeholder="مثال: برج المملكة الرياض، حي الملز، RDAA…"
                        className={cn('font-sans pe-9', geoLoading && 'opacity-80')}
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
                                onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s); }}
                              >
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1 leading-snug">{s.title}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {/* Current location button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      title="استخدام موقعي الحالي"
                      onClick={() => {
                        if (!navigator.geolocation) return;
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setDraft((d) => d ? { ...d, latitude: pos.coords.latitude, longitude: pos.coords.longitude } : d);
                          setGeoQuery('موقعي الحالي');
                          setGeoSuggestions([]);
                        }, undefined, { timeout: 8000 });
                      }}
                    >
                      <LocateFixed className="h-4 w-4" />
                    </Button>
                  </div>
                  {geoError && <p className="text-xs text-destructive">{geoError}</p>}
                </div>

                <div className="min-w-0">
                  <MapPicker
                    height={480}
                    value={{ latitude: draft.latitude, longitude: draft.longitude, radiusMeters: draft.radiusMeters }}
                    onChange={(v) => setDraft({ ...draft, latitude: v.latitude, longitude: v.longitude, radiusMeters: v.radiusMeters })}
                    interactive
                  />
                </div>

                <Separator />

                {/* Fields */}
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
    </div>
  );
}
