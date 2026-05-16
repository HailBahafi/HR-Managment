'use client';

import * as React from 'react';
import type { AttendanceCheckInPoint } from '@/features/hr/attendance/lib/types';
import { useAttendanceStore } from '@/features/hr/attendance/lib/store';
import { genId } from '@/features/hr/attendance/lib/utils';
import { autosuggestQuery } from '@/components/here-map/components/geocoding';
import type { GeocodingResult } from '@/components/here-map/types/types';
import { CHECKPOINT_GEO_DEBOUNCE_MS, CHECKPOINT_GEO_MIN_QUERY_LEN } from '@/features/hr/attendance/checkpoints/constants/checkpoints-panel';
import { validateCheckpointDraft } from '@/features/hr/attendance/checkpoints/utils/checkpoint-validate';
import { publicConfig } from '@/shared/config';

export function useCheckpointsPanelModel() {
  const checkpoints = useAttendanceStore((s) => s.checkpoints);
  const upsertCheckpoint = useAttendanceStore((s) => s.upsertCheckpoint);
  const removeCheckpoint = useAttendanceStore((s) => s.removeCheckpoint);

  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<AttendanceCheckInPoint | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [geoQuery, setGeoQuery] = React.useState('');
  const justPickedRef = React.useRef(false);

  const [geoLoading, setGeoLoading] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);
  const [geoSuggestions, setGeoSuggestions] = React.useState<GeocodingResult[]>([]);

  const openCreate = React.useCallback(() => {
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
  }, []);

  const openEdit = React.useCallback((c: AttendanceCheckInPoint) => {
    setDraft({ ...c });
    setError(null);
    setGeoQuery('');
    setGeoError(null);
    setGeoSuggestions([]);
    setOpen(true);
  }, []);

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
    if (justPickedRef.current) {
      justPickedRef.current = false;
      return;
    }
    const q = geoQuery.trim();
    if (q.length < CHECKPOINT_GEO_MIN_QUERY_LEN) {
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
        if (!publicConfig.hereApiKey) {
          setGeoError('مفتاح HERE API غير مُعرّف.');
          setGeoLoading(false);
          return;
        }
        const center = draft ? { lat: draft.latitude, lng: draft.longitude } : { lat: 24.7136, lng: 46.6753 };
        const rows = await autosuggestQuery(q, publicConfig.hereApiKey, center, 8);
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
    }, CHECKPOINT_GEO_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- matches legacy: center uses latest draft when query fires
  }, [geoQuery, open]);

  const save = React.useCallback(() => {
    if (!draft) return;
    const err = validateCheckpointDraft(draft);
    if (err) {
      setError(err);
      return;
    }
    upsertCheckpoint({ ...draft, nameEn: draft.nameAr.trim() });
    setOpen(false);
    setDraft(null);
  }, [draft, upsertCheckpoint]);

  const selectedPoint = selected ? checkpoints.find((p) => p.id === selected) ?? null : null;

  React.useEffect(() => {
    if (selected && !checkpoints.some((p) => p.id === selected)) setSelected(null);
  }, [checkpoints, selected]);

  return {
    checkpoints,
    removeCheckpoint,
    open,
    setOpen,
    draft,
    setDraft,
    error,
    setError,
    selected,
    setSelected,
    geoQuery,
    setGeoQuery,
    geoLoading,
    geoError,
    geoSuggestions,
    pickSuggestion,
    openCreate,
    openEdit,
    save,
    selectedPoint,
    setGeoSuggestions,
  };
}

export type CheckpointsPanelModel = ReturnType<typeof useCheckpointsPanelModel>;
