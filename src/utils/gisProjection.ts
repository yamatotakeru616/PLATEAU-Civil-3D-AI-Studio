// Coordinate System Projection Transformer (APPROXIMATION)
// ---------------------------------------------------------------------------
// IMPORTANT: This is NOT a true EPSG:6677 (Japan Plane Rectangular Zone IX)
// transform. It approximates local meters via Web Mercator (EPSG:3857) pixel
// deltas around a fixed origin. Map tiles and PLATEAU footprints can diverge
// by several meters. See GitHub Issue #1 for the proper EPSG:6677 / MapLibre plan.
// ---------------------------------------------------------------------------
// Calibrated for 国土交通省 MLIT Project PLATEAU 3D City Models & GSI Maps (demo)

export const ORIGIN_LON = 139.7450; // Reference origin West (Toranomon Nishi)
export const ORIGIN_LAT = 35.6685;  // Reference origin North (Toranomon Kita)

const ZOOM_LEVEL = 16;
const N_TILES = Math.pow(2, ZOOM_LEVEL); // 65536
export const METERS_PER_PIXEL = (40075016.68 * Math.cos(ORIGIN_LAT * Math.PI / 180)) / (N_TILES * 256); // ~1.9406085 m/px

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
