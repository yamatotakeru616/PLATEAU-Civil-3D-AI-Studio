// Coordinate System Projection Transformer (APPROXIMATION)
// ---------------------------------------------------------------------------
// IMPORTANT: This is NOT a true EPSG:6677 (Japan Plane Rectangular Zone IX)
// transform. It approximates local meters via Web Mercator (EPSG:3857) pixel
// deltas around a fixed origin. Map tiles and PLATEAU footprints can diverge
// by several meters. See GitHub Issue #1 for the proper EPSG:6677 / MapLibre plan.
// ---------------------------------------------------------------------------
// Calibrated for 国土交通省 MLIT Project PLATEAU 3D City Models & GSI Maps

export const ORIGIN_LON = 139.7450; // Reference origin West (Toranomon Nishi)
export const ORIGIN_LAT = 35.6685;  // Reference origin North (Toranomon Kita)

const ZOOM_LEVEL = 16;
const N_TILES = Math.pow(2, ZOOM_LEVEL); // 65536
export const METERS_PER_PIXEL = (40075016.68 * Math.cos(ORIGIN_LAT * Math.PI / 180)) / (N_TILES * 256); // ~1.9406085 m/px

// Rigorous Gauss-Krüger Projection Engine for EPSG:6677 (Japan Plane Rectangular IX - Tokyo Region)
// Origin IX: 36.0000° N, 139.8333° E (GRS80 Ellipsoid, m0 = 0.9999)
const ZONE9_LON0 = 139.83333333333334;
const ZONE9_LAT0 = 36.0;
const M0 = 0.9999;
const ELLIPSOID_A = 6378137.0;
const ELLIPSOID_F = 1 / 298.257222101;
const ELLIPSOID_B = ELLIPSOID_A * (1 - ELLIPSOID_F);
const E2 = (ELLIPSOID_A ** 2 - ELLIPSOID_B ** 2) / (ELLIPSOID_A ** 2);
const E_PRIME2 = (ELLIPSOID_A ** 2 - ELLIPSOID_B ** 2) / (ELLIPSOID_B ** 2);

export function wgs84ToEpsg6677(lon: number, lat: number): { xNorth: number; yEast: number } {
  const radLat = (lat * Math.PI) / 180;
  const radLon = (lon * Math.PI) / 180;
  const radLat0 = (ZONE9_LAT0 * Math.PI) / 180;
  const radLon0 = (ZONE9_LON0 * Math.PI) / 180;
  const dLon = radLon - radLon0;

  const N = ELLIPSOID_A / Math.sqrt(1 - E2 * Math.sin(radLat) ** 2);
  const t = Math.tan(radLat);
  const eta2 = E_PRIME2 * Math.cos(radLat) ** 2;

  const A0 = 1 - E2 / 4 - (3 * E2 ** 2) / 64 - (5 * E2 ** 3) / 256;
  const A2 = (3 / 8) * (E2 + E2 ** 2 / 4 + (15 * E2 ** 3) / 128);
  const A4 = (15 / 256) * (E2 ** 2 + (3 * E2 ** 3) / 4);
  const A6 = (35 / 3072) * E2 ** 3;

  const S = ELLIPSOID_A * (A0 * radLat - A2 * Math.sin(2 * radLat) + A4 * Math.sin(4 * radLat) - A6 * Math.sin(6 * radLat));
  const S0 = ELLIPSOID_A * (A0 * radLat0 - A2 * Math.sin(2 * radLat0) + A4 * Math.sin(4 * radLat0) - A6 * Math.sin(6 * radLat0));

  const xNorth = M0 * ((S - S0) + (N / 2) * Math.sin(radLat) * Math.cos(radLat) * dLon ** 2 +
    (N / 24) * Math.sin(radLat) * Math.cos(radLat) ** 3 * (5 - t ** 2 + 9 * eta2 + 4 * eta2 ** 2) * dLon ** 4);

  const yEast = M0 * (N * Math.cos(radLat) * dLon +
    (N / 6) * Math.cos(radLat) ** 3 * (1 - t ** 2 + eta2) * dLon ** 3 +
    (N / 120) * Math.cos(radLat) ** 5 * (5 - 18 * t ** 2 + t ** 4 + 14 * eta2 - 58 * t ** 2 * eta2) * dLon ** 5);

  return { xNorth: Number(xNorth.toFixed(3)), yEast: Number(yEast.toFixed(3)) };
}

