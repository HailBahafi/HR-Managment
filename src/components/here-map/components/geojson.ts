import type { ShapeMeta } from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// GeoJSON builder
// ─────────────────────────────────────────────────────────────────────────────

function hereLineStringToGeoJsonRing(lineString: any): number[][] {
  const ring: number[][] = [];
  lineString.eachLatLngAlt((lat: number, lng: number) => ring.push([lng, lat]));
  return ring;
}

const CIRCLE_SEGMENTS = 64;
const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS = 6371000;

function circleToPolygonRing(
  center: { lat: number; lng: number },
  radiusMetres: number,
): number[][] {
  const ring: number[][] = [];
  const latRad = center.lat * DEG_TO_RAD;
  const lngRad = center.lng * DEG_TO_RAD;
  const angularRadius = radiusMetres / EARTH_RADIUS;

  for (let i = 0; i <= CIRCLE_SEGMENTS; i++) {
    const bearing = (2 * Math.PI * i) / CIRCLE_SEGMENTS;
    const pLat = Math.asin(
      Math.sin(latRad) * Math.cos(angularRadius) +
      Math.cos(latRad) * Math.sin(angularRadius) * Math.cos(bearing),
    );
    const pLng = lngRad + Math.atan2(
      Math.sin(bearing) * Math.sin(angularRadius) * Math.cos(latRad),
      Math.cos(angularRadius) - Math.sin(latRad) * Math.sin(pLat),
    );
    ring.push([pLng / DEG_TO_RAD, pLat / DEG_TO_RAD]);
  }
  return ring;
}

/**
 * Builds a GeoJSON FeatureCollection from the current list of committed shapes.
 * All polygon coordinates are ordered [lng, lat] as required by GeoJSON spec.
 */
export function buildGeoJsonCollection(shapes: ShapeMeta[]): string {
  const features = shapes.map((meta) => {
    const { id, type, mapObject } = meta;

    if (type === "circle") {
      const circle = mapObject as any;
      const center = circle.getCenter();
      const ring = circleToPolygonRing(center, circle.getRadius());
      return {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [ring],
        },
        properties: { id, shape: "circle", radiusMetres: circle.getRadius() },
      };
    }

    if (type === "arrow") {
      const polyline = mapObject as any;
      const ring = hereLineStringToGeoJsonRing(
        polyline.getGeometry() as any,
      );
      return {
        type: "Feature" as const,
        geometry: { type: "LineString" as const, coordinates: ring },
        properties: { id, shape: "arrow" },
      };
    }

    if (type === "line") {
      const polyline = mapObject as any;
      const ring = hereLineStringToGeoJsonRing(
        polyline.getGeometry() as any,
      );
      return {
        type: "Feature" as const,
        geometry: { type: "Polygon" as const, coordinates: [ring] },
        properties: { id, shape: "line-area" },
      };
    }

    // polygon, rectangle, ellipse → H.map.Polygon
    const polygon = mapObject as any;
    const exterior = (polygon.getGeometry() as any).getExterior();
    const ring = hereLineStringToGeoJsonRing(exterior);
    if (ring.length > 0) ring.push(ring[0]);
    return {
      type: "Feature" as const,
      geometry: { type: "Polygon" as const, coordinates: [ring] },
      properties: { id, shape: type },
    };
  });

  return JSON.stringify({ type: "FeatureCollection", features }, null, 2);
}
