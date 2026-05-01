import { SNAP_THRESHOLD_PX } from "../constants/constants";

// ─────────────────────────────────────────────────────────────────────────────
// Pure geometry utilities  (all HERE runtime calls are deferred — only called
// inside event handlers that fire AFTER the CDN scripts have loaded)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Geodesic distance in metres between two lat/lng points.
 */
export function geodesicDistance(from: H.geo.IPoint, to: H.geo.IPoint): number {
  return new H.geo.Point(from.lat, from.lng).distance(
    new H.geo.Point(to.lat, to.lng),
  );
}

/**
 * Builds a HERE LineString from an array of lat/lng points.
 * Pass `close = true` to append a copy of the first point at the end,
 * creating a closed ring suitable for polygons.
 */
export function buildLineString(
  points: H.geo.IPoint[],
  close = false,
): H.geo.LineString {
  const lineString = new H.geo.LineString();
  for (const point of points) {
    lineString.pushLatLngAlt(point.lat, point.lng, 0);
  }
  if (close && points.length > 0) {
    lineString.pushLatLngAlt(points[0].lat, points[0].lng, 0);
  }
  return lineString;
}

/**
 * Approximates an ellipse as a 64-segment polygon.
 */
export function buildEllipsePolygon(
  centre: H.geo.IPoint,
  semiMajor: number,
  semiMinor: number,
  rotationDeg: number,
  segmentCount = 64,
): H.map.Polygon {
  const EARTH_RADIUS_METRES = 6_371_000;
  const rotationRad    = (rotationDeg * Math.PI) / 180;
  const centreLatRad   = (centre.lat  * Math.PI) / 180;
  const centreLngRad   = (centre.lng  * Math.PI) / 180;
  const radToDeg       = 180 / Math.PI;

  const ring = new H.geo.LineString();
  for (let step = 0; step <= segmentCount; step++) {
    const angle = (2 * Math.PI * step) / segmentCount;

    const eastLocal  = semiMajor * Math.cos(angle);
    const northLocal = semiMinor * Math.sin(angle);

    const eastRotated  = eastLocal  * Math.cos(rotationRad) - northLocal * Math.sin(rotationRad);
    const northRotated = eastLocal  * Math.sin(rotationRad) + northLocal * Math.cos(rotationRad);

    const latDelta = (northRotated / EARTH_RADIUS_METRES) * radToDeg;
    const lngDelta = (eastRotated  / (EARTH_RADIUS_METRES * Math.cos(centreLatRad))) * radToDeg;

    ring.pushLatLngAlt(
      centreLatRad * radToDeg + latDelta,
      centreLngRad * radToDeg + lngDelta,
      0,
    );
  }
  return new H.map.Polygon(new H.geo.Polygon(ring));
}

/**
 * Builds a filled arrowhead polygon for the tip of an arrow shape.
 */
export function buildArrowHead(
  shaftStart: H.geo.IPoint,
  shaftTip: H.geo.IPoint,
): H.map.Polygon {
  const EARTH_RADIUS_METRES = 6_371_000;
  const WING_ANGLE_RAD      = (35 * Math.PI) / 180;
  const HEAD_SHAFT_RATIO    = 0.14;
  const radToDeg            = 180 / Math.PI;

  const bearingRad  = Math.atan2(
    shaftTip.lng - shaftStart.lng,
    shaftTip.lat - shaftStart.lat,
  );
  const headLength = geodesicDistance(shaftStart, shaftTip) * HEAD_SHAFT_RATIO;
  const tipLatRad  = (shaftTip.lat * Math.PI) / 180;

  const wingPoint = (side: 1 | -1): H.geo.IPoint => {
    const wingBearing = bearingRad + Math.PI + side * WING_ANGLE_RAD;
    const latOffset   = (headLength * Math.cos(wingBearing)) / EARTH_RADIUS_METRES;
    const lngOffset   = (headLength * Math.sin(wingBearing)) /
                        (EARTH_RADIUS_METRES * Math.cos(tipLatRad));
    return {
      lat: shaftTip.lat + latOffset * radToDeg,
      lng: shaftTip.lng + lngOffset * radToDeg,
    };
  };

  return new H.map.Polygon(
    new H.geo.Polygon(
      buildLineString([shaftTip, wingPoint(1), wingPoint(-1), shaftTip]),
    ),
    { style: { fillColor: "#2563eb", strokeColor: "#1d4ed8", lineWidth: 1 } },
  );
}

/**
 * Returns true when the given viewport (screen) coordinates are within
 * SNAP_THRESHOLD_PX pixels of the provided geographic point, projected to screen.
 */
export function isCursorNearPin(
  map: H.Map,
  pin: H.geo.IPoint,
  screenX: number,
  screenY: number,
): boolean {
  const pinOnScreen = map.geoToScreen(pin);
  if (!pinOnScreen) return false;
  const deltaX = screenX - pinOnScreen.x;
  const deltaY = screenY - pinOnScreen.y;
  return Math.hypot(deltaX, deltaY) <= SNAP_THRESHOLD_PX;
}

/**
 * Creates a HERE DomIcon for an anchor pin.
 */
export function createPinIcon(isSnapTarget = false): H.map.DomIcon {
  const dot = document.createElement("div");
  dot.style.cssText = isSnapTarget
    ? "width:16px;height:16px;border-radius:50%;background:#22c55e;border:2px solid #fff;" +
      "box-shadow:0 0 0 3px #22c55e;transform:translate(-50%,-50%);transition:all 0.1s"
    : "width:12px;height:12px;border-radius:50%;background:#f59e0b;border:2px solid #fff;" +
      "box-shadow:0 0 0 2px #f59e0b;transform:translate(-50%,-50%)";
  return new H.map.DomIcon(dot);
}
