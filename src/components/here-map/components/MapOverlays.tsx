"use client";

import { MULTI_CLICK_MODES } from "../constants/constants";
import type { MapOverlaysProps } from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// MapOverlays — all floating UI elements rendered over the map canvas
// ─────────────────────────────────────────────────────────────────────────────

export function MapOverlays({
  isMapReady, mapLoadError, drawMode, isActivelyDrawing,
  placedVertexCount, isSnappingToClose, savedShapeCount, flyingToLabel,
  isDark = true,
}: MapOverlaysProps) {
  const isMultiClickMode = MULTI_CLICK_MODES.has(drawMode);

  return (
    <>
      {/* Fly-to cinematic overlay */}
      {flyingToLabel && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
            }}
          />
          <div
            className="relative flex flex-col items-center gap-3"
            style={{ animation: "flyIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
          >
            <div className="relative flex items-center justify-center">
              <div
                className="absolute w-16 h-16 rounded-full border-2 border-blue-400/60"
                style={{ animation: "pulseRing 1s cubic-bezier(0,0,0.2,1) infinite" }}
              />
              <div
                className="absolute w-10 h-10 rounded-full border border-blue-400/40"
                style={{ animation: "pulseRing 1s cubic-bezier(0,0,0.2,1) infinite 0.3s" }}
              />
              <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/50 flex items-center justify-center text-sm">
                📍
              </div>
            </div>
            <div
              className={`backdrop-blur-md border rounded-xl px-5 py-2.5 shadow-2xl text-center ${
                isDark
                  ? "bg-slate-900/90 border-slate-600"
                  : "bg-white/95 border-gray-300"
              }`}
              style={{ animation: "slideUp 0.5s 0.1s ease both" }}
            >
              <p className={`text-[10px] mb-0.5 ${isDark ? "text-slate-400" : "text-gray-500"}`}>جارٍ الانتقال إلى</p>
              <p className={`text-sm font-semibold leading-snug max-w-[220px] ${isDark ? "text-white" : "text-gray-900"}`}>
                {flyingToLabel}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Snap-to-close badge */}
      {isSnappingToClose && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className={`rounded-full border backdrop-blur-sm px-3 py-1 text-[11px] font-semibold shadow-lg ${
            isDark
              ? "border-green-500 bg-green-900/80 text-green-300"
              : "border-green-600 bg-green-100 text-green-800"
          }`}>
            🔗 انقر للإغلاق
          </div>
        </div>
      )}

      {/* Drawing keyboard hint toast */}
      {isMultiClickMode && isActivelyDrawing && !isSnappingToClose && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className={`flex items-center gap-3 rounded-xl border backdrop-blur-sm px-4 py-2.5 shadow-2xl text-xs ${
            isDark
              ? "border-slate-600 bg-slate-900/90 text-slate-200"
              : "border-gray-300 bg-white/95 text-gray-700"
          }`}>
            <span className={`font-semibold ${isDark ? "text-amber-400" : "text-amber-600"}`}>{placedVertexCount} نقطة</span>
            <span className={`w-px h-4 ${isDark ? "bg-slate-600" : "bg-gray-300"}`} />
            <span className="text-[8.5px]">
              <kbd className={`border rounded px-1.5 py-0.5 ${
                isDark
                  ? "bg-slate-700 border-slate-500"
                  : "bg-gray-100 border-gray-300"
              }`}>Enter</kbd>
              {" "}أو{" "}
              <kbd className={`border rounded px-1.5 py-0.5 ${
                isDark
                  ? "bg-slate-700 border-slate-500"
                  : "bg-gray-100 border-gray-300"
              }`}>كليك يمين</kbd>
              {" "}للإنهاء
            </span>
          </div>
        </div>
      )}

      {/* First-point hint */}
      {isMultiClickMode && !isActivelyDrawing && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className={`rounded-xl border backdrop-blur-sm px-4 py-2 shadow-xl text-[11px] ${
            isDark
              ? "border-slate-700 bg-slate-900/80 text-slate-400"
              : "border-gray-300 bg-white/90 text-gray-600"
          }`}>
            انقر على الخريطة لوضع أول نقطة
          </div>
        </div>
      )}

      {/* Loading screen */}
      {!isMapReady && !mapLoadError && (
        <div className={`absolute inset-0 flex items-center justify-center text-sm pointer-events-none ${
          isDark ? "bg-slate-900/80 text-slate-300" : "bg-white/90 text-gray-600"
        }`}>
          جار تهيئة الخريطة…
        </div>
      )}

      {/* Error screen */}
      {mapLoadError && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center pointer-events-none ${
            isDark ? "bg-slate-900/90 text-red-400" : "bg-white/95 text-red-600"
          }`}
          role="alert"
        >
          <span className="text-3xl" aria-hidden="true">⚠</span>
          <p className="text-sm font-semibold">فشل تحميل HERE Maps</p>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>{mapLoadError}</p>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-gray-500"}`}>
            تأكد من إعداد{" "}
            <code className={`px-1 rounded ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>NEXT_PUBLIC_HERE_API_KEY</code>
            {" "}في{" "}
            <code className={`px-1 rounded ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>.env.local</code>
          </p>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes flyIn {
          from { opacity: 0; transform: scale(0.7) translateY(20px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);    }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes pulseRing {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </>
  );
}
