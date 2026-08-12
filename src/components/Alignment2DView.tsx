import React, { useRef, useState, useCallback, useMemo } from 'react';
import { AlignmentProject, AgentProposal, PlateauFeature } from '../types/civil';
import { ZoomIn, ZoomOut, RotateCcw, Move, MousePointer, Map, Layers, Eye, Sliders, Compass, ShieldCheck, BoxSelect } from 'lucide-react';
import { calculateCalibratedTileGrid, calculateAlignmentGisError, svgToLonLat, getOptimalMapCalibration, lonLatBBoxToSvgBounds, fitSvgBoundsToView } from '../utils/gisProjection';
import { PlateauFeaturesLayer, SelectedBBoxOverlay, resolvePlateauFeaturesFor2D } from './Plateau2DLayer';

// NOTE: Full component restored with PLATEAU layer wired to Plateau2DLayer.
// If this file is incomplete after merge, restore from main and re-apply Plateau2DLayer imports.

export type MapStyle = 'grid' | 'gsi_std' | 'gsi_pale' | 'gsi_ortho' | 'osm' | 'dark_gis';

interface Alignment2DViewProps {
  project: AlignmentProject;
  proposals: AgentProposal[];
  selectedIpId: string | null;
  onSelectIp: (id: string) => void;
  onUpdateIpPosition: (id: string, newX: number, newY: number) => void;
  onSelectRegion?: (bbox: { minLon: number; minLat: number; maxLon: number; maxLat: number }) => void;
}

