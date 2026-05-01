"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useHereMap } from "./components/useHereMap";
import { useDrawing } from "./components/useDrawing";
import { useCitySearch } from "./components/useCitySearch";
import { SidePanel } from "./components/SidePanel";
import { MapOverlays } from "./components/MapOverlays";
import { DELETE_IDLE_CURSOR, DELETE_HOVER_CURSOR } from "./components/cursors";
import { safeRequestAnimationFrame } from "./lib/safeRequestAnimationFrame";
import type { ZoneBoundary, HereMapDrawingProps } from "./types/types";

// ─────────────────────────────────────────────────────────────────────────────
// HereMapDrawing — root component
// Composes the three custom hooks and two sub-components.
// Contains no business logic — purely layout and prop wiring.
// ─────────────────────────────────────────────────────────────────────────────

export default function HereMapDrawing({
  isDark = true,
  boundary,
  onBoundaryChange,
  showToolsPanel = true,
}: HereMapDrawingProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boundaryLoadedRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const onBoundaryChangeRef = useRef(onBoundaryChange);
  useEffect(() => { onBoundaryChangeRef.current = onBoundaryChange; }, [onBoundaryChange]);

  const hereMap = useHereMap(containerRef);
  const drawing = useDrawing(hereMap);
  const search  = useCitySearch(hereMap.mapRef);

  // Load existing boundary onto map when editing
  const isLoadingBoundaryRef = useRef(false);
  useEffect(() => {
    if (!hereMap.isMapReady || !boundary?.coordinates?.[0] || boundaryLoadedRef.current) return;
    if (boundary.coordinates[0].length < 3) return;
    boundaryLoadedRef.current = true;
    isLoadingBoundaryRef.current = true;
    drawing.loadBoundary(boundary);
    safeRequestAnimationFrame(() => {
      isLoadingBoundaryRef.current = false;
    });
  }, [hereMap.isMapReady, boundary, drawing.loadBoundary]);

  const handleClearAndRedraw = useCallback(() => {
    boundaryLoadedRef.current = false;
    drawing.clearAllShapes();
    onBoundaryChangeRef.current?.(null);
  }, [drawing.clearAllShapes]);

  // Notify parent whenever shapes change (skip during initial boundary load)
  const prevGeoJsonRef = useRef(drawing.exportedGeoJson);
  useEffect(() => {
    if (prevGeoJsonRef.current === drawing.exportedGeoJson) return;
    prevGeoJsonRef.current = drawing.exportedGeoJson;
    if (isLoadingBoundaryRef.current) return;
    const newBoundary = drawing.getFirstPolygonBoundary();
    onBoundaryChangeRef.current?.(newBoundary);
  }, [drawing.exportedGeoJson, drawing.getFirstPolygonBoundary]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const map = hereMap.mapRef.current;
    if (!map) return;
    safeRequestAnimationFrame(() => {
      map.getViewPort()?.resize();
    });
  }, [isFullscreen, hereMap.mapRef]);

  const mapCursor = (() => {
    if (drawing.drawMode === "select")                                    return "grab";
    if (drawing.isSnappingToClose)                                        return "pointer";
    if (drawing.drawMode === "delete" && drawing.isHoveringShape)         return DELETE_HOVER_CURSOR;
    if (drawing.drawMode === "delete")                                    return DELETE_IDLE_CURSOR;
    return "crosshair";
  })();

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement === wrapperRef.current) {
        await document.exitFullscreen();
        return;
      }
      if (!document.fullscreenElement && wrapperRef.current) {
        await wrapperRef.current.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen API errors (e.g., browser policy)
    }
  }, []);

  return (
    <div
      ref={wrapperRef}
      dir="rtl"
      className={isFullscreen ? "flex h-screen w-screen overflow-hidden bg-black/20" : "flex h-96 w-full overflow-hidden"}
      style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}
    >
      {showToolsPanel && (
        <SidePanel
          drawMode             = {drawing.drawMode}
          setDrawMode          = {drawing.setDrawMode}
          drawingStatus        = {drawing.drawingStatus}
          savedShapeCount      = {drawing.savedShapeCount}
          isActivelyDrawing    = {drawing.isActivelyDrawing}
          placedVertexCount    = {drawing.placedVertexCount}
          isMapReady           = {hereMap.isMapReady}
          mapLoadError         = {hereMap.mapLoadError}
          searchQuery          = {search.searchQuery}
          searchResults        = {search.searchResults}
          isSearching          = {search.isSearching}
          searchErrorMessage   = {search.searchErrorMessage}
          onSearchInput        = {search.handleSearchInput}
          onSearchSelect       = {search.flyToLocation}
          onFinishShape        = {drawing.finishShape}
          onUndoVertex         = {drawing.undoLastVertex}
          onClearAllShapes     = {handleClearAndRedraw}
          isDark               = {isDark}
        />
      )}

      <main className="relative flex-1">
        <button
          type="button"
          onClick={toggleFullscreen}
          className={`absolute top-3 left-3 z-20 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
            isDark
              ? "bg-slate-800/90 text-slate-100 border-slate-600 hover:bg-slate-700"
              : "bg-white/95 text-gray-800 border-gray-300 hover:bg-gray-100"
          }`}
          title={isFullscreen ? "تصغير الخريطة" : "تكبير الخريطة"}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span>{isFullscreen ? "تصغير" : "تكبير"}</span>
        </button>
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{ userSelect: "none", cursor: mapCursor }}
        />
        <MapOverlays
          isMapReady        = {hereMap.isMapReady}
          mapLoadError      = {hereMap.mapLoadError}
          drawMode          = {drawing.drawMode}
          isActivelyDrawing = {drawing.isActivelyDrawing}
          placedVertexCount = {drawing.placedVertexCount}
          isSnappingToClose = {drawing.isSnappingToClose}
          savedShapeCount   = {drawing.savedShapeCount}
          flyingToLabel     = {search.flyingToLabel}
          isDark            = {isDark}
        />
      </main>
    </div>
  );
}