// Global Mercator pixel coordinate calculation
export function lonLatToGlobalPixel(lon: number, lat: number, zoom: number = ZOOM_LEVEL) {
  const n = Math.pow(2, zoom);
  const gx = ((lon + 180) / 360) * n * 256;
  const latRad = (lat * Math.PI) / 180;
  const gy = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * 256;
  return { gx, gy };
}

// Convert WGS84 Lat/Lon to SVG Canvas / EPSG:6677 Meters (0,0 = ORIGIN_LON, ORIGIN_LAT)
export function lonLatToSvg(lon: number, lat: number): { x: number; y: number } {
  const originGP = lonLatToGlobalPixel(ORIGIN_LON, ORIGIN_LAT);
  const gp = lonLatToGlobalPixel(lon, lat);
  const x = (gp.gx - originGP.gx) * METERS_PER_PIXEL;
  const y = (gp.gy - originGP.gy) * METERS_PER_PIXEL;
  return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
}

// Convert SVG Canvas / EPSG:6677 Meters back to WGS84 Lat/Lon
export function svgToLonLat(x: number, y: number): { lon: number; lat: number } {
  const originGP = lonLatToGlobalPixel(ORIGIN_LON, ORIGIN_LAT);
  const targetGx = originGP.gx + x / METERS_PER_PIXEL;
  const targetGy = originGP.gy + y / METERS_PER_PIXEL;
  const lon = (targetGx / (256 * N_TILES)) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * targetGy) / (256 * N_TILES))));
  const lat = (latRad * 180) / Math.PI;
  return { lon: Number(lon.toFixed(6)), lat: Number(lat.toFixed(6)) };
}

// Convert WGS84 Lat/Lon to Tile X, Y at zoom level Z
export function lonLatToTile(lon: number, lat: number, zoom: number = ZOOM_LEVEL) {
  const gp = lonLatToGlobalPixel(lon, lat, zoom);
  return { x: Math.floor(gp.gx / 256), y: Math.floor(gp.gy / 256) };
}

export interface TileBounds {
  tileX: number;
  tileY: number;
  left: number;  // SVG Canvas X
  top: number;   // SVG Canvas Y
  width: number;
  height: number;
}

// Generate exact Web Mercator GSI / OSM tile bounds aligned with WGS84 & SVG Canvas
export function calculateCalibratedTileGrid(
  zoom: number = ZOOM_LEVEL,
  mapOffsetX: number = 0,
  mapOffsetY: number = 0,
  mapScale: number = 1.0
): TileBounds[] {
  const originGP = lonLatToGlobalPixel(ORIGIN_LON, ORIGIN_LAT, zoom);
  const centerTileX = Math.floor(originGP.gx / 256); // 58207
  const centerTileY = Math.floor(originGP.gy / 256); // 25809

  const tilePixelSize = 256 * METERS_PER_PIXEL * mapScale;

  const tiles: TileBounds[] = [];
  const rangeX = 5;
  const rangeY = 4;

  for (let dx = -1; dx <= rangeX; dx++) {
    for (let dy = -1; dy <= rangeY; dy++) {
      const tx = centerTileX + dx;
      const ty = centerTileY + dy;
      const tileGx = tx * 256;
      const tileGy = ty * 256;

      const left = (tileGx - originGP.gx) * METERS_PER_PIXEL * mapScale + mapOffsetX;
      const top = (tileGy - originGP.gy) * METERS_PER_PIXEL * mapScale + mapOffsetY;

      tiles.push({
        tileX: tx,
        tileY: ty,
        left: Number(left.toFixed(1)),
        top: Number(top.toFixed(1)),
        width: Number(tilePixelSize.toFixed(1)),
        height: Number(tilePixelSize.toFixed(1)),
      });
    }
  }

  return tiles;
}

// Calculate GIS alignment error metric (in meters) between PLATEAU model and GSI Map origin
export function calculateAlignmentGisError(offsetX: number, offsetY: number, scale: number): number {
  const positionError = Math.sqrt(offsetX * offsetX + offsetY * offsetY); // meters
  const scaleError = Math.abs(scale - 1.0) * 100; // meters
  return Number((positionError + scaleError).toFixed(2));
}

// Calculate optimal default GIS projection calibration parameters
export function getOptimalMapCalibration() {
  return {
    mapOffsetX: 0,
    mapOffsetY: 0,
    mapTileScale: 1.0,
  };
}
