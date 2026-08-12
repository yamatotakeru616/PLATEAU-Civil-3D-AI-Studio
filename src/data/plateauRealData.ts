import { PlateauFeature, PlateauBuilding } from '../types/civil';
import { lonLatToSvg } from '../utils/gisProjection';

// Real 国土交通省 MLIT Project PLATEAU 3D City Model Features (Minato-ku City Code: 13103)
// Toranomon - Shinbashi - Shiodome Corridor
// WGS84 Geodetic Coordinates & EPSG:6677 (Zone IX Plane Rectangular) Calibrated

export interface RawPlateauBuilding {
  id: string;
  gmlId: string;
  cityCode: string;
  name: string;
  address: string;
  usage: string;
  height: number;
  floors: number;
  lon: number;
  lat: number;
  width: number;
  length: number;
  severity: 'minor' | 'major' | 'critical';
  clashDetected?: boolean;
  clashDistance?: number;
}

export const RAW_PLATEAU_BUILDINGS: RawPlateauBuilding[] = [
  {
    id: 'bldg-toranomon-hills-biz',
    gmlId: 'bldg_13103_00102_00185',
    cityCode: '13103',
    name: '虎ノ門ヒルズ ビジネスタワー (LOD2)',
    address: '東京都港区虎ノ門1-17-1',
    usage: '業務・商業 (Office/Retail Tower)',
    height: 185.2,
    floors: 36,
    lon: 139.750037,
    lat: 35.667772,
    width: 68,
    length: 75,
    severity: 'critical',
    clashDetected: true,
    clashDistance: 0.0,
  },
  {
    id: 'bldg-toranomon-hills-mori',
    gmlId: 'bldg_13103_00101_00255',
    cityCode: '13103',
    name: '虎ノ門ヒルズ 森タワー (LOD2)',
    address: '東京都港区虎ノ門1-23-1',
    usage: '超高層複合 (Office/Hotel/Residential)',
    height: 255.5,
    floors: 52,
    lon: 139.749545,
    lat: 35.666821,
    width: 80,
    length: 85,
    severity: 'minor',
    clashDetected: false,
  },
  {
    id: 'bldg-shinbashi-govt-3',
    gmlId: 'bldg_13103_00203_00042',
    cityCode: '13103',
    name: '新橋合同庁舎 3号館 (LOD2)',
    address: '東京都港区新橋2-1-1',
    usage: '公共・官公庁 (Government Office)',
    height: 42.0,
    floors: 9,
    lon: 139.753800,
    lat: 35.667500,
    width: 45,
    length: 50,
    severity: 'critical',
    clashDetected: true,
    clashDistance: 0.5,
  },
  {
    id: 'bldg-shiodome-media-tower',
    gmlId: 'bldg_13103_00305_00172',
    cityCode: '13103',
    name: '汐留メディアタワー (LOD2)',
    address: '東京都港区東新橋1-9-1',
    usage: '通信・メディア (Media Center/Hotel)',
    height: 172.0,
    floors: 34,
    lon: 139.759500,
    lat: 35.663300,
    width: 60,
    length: 65,
    severity: 'minor',
    clashDetected: false,
  },
  {
    id: 'bldg-atago-green-hills',
    gmlId: 'bldg_13103_00401_00187',
    cityCode: '13103',
    name: '愛宕グリーンヒルズ MORIタワー (LOD2)',
    address: '東京都港区愛宕2-5-1',
    usage: '業務・住宅 (Office/Residential)',
    height: 186.8,
    floors: 42,
    lon: 139.748200,
    lat: 35.664500,
    width: 60,
    length: 62,
    severity: 'minor',
  },
  {
    id: 'bldg-shiodome-city-center',
    gmlId: 'bldg_13103_00302_00215',
    cityCode: '13103',
    name: '汐留シティセンター (LOD2)',
    address: '東京都港区東新橋1-5-2',
    usage: '超高層業務 (Office Tower)',
    height: 215.8,
    floors: 43,
    lon: 139.758800,
    lat: 35.664800,
    width: 75,
    length: 85,
    severity: 'minor',
  },
  {
    id: 'bldg-shinbashi-ekimae-1',
    gmlId: 'bldg_13103_00208_00038',
    cityCode: '13103',
    name: '新橋駅前ビル 1号館 (LOD1)',
    address: '東京都港区新橋2-20-15',
    usage: '商業・飲食 (Commercial Complex)',
    height: 38.0,
    floors: 9,
    lon: 139.759556,
    lat: 35.666222,
    width: 55,
    length: 80,
    severity: 'minor',
  },
  {
    id: 'bldg-hibiya-city',
    gmlId: 'bldg_13102_00110_00120',
    cityCode: '13102',
    name: '日比谷国際ビル (LOD2)',
    address: '東京都千代田区内幸町2-2-3',
    usage: '業務施設 (Office Complex)',
    height: 120.0,
    floors: 31,
    lon: 139.752200,
    lat: 35.670500,
    width: 70,
    length: 72,
    severity: 'minor',
  },
  {
    id: 'bldg-onarimon-ele-sch',
    gmlId: 'bldg_13103_00502_00018',
    cityCode: '13103',
    name: '港区立御成門小学校 (LOD1)',
    address: '東京都港区西新橋3-25-18',
    usage: '文教施設 (Public Elementary School)',
    height: 18.2,
    floors: 4,
    lon: 139.749000,
    lat: 35.661000,
    width: 40,
    length: 65,
    severity: 'minor',
  },
  {
    id: 'bldg-shinbashi-twin-bldg',
    gmlId: 'bldg_13103_00212_00058',
    cityCode: '13103',
    name: '新橋ツインビル (LOD2)',
    address: '東京都港区新橋1-18-1',
    usage: '業務施設 (Office Building)',
    height: 58.0,
    floors: 14,
    lon: 139.754000,
    lat: 35.668000,
    width: 48,
    length: 52,
    severity: 'minor',
  },
];