export const Alignment2DView: React.FC<Alignment2DViewProps> = ({
  project,
  proposals,
  selectedIpId,
  onSelectIp,
  onUpdateIpPosition,
  onSelectRegion,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingIpId, setDraggingIpId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isBoxSelectMode, setIsBoxSelectMode] = useState<boolean>(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [selectedBBoxInfo, setSelectedBBoxInfo] = useState<{ minLon: number; minLat: number; maxLon: number; maxLat: number } | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('gsi_std');
  const [mapOpacity, setMapOpacity] = useState<number>(0.85);
  const [showPlateauOverlay, setShowPlateauOverlay] = useState<boolean>(true);
  const [showMapControls, setShowMapControls] = useState<boolean>(false);
  const [mapOffsetX, setMapOffsetX] = useState<number>(0);
  const [mapOffsetY, setMapOffsetY] = useState<number>(0);
  const [mapTileScale, setMapTileScale] = useState<number>(1.0);

  const svgWidth = 1000;
  const svgHeight = 600;

  const getTileUrl = (style: MapStyle, x: number, y: number, z = 16) => {
    switch (style) {
      case 'gsi_std':
        return `https://cyberjapandata.gsi.go.jp/xyz/std/${z}/${x}/${y}.png`;
      case 'gsi_pale':
        return `https://cyberjapandata.gsi.go.jp/xyz/pale/${z}/${x}/${y}.png`;
      case 'gsi_ortho':
        return `https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/${z}/${x}/${y}.jpg`;
      case 'osm':
        return `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
      default:
        return '';
    }
  };

  const tileGrid = useMemo(() => {
    const tiles = calculateCalibratedTileGrid(16, mapOffsetX, mapOffsetY, mapTileScale);
    return tiles.map((t) => ({
      x: t.tileX,
      y: t.tileY,
      left: t.left,
      top: t.top,
      width: t.width,
      height: t.height,
    }));
  }, [mapOffsetX, mapOffsetY, mapTileScale]);

  const gisAlignmentError = useMemo(() => {
    return calculateAlignmentGisError(mapOffsetX, mapOffsetY, mapTileScale);
  }, [mapOffsetX, mapOffsetY, mapTileScale]);

  const pathD = project.ipPoints.reduce((acc, ip, idx) => {
    if (idx === 0) return `M ${ip.x} ${ip.y}`;
    return `${acc} L ${ip.x} ${ip.y}`;
  }, '');

  const getSvgCoords = useCallback(
    (e: React.PointerEvent | PointerEvent | React.MouseEvent | MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / rect.width) * svgWidth;
      const rawY = ((e.clientY - rect.top) / rect.height) * svgHeight;
      const x = Math.round((rawX - panOffset.x) / zoomScale);
      const y = Math.round((rawY - panOffset.y) / zoomScale);
      return {
        x: Math.max(10, Math.min(1500, x)),
        y: Math.max(10, Math.min(1000, y)),
      };
    },
    [panOffset, zoomScale]
  );

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoomScale((prev) => {
      const nextZoom = Math.max(0.2, Math.min(5.0, prev * zoomFactor));
      return Number(nextZoom.toFixed(2));
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isBoxSelectMode && e.button === 0) {
      e.preventDefault();
      const coords = getSvgCoords(e);
      setSelectionBox({ startX: coords.x, startY: coords.y, currentX: coords.x, currentY: coords.y });
      try {
        svgRef.current?.setPointerCapture?.(e.pointerId);
      } catch (_) {}
      return;
    }
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.target === svgRef.current)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      try {
        svgRef.current?.setPointerCapture?.(e.pointerId);
      } catch (_) {}
    }
  };

  const handlePointerDownIp = (e: React.PointerEvent, ipId: string) => {
    if (e.button !== 0 || isBoxSelectMode) return;
    e.stopPropagation();
    onSelectIp(ipId);
    setDraggingIpId(ipId);
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (selectionBox) {
      const coords = getSvgCoords(e);
      setSelectionBox((prev) => (prev ? { ...prev, currentX: coords.x, currentY: coords.y } : null));
      return;
    }
    if (isPanning) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (!draggingIpId) return;
    const { x, y } = getSvgCoords(e);
    onUpdateIpPosition(draggingIpId, x, y);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (selectionBox) {
      const minX = Math.min(selectionBox.startX, selectionBox.currentX);
      const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
      const minY = Math.min(selectionBox.startY, selectionBox.currentY);
      const maxY = Math.max(selectionBox.startY, selectionBox.currentY);

      if (Math.abs(maxX - minX) > 15 && Math.abs(maxY - minY) > 15) {
        const p1 = svgToLonLat(minX, minY);
        const p2 = svgToLonLat(maxX, maxY);
        const bbox = {
          minLon: Math.min(p1.lon, p2.lon),
          maxLon: Math.max(p1.lon, p2.lon),
          minLat: Math.min(p1.lat, p2.lat),
          maxLat: Math.max(p1.lat, p2.lat),
        };
        setSelectedBBoxInfo(bbox);
        const svgBounds = lonLatBBoxToSvgBounds(bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat);
        const fit = fitSvgBoundsToView(svgBounds, svgWidth, svgHeight, 50);
        setZoomScale(fit.zoomScale);
        setPanOffset(fit.panOffset);
        if (onSelectRegion) {
          onSelectRegion(bbox);
        }
      } else {
        setSelectedBBoxInfo(null);
      }
      setSelectionBox(null);
      try {
        svgRef.current?.releasePointerCapture?.(e.pointerId);
      } catch (_) {}
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      try {
        svgRef.current?.releasePointerCapture?.(e.pointerId);
      } catch (_) {}
    }

    if (draggingIpId) {
      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch (_) {}
      setDraggingIpId(null);
    }
  };

  const handleZoomIn = () => setZoomScale((prev) => Math.min(5.0, Number((prev * 1.25).toFixed(2))));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(0.4, Number((prev / 1.25).toFixed(2))));
  const handleResetZoomPan = () => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="w-full h-full bg-[#0a0a0d] relative overflow-hidden select-none flex flex-col">
      <div className="h-10 bg-[#252526] border-b border-[#3e3e42] px-3 flex items-center justify-between text-xs text-gray-300 font-mono">
        <div className="flex items-center gap-3">
          <span className="text-[#00a2ed] font-bold flex items-center gap-1.5">
            <Map className="w-4 h-4 text-sky-400" />
            2D PLAN MAP VIEW (平面地図・線形)
          </span>
          <span className="text-gray-400">Scale: 1:1000</span>
          <span className="text-gray-400">Zoom: {Math.round(zoomScale * 100)}%</span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#18191c] p-1 rounded border border-[#3e3e42]">
          <span className="text-[10px] text-gray-400 font-bold px-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-400" />
            地図:
          </span>
          {(['gsi_std', 'gsi_pale', 'gsi_ortho', 'osm', 'grid'] as MapStyle[]).map((s) => (
            <button
              key={s}
              onClick={() => setMapStyle(s)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                mapStyle === s ? 'bg-[#00a2ed] text-white shadow' : 'bg-[#2d2d30] text-gray-300 hover:text-white'
              }`}
            >
              {s === 'gsi_std' ? '地理院標準' : s === 'gsi_pale' ? '地理院淡色' : s === 'gsi_ortho' ? '航空写真' : s === 'osm' ? 'OSM 地図' : 'CADグリッド'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#1a1c1e] p-1 rounded border border-[#3e3e42]">
            <button onClick={handleZoomIn} className="p-1 hover:bg-[#333] text-gray-300 hover:text-white rounded" title="拡大">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleZoomOut} className="p-1 hover:bg-[#333] text-gray-300 hover:text-white rounded" title="縮小">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleResetZoomPan} className="p-1 hover:bg-[#333] text-gray-300 hover:text-amber-400 rounded flex items-center gap-1" title="全体表示">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">1:1 Fit</span>
            </button>
          </div>

          <button
            onClick={() => setIsBoxSelectMode((prev) => !prev)}
            className={`p-1.5 rounded border transition-colors flex items-center gap-1 font-mono text-[11px] ${
              isBoxSelectMode
                ? 'bg-sky-600 text-white border-sky-400 shadow-lg animate-pulse'
                : 'bg-[#1a1c1e] text-sky-400 border-sky-700/50 hover:bg-sky-950/40'
            }`}
          >
            <BoxSelect className="w-3.5 h-3.5" />
            <span>{isBoxSelectMode ? '範囲選択中' : '範囲選択 (BBox)'}</span>
          </button>

          <button
            onClick={() => setShowMapControls((prev) => !prev)}
            className={`p-1.5 rounded border transition-colors flex items-center gap-1 font-mono text-[11px] ${
              showMapControls ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-[#1a1c1e] text-gray-300 border-[#3e3e42]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>レイヤー設定</span>
          </button>
        </div>
      </div>

      {showMapControls && (
        <div className="absolute top-12 right-4 z-20 bg-[#18191c]/95 border border-[#3e3e42] p-3 rounded-lg shadow-2xl text-xs font-mono text-gray-200 w-64 backdrop-blur space-y-3">
          <div className="flex items-center justify-between border-b border-[#333] pb-1.5 font-bold text-sky-400">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              2D地図・オーバーレイ設定
            </span>
            <button onClick={() => setShowMapControls(false)} className="text-gray-400 hover:text-white font-bold">
              ×
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>背景地図 透過率:</span>
              <span className="text-amber-400 font-bold">{Math.round(mapOpacity * 100)}%</span>
            </div>
            <input type="range" min="0.1" max="1.0" step="0.05" value={mapOpacity} onChange={(e) => setMapOpacity(parseFloat(e.target.value))} className="w-full accent-[#00a2ed]" />
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-[#333]">
            <span className="text-gray-300 text-[11px]">PLATEAU 表示:</span>
            <button
              onClick={() => setShowPlateauOverlay((prev) => !prev)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                showPlateauOverlay ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              <Eye className="w-3 h-3" />
              {showPlateauOverlay ? '表示 ON' : '非表示'}
            </button>
          </div>
          <div className="pt-2 border-t border-[#333] text-[10px] text-amber-300">
            位置整合誤差: {gisAlignmentError}m / mapOffset ({mapOffsetX},{mapOffsetY}) scale {mapTileScale.toFixed(2)}
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden p-2 flex items-center justify-center bg-[#0d0e12]" onWheel={handleWheel} onContextMenu={handleContextMenu}>
        {selectedBBoxInfo && (
          <div className="absolute top-4 left-4 z-20 bg-[#16181d]/95 border border-sky-500/50 p-3 rounded-lg shadow-2xl text-xs font-mono text-gray-200 w-72 backdrop-blur space-y-2">
            <div className="flex items-center justify-between border-b border-[#333] pb-1.5 font-bold text-sky-400">
              <span className="flex items-center gap-1.5">
                <BoxSelect className="w-4 h-4 text-sky-400" />
                2D PLATEAU 選択領域
              </span>
              <button onClick={() => setSelectedBBoxInfo(null)} className="text-gray-400 hover:text-white font-bold">
                ×
              </button>
            </div>
            <div className="text-[10px] text-gray-300 space-y-1">
              <div>Lat: {selectedBBoxInfo.minLat.toFixed(4)} ~ {selectedBBoxInfo.maxLat.toFixed(4)}</div>
              <div>Lon: {selectedBBoxInfo.minLon.toFixed(4)} ~ {selectedBBoxInfo.maxLon.toFixed(4)}</div>
            </div>
            <div className="bg-sky-950/60 border border-sky-500/30 p-1.5 rounded text-[9px] text-sky-200 flex justify-between">
              <span>ロード結果:</span>
              <span className="font-bold text-emerald-400">
                {project.plateauFeatures?.length ?? project.plateauBuildings.length} 件
              </span>
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgHeight}
          viewBox="0 0 1000 600"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`bg-[#0a0a0d] border border-[#333] rounded shadow-2xl ${
            isPanning ? 'cursor-grabbing' : draggingIpId ? 'cursor-grabbing' : 'cursor-crosshair'
          }`}
        >
          <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomScale})`}>
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1f2228" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="8000" height="8000" x="-3500" y="-3500" fill="url(#grid)" />

            {mapStyle !== 'grid' && (
              <g opacity={mapOpacity} className="pointer-events-none">
                {tileGrid.map((tile) => (
                  <image
                    key={`${mapStyle}-${tile.x}-${tile.y}`}
                    href={getTileUrl(mapStyle, tile.x, tile.y)}
                    x={tile.left}
                    y={tile.top}
                    width={tile.width}
                    height={tile.height}
                    preserveAspectRatio="none"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      try {
                        (e.currentTarget as SVGImageElement).style.display = 'none';
                      } catch (_) {}
                    }}
                  />
                ))}
              </g>
            )}

            {/* PLATEAU: lon/lat → SVG で地図と一致。空配列は空のまま */}
            {showPlateauOverlay && <PlateauFeaturesLayer features={resolvePlateauFeaturesFor2D(project)} />}
            {selectedBBoxInfo && <SelectedBBoxOverlay bbox={selectedBBoxInfo} />}

            <path d={pathD} fill="none" stroke="#00a2ed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {proposals.map((prop) => {
              if (!prop.dashedAnnotation) return null;
              const { coordinates, color, label } = prop.dashedAnnotation;
              return (
                <g key={prop.id} className="pointer-events-none">
                  {coordinates.map((coord, i) => (
                    <g key={i}>
                      <circle cx={coord.x} cy={coord.y} r="28" fill="none" stroke={color || '#ff3333'} strokeWidth="2" strokeDasharray="6,4" />
                      <text x={coord.x} y={coord.y - 34} fill={color || '#ff3333'} fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        【赤入れ】{label}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}

            {selectionBox && (
              <g className="pointer-events-none">
                <rect
                  x={Math.min(selectionBox.startX, selectionBox.currentX)}
                  y={Math.min(selectionBox.startY, selectionBox.currentY)}
                  width={Math.abs(selectionBox.currentX - selectionBox.startX)}
                  height={Math.abs(selectionBox.currentY - selectionBox.startY)}
                  fill="rgba(0, 162, 237, 0.18)"
                  stroke="#00a2ed"
                  strokeWidth="2"
                  strokeDasharray="6,3"
                />
                <text
                  x={Math.min(selectionBox.startX, selectionBox.currentX) + 8}
                  y={Math.min(selectionBox.startY, selectionBox.currentY) + 18}
                  fill="#00a2ed"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  【2D PLATEAU 範囲選択中】
                </text>
              </g>
            )}

            {project.ipPoints.map((ip) => {
              const isSelected = ip.id === selectedIpId;
              const isDragging = ip.id === draggingIpId;
              const hasViolation = ip.R > 0 && ip.R < 150;
              return (
                <g key={ip.id} onPointerDown={(e) => handlePointerDownIp(e, ip.id)} className="cursor-grab active:cursor-grabbing">
                  {isSelected && (
                    <circle cx={ip.x} cy={ip.y} r={isDragging ? '22' : '16'} fill="none" stroke="#ffea00" strokeWidth="1.5" strokeDasharray="4,2" />
                  )}
                  <circle cx={ip.x} cy={ip.y} r="18" fill="transparent" />
                  <circle
                    cx={ip.x}
                    cy={ip.y}
                    r={isDragging ? '12' : isSelected ? '10' : '7'}
                    fill={isDragging ? '#00ff88' : isSelected ? '#ffea00' : hasViolation ? '#ef4444' : '#00a2ed'}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                  <text x={ip.x + 14} y={ip.y - 14} fill={isDragging ? '#00ff88' : isSelected ? '#ffea00' : '#d4d4d4'} fontSize="12" fontWeight="bold" fontFamily="monospace">
                    {ip.name} (KP{ip.kp}m)
                  </text>
                  {(isSelected || isDragging) && (() => {
                    const geodetic = svgToLonLat(ip.x, ip.y);
                    return (
                      <g className="pointer-events-none">
                        <rect x={ip.x + 12} y={ip.y + 16} width="180" height="32" fill="#1a1c1e" stroke="#ffea00" strokeWidth="1" rx="3" />
                        <text x={ip.x + 18} y={ip.y + 28} fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          CAD: X:{Math.round(ip.x)}m Y:{Math.round(ip.y)}m
                        </text>
                        <text x={ip.x + 18} y={ip.y + 42} fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          WGS84: {geodetic.lat.toFixed(5)}°N, {geodetic.lon.toFixed(5)}°E
                        </text>
                      </g>
                    );
                  })()}
                  {ip.R > 0 && !isDragging && (
                    <text x={ip.x + 14} y={ip.y + 4} fill={hasViolation ? '#ef4444' : '#38bdf8'} fontSize="10" fontFamily="monospace">
                      R={ip.R}m / A={ip.A1}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        <div className="absolute bottom-4 right-4 bg-[#18191c]/90 border border-[#3e3e42] p-2 rounded text-[11px] font-mono text-gray-300 flex items-center gap-3 backdrop-blur shadow-lg">
          <div className="flex items-center gap-1.5 text-sky-400">
            <MousePointer className="w-3.5 h-3.5" />
            <span>ホイール: 拡大縮小</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Move className="w-3.5 h-3.5" />
            <span>中ボタン/右ドラッグ: パン</span>
          </div>
        </div>
      </div>
    </div>
  );
};
