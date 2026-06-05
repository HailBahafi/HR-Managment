'use client';

import * as React from 'react';
import type { AttendanceCheckInPoint } from '@/features/hr/attendance/lib/types';
import { autosuggestQuery } from '@/components/here-map/components/geocoding';
import type { GeocodingResult } from '@/components/here-map/types/types';
import { CHECKPOINT_GEO_DEBOUNCE_MS, CHECKPOINT_GEO_MIN_QUERY_LEN } from '@/features/hr/attendance/checkpoints/constants/checkpoints-panel';
import { validateCheckpointDraft } from '@/features/hr/attendance/checkpoints/utils/checkpoint-validate';
import { publicConfig } from '@/shared/config';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  createCheckInPoint,
  deleteCheckInPoint,
  loadCheckInPoints,
  updateCheckInPoint,
} from '@/features/hr/attendance/checkpoints/services/check-in-points.service';

const r6 = (n: number) => parseFloat(n.toFixed(6));

export function useCheckpointsPanelModel() {
  const [checkpoints, setCheckpoints] = React.useState<AttendanceCheckInPoint[]>([]);
  // companyId from auth store — never blocked by GET /companies 403
  const companyId = useAuthStore((s) => s.activeCompanyId);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<AttendanceCheckInPoint | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [geoQuery, setGeoQuery] = React.useState('');
  const justPickedRef = React.useRef(false);
  const [geoLoading, setGeoLoading] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);
  const [geoSuggestions, setGeoSuggestions] = React.useState<GeocodingResult[]>([]);
  const draftRef = React.useRef(draft);
  React.useEffect(() => { draftRef.current = draft; }, [draft]);

  const reload = React.useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setListError(null);
    try {
      const data = await loadCheckInPoints(companyId);
      setCheckpoints(data.items);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'check-in-points.load');
      setListError(displayMessage);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const openCreate = React.useCallback(() => {
    setDraft({
      id: '',
      nameAr: '',
      nameEn: '',
      latitude: 24.713600,
      longitude: 46.675300,
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
    setDraft({ ...c, latitude: r6(c.latitude), longitude: r6(c.longitude) });
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
      return { ...d, latitude: r6(row.latitude), longitude: r6(row.longitude) };
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
        const center = draftRef.current ? { lat: draftRef.current.latitude, lng: draftRef.current.longitude } : { lat: 24.7136, lng: 46.6753 };
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
  }, [geoQuery, open]);

  const save = React.useCallback(async () => {
    if (!draft) return;
    const err = validateCheckpointDraft(draft);
    if (err) {
      setError(err);
      return;
    }
    if (!companyId) {
      setError('تعذر تحديد الشركة');
      return;
    }
    setError(null);
    const nameAr = draft.nameAr.trim();
    try {
      if (draft.id) {
        await updateCheckInPoint(draft.id, {
          nameAr,
          nameEn: nameAr,
          latitude: draft.latitude,
          longitude: draft.longitude,
          radiusMeters: draft.radiusMeters,
          isActive: draft.isActive,
        });
      } else {
        await createCheckInPoint({
          companyId,
          nameAr,
          nameEn: nameAr,
          latitude: draft.latitude,
          longitude: draft.longitude,
          radiusMeters: draft.radiusMeters,
          isActive: draft.isActive,
        });
      }
      await reload();
      setOpen(false);
      setDraft(null);
    } catch (apiErr) {
      const { displayMessage } = handleApiError(apiErr, 'check-in-points.save');
      setError(displayMessage);
    }
  }, [companyId, draft, reload]);

  const removeCheckpoint = React.useCallback(
    async (id: string) => {
      try {
        await deleteCheckInPoint(id);
        await reload();
      } catch (apiErr) {
        const { displayMessage } = handleApiError(apiErr, 'check-in-points.delete');
        setError(displayMessage);
      }
    },
    [reload],
  );

  const selectedPoint = selected ? checkpoints.find((p) => p.id === selected) ?? null : null;

  React.useEffect(() => {
    if (selected && !checkpoints.some((p) => p.id === selected)) setSelected(null);
  }, [checkpoints, selected]);

  return {
    checkpoints,
    loading,
    listError,
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
