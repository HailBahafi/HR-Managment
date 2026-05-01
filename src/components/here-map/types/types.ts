import type { RefObject } from "react";


// feature-local types that reference `H.*`.

// ─────────────────────────────────────────────────────────────────────────────
// HERE Map Drawing — shared types
// ─────────────────────────────────────────────────────────────────────────────

export type DrawMode =
  | "select"
  | "polygon"
  | "rectangle"
  | "circle"
  | "ellipse"
  | "line"
  | "arrow"
  | "delete";

/** Every drawable shape type – the subset of DrawMode that produces map objects. */
export type ShapeType = Exclude<DrawMode, "select" | "delete">;

export interface ShapeMeta {
  readonly id: string;
  readonly type: ShapeType;
  readonly mapObject: H.map.Object;
}

export interface Tool {
  readonly mode: DrawMode;
  readonly labelAr: string;
  readonly icon: string;
  readonly descriptionAr: string;
  readonly group: "draw" | "action";
}

export interface GeocodingResult {
  readonly title: string;
  readonly latitude: number;
  readonly longitude: number;
}

/** Raw shape of one item returned by HERE Geocoding REST API v1. */
export interface HereGeocodeItem {
  title: string;
  position: { lat: number; lng: number };
}

export interface ZoneBoundary {
  type: "Polygon";
  coordinates: number[][][];
}

export interface DrawingState {
  drawMode: DrawMode;
  setDrawMode: (mode: DrawMode) => void;
  drawingStatus: string;
  savedShapeCount: number;
  exportedGeoJson: string | null;
  isActivelyDrawing: boolean;
  placedVertexCount: number;
  isSnappingToClose: boolean;
  isHoveringShape: boolean;
  finishShape: () => void;
  undoLastVertex: () => void;
  loadBoundary: (boundary: ZoneBoundary) => void;
  clearAllShapes: () => void;
  getFirstPolygonBoundary: () => ZoneBoundary | null;
}

export interface CitySearchState {
  searchQuery: string;
  searchResults: GeocodingResult[];
  isSearching: boolean;
  searchErrorMessage: string | null;
  flyingToLabel: string | null;
  handleSearchInput: (query: string) => void;
  flyToLocation: (result: GeocodingResult) => void;
}

export interface HereMapRefs {
  mapRef: RefObject<H.Map | null>;
  behaviorRef: RefObject<H.mapevents.Behavior | null>;
  finalGroupRef: RefObject<H.map.Group | null>;
  previewGroupRef: RefObject<H.map.Group | null>;
  pinGroupRef: RefObject<H.map.Group | null>;
  containerRef: RefObject<HTMLDivElement | null>;
}

export interface HereMapState {
  isMapReady: boolean;
  mapLoadError: string | null;
}

// Component Props Interfaces
export interface HereMapDrawingProps {
  isDark?: boolean;
  boundary?: ZoneBoundary | null;
  onBoundaryChange?: (boundary: ZoneBoundary | null) => void;
  /** When false, the drawing/search side strip is hidden (map only). Default true. */
  showToolsPanel?: boolean;
}

export interface MapOverlaysProps {
  isMapReady: boolean;
  mapLoadError: string | null;
  drawMode: DrawMode;
  isActivelyDrawing: boolean;
  placedVertexCount: number;
  isSnappingToClose: boolean;
  savedShapeCount: number;
  flyingToLabel: string | null;
  isDark: boolean;
}

export interface ToolButtonProps {
  tool: Tool;
  isActive: boolean;
  onClick: () => void;
  isDark?: boolean;
}

export interface SidePanelProps {
  drawMode: DrawMode;
  setDrawMode: (mode: DrawMode) => void;
  drawingStatus: string;
  savedShapeCount: number;
  isActivelyDrawing: boolean;
  placedVertexCount: number;
  isMapReady: boolean;
  mapLoadError: string | null;
  searchQuery: string;
  searchResults: GeocodingResult[];
  isSearching: boolean;
  searchErrorMessage: string | null;
  onSearchInput: (query: string) => void;
  onSearchSelect: (result: GeocodingResult) => void;
  onFinishShape: () => void;
  onUndoVertex: () => void;
  onClearAllShapes?: () => void;
  isDark?: boolean;
}
