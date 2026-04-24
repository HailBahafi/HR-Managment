'use client';

import * as React from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapPickerValue } from './map-picker';
import { Minus, Plus } from 'lucide-react';
import { Button } from './button';

// Fix default marker icons broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  value: MapPickerValue;
  onChange: (v: MapPickerValue) => void;
  minRadius: number;
  maxRadius: number;
  height: number;
  interactive: boolean;
}

function ClickHandler({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Leaflet measures the container before modals finish layout — fixes broken / offset tiles in dialogs. */
function MapResizeHandler() {
  const map = useMap();
  React.useLayoutEffect(() => {
    const fix = () => {
      map.invalidateSize({ animate: false, pan: false });
    };
    const raf = requestAnimationFrame(fix);
    const t0 = window.setTimeout(fix, 0);
    const t1 = window.setTimeout(fix, 150);
    const t2 = window.setTimeout(fix, 400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [map]);

  React.useEffect(() => {
    const el = map.getContainer()?.parentElement;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false, pan: false });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);

  return null;
}

export default function MapPickerInner({ value, onChange, minRadius, maxRadius, interactive }: Props) {
  const { latitude: lat, longitude: lng, radiusMeters } = value;

  const primaryStroke = React.useMemo(() => {
    if (typeof window === 'undefined') return 'hsl(175 55% 18%)';
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    return raw ? `hsl(${raw})` : 'hsl(175 55% 18%)';
  }, []);

  const move = React.useCallback(
    (newLat: number, newLng: number) => onChange({ ...value, latitude: newLat, longitude: newLng }),
    [onChange, value],
  );

  const adjustRadius = (delta: number) => {
    const next = Math.min(maxRadius, Math.max(minRadius, radiusMeters + delta));
    onChange({ ...value, radiusMeters: next });
  };

  return (
    <div className="relative isolate h-full min-h-0 w-full min-w-0 overflow-hidden">
      <MapContainer
        center={[lat, lng]}
        zoom={interactive ? 17 : 16}
        className="z-0 h-full w-full min-h-0 min-w-0"
        style={{ minHeight: '100%' }}
        zoomControl
        scrollWheelZoom
        dragging
        touchZoom
        doubleClickZoom={interactive}
        boxZoom={false}
        keyboard={interactive}
        key={`${lat.toFixed(4)}-${lng.toFixed(4)}-${interactive ? 'e' : 'v'}`}
      >
        <MapResizeHandler />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {interactive ? <ClickHandler onMove={move} /> : null}
        <Circle
          center={[lat, lng]}
          radius={radiusMeters}
          pathOptions={{
            color: primaryStroke,
            fillColor: primaryStroke,
            fillOpacity: 0.12,
            weight: 2,
          }}
        />
        <Marker
          position={[lat, lng]}
          draggable={interactive}
          eventHandlers={
            interactive
              ? {
                  dragend(e) {
                    const m = e.target as L.Marker;
                    const p = m.getLatLng();
                    move(p.lat, p.lng);
                  },
                }
              : undefined
          }
        />
      </MapContainer>

      {interactive ? (
        <>
          {/* Radius controls — corner of map, not center */}
          <div className="absolute bottom-3 end-3 z-[1000] flex items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-full"
              onClick={() => adjustRadius(-10)}
              aria-label="تصغير النطاق"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <div className="flex min-w-0 flex-col items-stretch">
              <input
                type="range"
                min={minRadius}
                max={maxRadius}
                step={10}
                value={radiusMeters}
                onChange={(e) => onChange({ ...value, radiusMeters: Number(e.target.value) })}
                className="h-1.5 w-full max-w-[10rem] shrink cursor-pointer accent-primary"
                aria-label="نطاق القبول"
              />
              <span className="mt-0.5 text-center font-mono text-[10px] text-muted-foreground">{radiusMeters} م</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-full"
              onClick={() => adjustRadius(10)}
              aria-label="تكبير النطاق"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="absolute start-3 top-3 z-[1000] max-w-[min(16rem,calc(100%-1.5rem))] rounded-md border border-border bg-card/90 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
            انقر على الخريطة لتحديد الموقع · اسحب الدبوس · شريط النطاق أسفل يمين الخريطة
          </div>

          <div className="absolute end-3 top-3 z-[1000] rounded-md border border-border bg-card/90 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-sm" dir="ltr">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </div>
        </>
      ) : null}
    </div>
  );
}