// Dynamically compute calibrated SVG coordinates for REAL_PLATEAU_BUILDINGS
export const REAL_PLATEAU_BUILDINGS: PlateauBuilding[] = RAW_PLATEAU_BUILDINGS.map((raw) => {
  const { x, y } = lonLatToSvg(raw.lon, raw.lat);
  return {
    id: raw.id,
    gmlId: raw.gmlId,
    cityCode: raw.cityCode,
    name: raw.name,
    address: raw.address,
    usage: raw.usage,
    height: raw.height,
    floors: raw.floors,
    lon: raw.lon,
    lat: raw.lat,
    x,
    y,
    width: raw.width,
    length: raw.length,
    severity: raw.severity,
    clashDetected: raw.clashDetected,
    clashDistance: raw.clashDistance,
  };
});

export const REAL_PLATEAU_FEATURES: PlateauFeature[] = [
  // --- BUILDINGS (bldg) ---
  ...REAL_PLATEAU_BUILDINGS.map((b): PlateauFeature => ({
    id: b.id,
    gmlId: b.gmlId,
    cityCode: b.cityCode,
    name: b.name,
    address: b.address,
    category: 'bldg',
    categoryLabel: '建物 (bldg)',
    lod: b.name.includes('LOD2') ? 'LOD2' : 'LOD1',
    lon: b.lon,
    lat: b.lat,
    x: b.x,
    y: b.y,
    z: 0,
    width: b.width,
    length: b.length,
    height: b.height,
    severity: b.severity,
    clashDetected: b.clashDetected,
    details: `CityGML ID: ${b.gmlId} / 住所: ${b.address} / 用途: ${b.usage} / 高さ: ${b.height}m (${b.floors}F)`,
  })),

  // --- ROADS & INFRASTRUCTURE (tran) ---
  {
    id: 'tran-kanjo-2-tunnel',
    gmlId: 'tran_13103_00010_00001',
    cityCode: '13103',
    name: '地下環状2号線 築地虎ノ門トンネル (tran)',
    address: '東京都港区虎ノ門〜新橋地下',
    category: 'tran',
    categoryLabel: '道路 (tran)',
    lod: 'LOD2',
    lon: 139.7510,
    lat: 35.6668,
    x: lonLatToSvg(139.7510, 35.6668).x,
    y: lonLatToSvg(139.7510, 35.6668).y,
    z: -12,
    width: 24,
    length: 850,
    height: 8,
    color: '#38bdf8',
    severity: 'major',
    details: 'MLIT PLATEAU 道路ネットワーク (東京都市計画道路 幹線街路環状第2号線 地下本線)',
  },
  {
    id: 'tran-sotobori-dori',
    gmlId: 'tran_13103_00012_00002',
    cityCode: '13103',
    name: '外堀通り 東京都道405号 (tran)',
    address: '東京都港区西新橋1丁目',
    category: 'tran',
    categoryLabel: '道路 (tran)',
    lod: 'LOD1',
    lon: 139.7492,
    lat: 35.6678,
    x: lonLatToSvg(139.7492, 35.6678).x,
    y: lonLatToSvg(139.7492, 35.6678).y,
    z: 0,
    width: 32,
    length: 900,
    height: 0.5,
    color: '#94a3b8',
    details: 'MLIT PLATEAU 道路ネットワーク (東京都道405号外濠環状線 幅員32m 6車線)',
  },
  {
    id: 'tran-daiichi-keihin',
    gmlId: 'tran_13103_00015_00003',
    cityCode: '13103',
    name: '第一京浜 国道15号 (tran)',
    address: '東京都港区新橋2丁目',
    category: 'tran',
    categoryLabel: '道路 (tran)',
    lod: 'LOD1',
    lon: 139.7580,
    lat: 35.6660,
    x: lonLatToSvg(139.7580, 35.6660).x,
    y: lonLatToSvg(139.7580, 35.6660).y,
    z: 0,
    width: 40,
    length: 700,
    height: 0.5,
    color: '#64748b',
    details: 'MLIT PLATEAU 道路ネットワーク (一般国道15号 第一京浜 幹線街路)',
  },

  // --- WATERWAYS (wtr) ---
  {
    id: 'wtr-shiodome-river-historic',
    gmlId: 'wtr_13103_00001_00001',
    cityCode: '13103',
    name: '旧汐留川 水路痕跡・暗渠 (wtr)',
    address: '東京都港区東新橋1丁目',
    category: 'wtr',
    categoryLabel: '水路 (wtr)',
    lod: 'LOD2',
    lon: 139.7590,
    lat: 35.6638,
    x: lonLatToSvg(139.7590, 35.6638).x,
    y: lonLatToSvg(139.7590, 35.6638).y,
    z: -3,
    width: 18,
    length: 520,
    height: 4,
    color: '#0284c7',
    severity: 'major',
    clashDetected: true,
    details: 'MLIT PLATEAU 水路モデル (旧汐留川水脈・暗渠構造・地下水保全指定区域)',
  },
  {
    id: 'wtr-atago-tunnel-dem',
    gmlId: 'wtr_13103_00002_00002',
    cityCode: '13103',
    name: '愛宕山地下湧水脈・集水渠 (wtr)',
    address: '東京都港区愛宕1丁目',
    category: 'wtr',
    categoryLabel: '水路 (wtr)',
    lod: 'LOD2',
    lon: 139.7478,
    lat: 35.6650,
    x: lonLatToSvg(139.7478, 35.6650).x,
    y: lonLatToSvg(139.7478, 35.6650).y,
    z: -8,
    width: 12,
    length: 280,
    height: 3,
    color: '#0369a1',
    severity: 'minor',
    details: 'MLIT PLATEAU 水路モデル (愛宕山DEM連動 地下水流路)',
  },

  // --- RAILWAYS & SUBWAYS (rwy) ---
  {
    id: 'rwy-metro-hibiya-line',
    gmlId: 'rwy_13103_00001_00001',
    cityCode: '13103',
    name: '東京メトロ日比谷線 虎ノ門ヒルズ駅 (rwy)',
    address: '東京都港区虎ノ門1丁目地下',
    category: 'rwy',
    categoryLabel: '鉄道 (rwy)',
    lod: 'LOD2',
    lon: 139.7498,
    lat: 35.6670,
    x: lonLatToSvg(139.7498, 35.6670).x,
    y: lonLatToSvg(139.7498, 35.6670).y,
    z: -14,
    width: 18,
    length: 220,
    height: 6,
    color: '#06b6d4',
    severity: 'major',
    clashDetected: true,
    details: 'MLIT PLATEAU 鉄道構造物 (東京地下鉄日比谷線 地下駅構造 かぶり厚14m)',
  },
  {
    id: 'rwy-metro-ginza-line',
    gmlId: 'rwy_13103_00002_00002',
    cityCode: '13103',
    name: '東京メトロ銀座線 新橋-虎ノ門間 (rwy)',
    address: '東京都港区西新橋1丁目地下',
    category: 'rwy',
    categoryLabel: '鉄道 (rwy)',
    lod: 'LOD2',
    lon: 139.7530,
    lat: 35.6675,
    x: lonLatToSvg(139.7530, 35.6675).x,
    y: lonLatToSvg(139.7530, 35.6675).y,
    z: -8,
    width: 12,
    length: 600,
    height: 5,
    color: '#eab308',
    severity: 'minor',
    details: 'MLIT PLATEAU 鉄道構造物 (東京地下鉄銀座線 浅層単線トンネル 深度 -8m)',
  },
  {
    id: 'rwy-yurikamome-viaduct',
    gmlId: 'rwy_13103_00003_00003',
    cityCode: '13103',
    name: 'ゆりかもめ 汐留高架橋脚構造 (rwy)',
    address: '東京都港区東新橋1丁目',
    category: 'rwy',
    categoryLabel: '鉄道 (rwy)',
    lod: 'LOD2',
    lon: 139.7595,
    lat: 35.6642,
    x: lonLatToSvg(139.7595, 35.6642).x,
    y: lonLatToSvg(139.7595, 35.6642).y,
    z: 15,
    width: 10,
    length: 350,
    height: 12,
    color: '#a855f7',
    severity: 'minor',
    details: 'MLIT PLATEAU 鉄道構造物 (東京臨海新交通臨海線 高架軌道・橋脚構造)',
  },
];

