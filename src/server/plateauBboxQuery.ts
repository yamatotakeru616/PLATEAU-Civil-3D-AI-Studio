/**
 * Real PLATEAU building query by BBox (Phase 1)
 * --------------------------------------------------------------------------
 * Source: Tokyo 23-ku Building MVT derived from official PLATEAU CityGML
 * (LOD0 roof edge / measuredHeight) — indigo-lab open dataset.
 * City code 13103 = Minato-ku is included.
 *
 * Tile URL:
 *   https://indigo-lab.github.io/plateau-tokyo23ku-building-mvt-2020/{z}/{x}/{y}.pbf
 *
 * Falls back to local mock data when tiles cannot be fetched.
 */
import { createRequire } from 'module';
import { lonLatToSvg } from '../utils/gisProjection';
import {
  queryPlateauFeaturesByBBox as queryMockBBox,
} from '../data/plateauRealData';
import type { PlateauBuilding, PlateauFeature } from '../types/civil';

const require = createRequire(import.meta.url);
const Pbf = require('pbf');
const { VectorTile } = require('@mapbox/vector-tile');

const MVT_BASE =
  'https://indigo-lab.github.io/plateau-tokyo23ku-building-mvt-2020';
const DEFAULT_ZOOM = 16;
const MAX_FEATURES = 800;
const TILE_FETCH_TIMEOUT_MS = 8000;

export interface PlateauBBoxQueryResult {
  buildings: PlateauBuilding[];
  features: PlateauFeature[];
  counts: { bldg: number; tran: number; wtr: number; rwy: number };
  bbox: { minLon: number; minLat: number; maxLon: number; maxLat: number };
  source: 'plateau-mvt' | 'mock-fallback';
  tileCount: number;
}

function lonLatToTile(lon: number, lat: number, zoom: number) {
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

function tilesForBBox(
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number,
  zoom: number
) {
  const a = lonLatToTile(minLon, maxLat, zoom);
  const b = lonLatToTile(maxLon, minLat, zoom);
  const tiles: Array<{ x: number; y: number; z: number }> = [];
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  const y0 = Math.min(a.y, b.y);
  const y1 = Math.max(a.y, b.y);
  const maxSpan = 6;
  const cx1 = Math.min(x1, x0 + maxSpan);
  const cy1 = Math.min(y1, y0 + maxSpan);
  for (let x = x0; x <= cx1; x++) {
    for (let y = y0; y <= cy1; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  return tiles;
}

async function fetchTile(z: number, x: number, y: number): Promise<Buffer | null> {
  const url = `${MVT_BASE}/${z}/${x}/${y}.pbf`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TILE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'PLATEAU-Civil-3D-AI-Studio/1.0' },
    });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function ringCentroid(ring: number[][]): { lon: number; lat: number } {
  let sx = 0;
  let sy = 0;
  const n = ring.length || 1;
  for (const p of ring) {
    sx += p[0];
    sy += p[1];
  }
  return { lon: sx / n, lat: sy / n };
}

function bboxOfRing(ring: number[][]) {
  let minLon = Infinity,
    minLat = Infinity,
    maxLon = -Infinity,
    maxLat = -Infinity;
  for (const [lon, lat] of ring) {
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLon, minLat, maxLon, maxLat };
}

function intersectsBBox(
  a: { minLon: number; minLat: number; maxLon: number; maxLat: number },
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number
) {
  return !(a.maxLon < minLon || a.minLon > maxLon || a.maxLat < minLat || a.minLat > maxLat);
}

function haversineMeters(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number
): number {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLon = toR(lon2 - lon1);
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(aa));
}

type GjGeometry = {
  type: string;
  coordinates: any;
};

