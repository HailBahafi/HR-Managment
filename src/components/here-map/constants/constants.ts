import type { Tool } from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// HERE Map Drawing — constants
// ─────────────────────────────────────────────────────────────────────────────

export const HERE_CDN_BASE    = "https://js.api.here.com/v3/3.1";
export const HERE_GEOCODE_API = "https://geocode.search.hereapi.com/v1/geocode";

export const RIYADH_CENTER: H.geo.IPoint = { lat: 24.7136, lng: 46.6753 };
export const INITIAL_ZOOM = 12;

/** Snap threshold: pixels within which cursor locks to the first pin. */
export const SNAP_THRESHOLD_PX = 18;

/** Minimum required vertices before a multi-click shape can be closed. */
export const MIN_VERTICES_TO_CLOSE: Record<"line" | "polygon" | "ellipse", number> = {
  line:    2,
  polygon: 3,
  ellipse: 3,
};

export const SEARCH_DEBOUNCE_MS    = 450;
export const FLY_ZOOM_OUT_LEVEL    = 5;
export const FLY_DESTINATION_ZOOM  = 14;

/** Modes that use the multi-click (vertex stack) drawing flow. */
export const MULTI_CLICK_MODES = new Set<import("../types/types").DrawMode>(["polygon", "ellipse", "line"]);

// ─── Map spatial style tokens ─────────────────────────────────────────────────

export const FINAL_SHAPE_STYLE: H.map.SpatialStyle.Options = {
  fillColor:   "rgba(37,99,235,0.22)",
  strokeColor: "#2563eb",
  lineWidth:   2,
};

export const PREVIEW_SHAPE_STYLE: H.map.SpatialStyle.Options = {
  fillColor:   "rgba(37,99,235,0.08)",
  strokeColor: "#60a5fa",
  lineWidth:   1.5,
  lineDash:    [5, 5],
};

export const RUBBER_BAND_STYLE: H.map.SpatialStyle.Options = {
  fillColor:   "rgba(0,0,0,0)",
  strokeColor: "#60a5fa",
  lineWidth:   1.5,
  lineDash:    [5, 5],
};

export const SNAP_HIGHLIGHT_STYLE: H.map.SpatialStyle.Options = {
  fillColor:   "rgba(34,197,94,0.15)",
  strokeColor: "#22c55e",
  lineWidth:   2,
  lineDash:    [5, 5],
};

export const CLOSING_HINT_STYLE: H.map.SpatialStyle.Options = {
  ...RUBBER_BAND_STYLE,
  strokeColor: "rgba(96,165,250,0.3)",
};

// ─── Tool catalogue ───────────────────────────────────────────────────────────

export const TOOLS: readonly Tool[] = [
  { mode: "select",    labelAr: "تحديد",    icon: "↖", descriptionAr: "تحريك وتكبير الخريطة",                   group: "action" },
  { mode: "line",      labelAr: "خط مغلق",   icon: "╱", descriptionAr: "انقر لرسم قطع · كليك يمين للإغلاق",       group: "draw"   },
  { mode: "polygon",   labelAr: "مضلع",      icon: "⬠", descriptionAr: "انقر لإضافة رؤوس · كليك يمين للإغلاق",   group: "draw"   },
  { mode: "circle",    labelAr: "دائرة",     icon: "◯", descriptionAr: "انقر المركز ثم نقطة نصف القطر",            group: "draw"   },
  { mode: "rectangle", labelAr: "مستطيل",    icon: "▭", descriptionAr: "انقر الزاوية الأولى ثم المقابلة",         group: "draw"   },
  { mode: "ellipse",   labelAr: "بيضاوي",    icon: "⬭", descriptionAr: "٣ نقرات: المركز، المحور الكبير، الصغير",  group: "draw"   },
  { mode: "arrow",     labelAr: "سهم",       icon: "→", descriptionAr: "انقر الذيل ثم الرأس",                     group: "draw"   },
  { mode: "delete",    labelAr: "حذف",       icon: "✕", descriptionAr: "انقر على شكل لحذفه",                      group: "action" },
];
