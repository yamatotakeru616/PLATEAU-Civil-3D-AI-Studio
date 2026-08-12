import React from 'react';
import { PlateauFeature, PlateauBuilding } from '../types/civil';
import { lonLatToSvg, lonLatBBoxToSvgBounds } from '../utils/gisProjection';

/** Resolve feature list: empty array after BBox filter must stay empty (no buildings fallback). */
export function resolvePlateauFeaturesFor2D(project: {
  plateauFeatures?: PlateauFeature[];
  plateauBuildings: PlateauBuilding[];
}): PlateauFeature[] {
  if (project.plateauFeatures !== undefined) {
    return project.plateauFeatures;
  }
  return project.plateauBuildings.map((b) => ({
    id: b.id,
    name: b.name,
    category: 'bldg' as const,
    categoryLabel: '建物 (bldg)',
    lod: 'LOD2' as const,
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
  }));
}

/** Canvas position from lon/lat so features align with map tiles. */
export function featureCanvasPos(ft: PlateauFeature): { x: number; y: number } {
  if (ft.lon !== undefined && ft.lat !== undefined) {
    return lonLatToSvg(ft.lon, ft.lat);
  }
  return { x: ft.x, y: ft.y };
}

export function PlateauFeaturesLayer({ features }: { features: PlateauFeature[] }) {
  return (
    <>
      {features.map((ft) => {
        const { x: cx, y: cy } = featureCanvasPos(ft);
        const isCritical = ft.severity === 'critical';
        const isMajor = ft.severity === 'major';

        let fillColor = isCritical
          ? 'rgba(239, 68, 68, 0.45)'
          : isMajor
          ? 'rgba(245, 158, 11, 0.45)'
          : 'rgba(59, 130, 246, 0.4)';
        let strokeColor = isCritical ? '#ef4444' : isMajor ? '#f59e0b' : '#3b82f6';
        let strokeDash = 'none';

        if (ft.category === 'tran') {
          fillColor = 'rgba(100, 116, 139, 0.4)';
          strokeColor = '#94a3b8';
          strokeDash = '4,2';
        } else if (ft.category === 'wtr') {
          fillColor = 'rgba(2, 132, 199, 0.5)';
          strokeColor = '#38bdf8';
        } else if (ft.category === 'rwy') {
          fillColor = 'rgba(6, 182, 212, 0.4)';
          strokeColor = '#06b6d4';
          strokeDash = '2,2';
        }

        const w = Math.max(ft.width || 20, 12);
        const h = Math.max(ft.length || 20, 12);

        return (
          <g key={ft.id} className="pointer-events-none">
            <rect
              x={cx - w / 2}
              y={cy - h / 2}
              width={w}
              height={h}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={isCritical ? '2.5' : '1.8'}
              strokeDasharray={strokeDash}
              rx="2"
            />
            <text
              x={cx}
              y={cy + 3}
              fill={isCritical ? '#ffffff' : '#e0f2fe'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
              className="drop-shadow"
            >
              {ft.name} {ft.category === 'bldg' ? `(${ft.height}m)` : ''}
            </text>
          </g>
        );
      })}
    </>
  );
}

export function SelectedBBoxOverlay({
  bbox,
}: {
  bbox: { minLon: number; minLat: number; maxLon: number; maxLat: number };
}) {
  const b = lonLatBBoxToSvgBounds(bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat);
  return (
    <g className="pointer-events-none">
      <rect
        x={b.minX}
        y={b.minY}
        width={Math.max(b.maxX - b.minX, 1)}
        height={Math.max(b.maxY - b.minY, 1)}
        fill="rgba(0, 162, 237, 0.08)"
        stroke="#00a2ed"
        strokeWidth="2.5"
        strokeDasharray="8,4"
      />
      <text x={b.minX + 6} y={b.minY - 6} fill="#00a2ed" fontSize="11" fontWeight="bold" fontFamily="monospace">
        選択範囲
      </text>
    </g>
  );
}