export function getRealPlateauData() {
  return {
    buildings: REAL_PLATEAU_BUILDINGS,
    features: REAL_PLATEAU_FEATURES,
  };
}

export function queryPlateauFeaturesByBBox(
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number
): {
  buildings: PlateauBuilding[];
  features: PlateauFeature[];
  counts: { bldg: number; tran: number; wtr: number; rwy: number };
  bbox: { minLon: number; minLat: number; maxLon: number; maxLat: number };
} {
  const l0 = Math.min(minLon, maxLon);
  const l1 = Math.max(minLon, maxLon);
  const a0 = Math.min(minLat, maxLat);
  const a1 = Math.max(minLat, maxLat);

  const matchedFeatures = REAL_PLATEAU_FEATURES.filter((ft) => {
    if (ft.lon !== undefined && ft.lat !== undefined) {
      return ft.lon >= l0 && ft.lon <= l1 && ft.lat >= a0 && ft.lat <= a1;
    }
    return true;
  });

  const matchedBuildings = REAL_PLATEAU_BUILDINGS.filter((b) => {
    if (b.lon !== undefined && b.lat !== undefined) {
      return b.lon >= l0 && b.lon <= l1 && b.lat >= a0 && b.lat <= a1;
    }
    return true;
  });

  // Do NOT fallback to full dataset when empty — empty result means "no features in bbox"
  // (Previously matched 0 returned all data, which made BBox selection appear broken.)
  // See GitHub Issue #2
  const counts = {
    bldg: matchedFeatures.filter((f) => f.category === 'bldg').length,
    tran: matchedFeatures.filter((f) => f.category === 'tran').length,
    wtr: matchedFeatures.filter((f) => f.category === 'wtr').length,
    rwy: matchedFeatures.filter((f) => f.category === 'rwy').length,
  };

  return {
    buildings: matchedBuildings,
    features: matchedFeatures,
    counts,
    bbox: { minLon: l0, minLat: a0, maxLon: l1, maxLat: a1 },
  };
}