function featureFromMvt(
  props: Record<string, unknown>,
  geometry: GjGeometry,
  queryMinLon: number,
  queryMinLat: number,
  queryMaxLon: number,
  queryMaxLat: number
): { building: PlateauBuilding; feature: PlateauFeature } | null {
  let ring: number[][] | null = null;
  if (geometry.type === 'Polygon') {
    ring = geometry.coordinates[0] as number[][];
  } else if (geometry.type === 'MultiPolygon') {
    ring = (geometry.coordinates[0]?.[0] as number[][]) || null;
  }
  if (!ring || ring.length < 3) return null;

  const bb = bboxOfRing(ring);
  if (!intersectsBBox(bb, queryMinLon, queryMinLat, queryMaxLon, queryMaxLat)) {
    return null;
  }

  const { lon, lat } = ringCentroid(ring);
  const height = Number(props.measuredHeight ?? props.height ?? 10) || 10;
  const area = Number(props.buildingRoofEdgeArea ?? 0) || 0;
  const side = area > 0 ? Math.sqrt(area) : 12;
  const id =
    String(props['建物ID'] || props.buildingId || props.id || `bldg-${lon.toFixed(5)}-${lat.toFixed(5)}`);
  const cityCode = id.startsWith('13103')
    ? '13103'
    : String(props['13_区市町村コード_大字・町コード_町・丁目コード'] || '').slice(0, 5) ||
      '13100';

  const { x, y } = lonLatToSvg(lon, lat);
  const footprintSvg = ring.map(([rlon, rlat]) => {
    const p = lonLatToSvg(rlon, rlat);
    return { x: p.x, y: p.y };
  });

  const width = Math.max(4, haversineMeters(bb.minLon, lat, bb.maxLon, lat) || side);
  const length = Math.max(4, haversineMeters(lon, bb.minLat, lon, bb.maxLat) || side);
  const floors = Math.max(1, Math.round(height / 3.2));
  const severity: PlateauBuilding['severity'] =
    height >= 100 ? 'critical' : height >= 40 ? 'major' : 'minor';

  const building: PlateauBuilding = {
    id,
    name: id,
    usage: '建築物 (PLATEAU LOD0/1)',
    height,
    floors,
    x,
    y,
    width,
    length,
    severity,
    lat,
    lon,
    gmlId: id,
    cityCode,
    address: cityCode === '13103' ? '東京都港区' : '東京都',
  };

  const feature: PlateauFeature = {
    id,
    name: id,
    category: 'bldg',
    categoryLabel: '建物 (bldg)',
    lod: 'LOD1',
    x,
    y,
    z: 0,
    width,
    length,
    height,
    shapePoints: footprintSvg,
    severity,
    lat,
    lon,
    gmlId: id,
    cityCode,
    address: building.address,
    details: `PLATEAU実データ ${id} / 高さ:${height}m / 面積:${area ? area.toFixed(1) : '?'}m² / source:tokyo23ku-mvt`,
  };

  return { building, feature };
}

export async function queryRealPlateauBuildingsByBBox(
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number
): Promise<PlateauBBoxQueryResult> {
  const l0 = Math.min(minLon, maxLon);
  const l1 = Math.max(minLon, maxLon);
  const a0 = Math.min(minLat, maxLat);
  const a1 = Math.max(minLat, maxLat);

  const tiles = tilesForBBox(l0, a0, l1, a1, DEFAULT_ZOOM);
  const buffers = await Promise.all(tiles.map((t) => fetchTile(t.z, t.x, t.y)));

  const byId = new Map<string, { building: PlateauBuilding; feature: PlateauFeature }>();
  let loadedTiles = 0;

  for (let i = 0; i < tiles.length; i++) {
    const buf = buffers[i];
    if (!buf || buf.length < 2) continue;
    loadedTiles++;
    try {
      const tile = new VectorTile(new Pbf(buf));
      const layer = tile.layers['bldg'] || tile.layers[Object.keys(tile.layers)[0]];
      if (!layer) continue;
      for (let fi = 0; fi < layer.length; fi++) {
        if (byId.size >= MAX_FEATURES) break;
        const f = layer.feature(fi);
        const gj = f.toGeoJSON(tiles[i].x, tiles[i].y, tiles[i].z) as {
          geometry?: GjGeometry;
          properties?: Record<string, unknown>;
        };
        if (!gj.geometry) continue;
        const converted = featureFromMvt(
          (gj.properties || {}) as Record<string, unknown>,
          gj.geometry,
          l0,
          a0,
          l1,
          a1
        );
        if (converted) {
          byId.set(converted.feature.id, converted);
        }
      }
    } catch (err) {
      console.warn('[plateau-mvt] tile decode failed', tiles[i], err);
    }
  }

  if (byId.size === 0) {
    const mock = queryMockBBox(l0, a0, l1, a1);
    return {
      ...mock,
      source: 'mock-fallback',
      tileCount: loadedTiles,
    };
  }

  const buildings = Array.from(byId.values()).map((v) => v.building);
  const features = Array.from(byId.values()).map((v) => v.feature);

  return {
    buildings,
    features,
    counts: {
      bldg: features.length,
      tran: 0,
      wtr: 0,
      rwy: 0,
    },
    bbox: { minLon: l0, minLat: a0, maxLon: l1, maxLat: a1 },
    source: 'plateau-mvt',
    tileCount: loadedTiles,
  };
}
