import React, { useRef, useState, useCallback, useMemo } from 'react';
import { AlignmentProject, AgentProposal, PlateauFeature } from '../types/civil';
import { ZoomIn, ZoomOut, RotateCcw, Move, MousePointer, Map, Layers, Eye, Sliders, Compass, ShieldCheck } from 'lucide-react';
import { calculateCalibratedTileGrid, calculateAlignmentGisError, svgToLonLat, getOptimalMapCalibration } from '../utils/gisProjection';

interface Alignment2DViewProps {
  project: AlignmentProject;
  proposals: AgentProposal[];
  selectedIpId: string | null;
  onSelectIp: (id: string) => void;
  onUpdateIpPosition: (id: string, newX: number, newY: number) => void;
}

export type MapStyle = 'grid' | 'gsi_std' | 'gsi_pale' | 'gsi_ortho' | 'osm' | 'dark_gis';

export const Alignment2DView: React.FC<Alignment2DViewProps> = ({
  project,
  proposals,
  selectedIpId,
  onSelectIp,
  onUpdateIpPosition,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingIpId, setDraggingIpId] = useState<string | null>(null);

  // Zoom & Pan state
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 2D Map Layer State
  const [mapStyle, setMapStyle] = useState<MapStyle>('gsi_std');
  const [mapOpacity, setMapOpacity] = useState<number>(0.85);
  const [showPlateauOverlay, setShowPlateauOverlay] = useState<boolean>(true);
  const [showMapControls, setShowMapControls] = useState<boolean>(false);

  // Map Position Fine-Tuning Calibration Offset (Aligns GSI/OSM Map tiles with PLATEAU 3D building coordinates)
  const [mapOffsetX, setMapOffsetX] = useState<number>(0);
  const [mapOffsetY, setMapOffsetY] = useState<number>(0);
  const [mapTileScale, setMapTileScale] = useState<number>(1.0);

  // SVG Canvas dimensions
  const svgWidth = 1000;
  const svgHeight = 600;

  // Shinbashi / Toranomon Map Tiles (Zoom=16, Tokyo Region)
  // Tile URLs for GSI & OSM / Carto
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

  // Dynamic Map Tile Grid calibrated for EPSG:6677 (平面直角IX系) <-> EPSG:3857 (Web Mercator)
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

  // Calibration GIS alignment error calculation
  const gisAlignmentError = useMemo(() => {
    return calculateAlignmentGisError(mapOffsetX, mapOffsetY, mapTileScale);
  }, [mapOffsetX, mapOffsetY, mapTileScale]);

  // Generate path string for alignment
  const pathD = project.ipPoints.reduce((acc, ip, idx) => {
    if (idx === 0) return `M ${ip.x} ${ip.y}`;
    return `${acc} L ${ip.x} ${ip.y}`;
  }, '');

  // Convert pointer screen event to SVG coordinates accounting for zoom and pan
  const getSvgCoords = useCallback(
    (e: React.PointerEvent | PointerEvent | React.MouseEvent | MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / rect.width) * svgWidth;
      const rawY = ((e.clientY - rect.top) / rect.height) * svgHeight;

      // Transform raw screen SVG coords to zoomed/panned workspace coords
      const x = Math.round((rawX - panOffset.x) / zoomScale);
      const y = Math.round((rawY - panOffset.y) / zoomScale);

      return {
        x: Math.max(10, Math.min(1500, x)),
        y: Math.max(10, Math.min(1000, y)),
      };
    },
    [panOffset, zoomScale]
  );

  // Mouse wheel zoom handler (拡大・縮小)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoomScale((prev) => {
      const nextZoom = Math.max(0.2, Math.min(5.0, prev * zoomFactor));
      return Number(nextZoom.toFixed(2));
    });
  };

  // Drag start for IP or Pan
  const handlePointerDown = (e: React.PointerEvent) => {
    // Middle click (button === 1 or buttons === 4) OR Right click (button === 2) OR Canvas Pan drag
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.target === svgRef.current)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      if (svgRef.current?.setPointerCapture) {
        try {
          svgRef.current.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    }
  };

  // Drag start for IP Point
  const handlePointerDownIp = (e: React.PointerEvent, ipId: string) => {
    if (e.button !== 0) return; // Left click only for IP drag
    e.stopPropagation();
    onSelectIp(ipId);
    setDraggingIpId(ipId);
    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Dragging movement (IP point or Pan)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      const newPanX = e.clientX - panStart.x;
      const newPanY = e.clientY - panStart.y;
      setPanOffset({ x: newPanX, y: newPanY });
      return;
    }

    if (!draggingIpId) return;
    const { x, y } = getSvgCoords(e);
    onUpdateIpPosition(draggingIpId, x, y);
  };

  // Drag end
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      if (svgRef.current?.releasePointerCapture) {
        try {
          svgRef.current.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    }

    if (draggingIpId) {
      if (e.currentTarget.releasePointerCapture) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
      setDraggingIpId(null);
    }
  };

  // Zoom Control Actions
  const handleZoomIn = () => setZoomScale((prev) => Math.min(5.0, Number((prev * 1.25).toFixed(2))));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(0.4, Number((prev / 1.25).toFixed(2))));
  const handleResetZoomPan = () => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Prevent default context menu on right click pan
  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="w-full h-full bg-[#0a0a0d] relative overflow-hidden select-none flex flex-col">
      {/* 2D CAD Canvas Bar & Navigation Toolbar */}
      <div className="h-10 bg-[#252526] border-b border-[#3e3e42] px-3 flex items-center justify-between text-xs text-gray-300 font-mono">
        <div className="flex items-center gap-3">
          <span className="text-[#00a2ed] font-bold flex items-center gap-1.5">
            <Map className="w-4 h-4 text-sky-400" />
            2D PLAN MAP VIEW (平面地図・線形)
          </span>
          <span className="text-gray-400">Scale: 1:1000</span>
          <span className="text-gray-400">Zoom: {Math.round(zoomScale * 100)}%</span>
        </div>

        {/* 2D Map Layer Style Selector */}
        <div className="flex items-center gap-1.5 bg-[#18191c] p-1 rounded border border-[#3e3e42]">
          <span className="text-[10px] text-gray-400 font-bold px-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-400" />
            地図:
          </span>
          <button
            onClick={() => setMapStyle('gsi_std')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              mapStyle === 'gsi_std' ? 'bg-[#00a2ed] text-white shadow' : 'bg-[#2d2d30] text-gray-300 hover:text-white'
            }`}
          >
            地理院標準
          </button>
          <button
            onClick={() => setMapStyle('gsi_pale')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              mapStyle === 'gsi_pale' ? 'bg-[#00a2ed] text-white shadow' : 'bg-[#2d2d30] text-gray-300 hover:text-white'
            }`}
          >
            地理院淡色
          </button>
          <button
            onClick={() => setMapStyle('gsi_ortho')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              mapStyle === 'gsi_ortho' ? 'bg-[#00a2ed] text-white shadow' : 'bg-[#2d2d30] text-gray-300 hover:text-white'
            }`}
          >
            航空写真
          </button>
          <button
            onClick={() => setMapStyle('osm')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              mapStyle === 'osm' ? 'bg-[#00a2ed] text-white shadow' : 'bg-[#2d2d30] text-gray-300 hover:text-white'
            }`}
          >
            OSM 地図
          </button>
          <button
            onClick={() => setMapStyle('grid')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              mapStyle === 'grid' ? 'bg-[#00a2ed] text-white shadow' : 'bg-[#2d2d30] text-gray-300 hover:text-white'
            }`}
          >
            CADグリッド
          </button>
        </div>

        {/* Zoom & Pan Toolbar Controls & Map Settings Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#1a1c1e] p-1 rounded border border-[#3e3e42]">
            <button
              onClick={handleZoomIn}
              title="拡大 (Zoom In)"
              className="p-1 hover:bg-[#333] text-gray-300 hover:text-white rounded transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="縮小 (Zoom Out)"
              className="p-1 hover:bg-[#333] text-gray-300 hover:text-white rounded transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoomPan}
              title="1:1 全体表示 (Reset View)"
              className="p-1 hover:bg-[#333] text-gray-300 hover:text-amber-400 rounded transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">1:1 Fit</span>
            </button>
          </div>

          <button
            onClick={() => setShowMapControls((prev) => !prev)}
            title="地図レイヤー設定"
            className={`p-1.5 rounded border transition-colors flex items-center gap-1 font-mono text-[11px] ${
              showMapControls
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-[#1a1c1e] text-gray-300 border-[#3e3e42] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>レイヤー設定</span>
          </button>
        </div>
      </div>

      {/* Map Layer Options Settings Floating Panel */}
      {showMapControls && (
        <div className="absolute top-12 right-4 z-20 bg-[#18191c]/95 border border-[#3e3e42] p-3 rounded-lg shadow-2xl text-xs font-mono text-gray-200 w-64 backdrop-blur space-y-3">
          <div className="flex items-center justify-between border-b border-[#333] pb-1.5 font-bold text-sky-400">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              2D地図・オーバーレイ設定
            </span>
            <button
              onClick={() => setShowMapControls(false)}
              className="text-gray-400 hover:text-white font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>背景地図 透過率 (Opacity):</span>
              <span className="text-amber-400 font-bold">{Math.round(mapOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={mapOpacity}
              onChange={(e) => setMapOpacity(parseFloat(e.target.value))}
              className="w-full accent-[#00a2ed] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#333]">
            <span className="text-gray-300 text-[11px]">PLATEAU 3D建物フットプリント:</span>
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

          {/* 地図とPLATEAU建物の位置微調整 (Map Position Calibration) */}
          <div className="pt-2 border-t border-[#333] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                <Move className="w-3 h-3" />
                地図・建物位置微調整
              </span>
              <button
                onClick={() => {
                  setMapOffsetX(0);
                  setMapOffsetY(0);
                  setMapTileScale(1.0);
                }}
                className="text-[10px] bg-[#2a2b30] hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded transition-colors"
                title="標準自動位置にリセット"
              >
                自動補正リセット
              </button>
            </div>

            {/* Position Nudge Pad Buttons */}
            <div className="flex items-center justify-between bg-[#111215] p-2 rounded border border-[#2a2b30]">
              <span className="text-[10px] text-gray-400">微移動 (Nudge):</span>
              <div className="grid grid-cols-3 gap-1 w-24 text-[10px]">
                <div />
                <button
                  onClick={() => setMapOffsetY((prev) => prev - 10)}
                  className="bg-[#2d2d30] hover:bg-[#00a2ed] text-white py-0.5 rounded text-center font-bold"
                  title="上へ移動 (Y-10)"
                >
                  ↑
                </button>
                <div />
                <button
                  onClick={() => setMapOffsetX((prev) => prev - 10)}
                  className="bg-[#2d2d30] hover:bg-[#00a2ed] text-white py-0.5 rounded text-center font-bold"
                  title="左へ移動 (X-10)"
                >
                  ←
                </button>
                <button
                  onClick={() => {
                    setMapOffsetX(0);
                    setMapOffsetY(0);
                  }}
                  className="bg-sky-950 text-sky-300 border border-sky-700 py-0.5 rounded text-center text-[9px] font-bold"
                  title="原点"
                >
                  点
                </button>
                <button
                  onClick={() => setMapOffsetX((prev) => prev + 10)}
                  className="bg-[#2d2d30] hover:bg-[#00a2ed] text-white py-0.5 rounded text-center font-bold"
                  title="右へ移動 (X+10)"
                >
                  →
                </button>
                <div />
                <button
                  onClick={() => setMapOffsetY((prev) => prev + 10)}
                  className="bg-[#2d2d30] hover:bg-[#00a2ed] text-white py-0.5 rounded text-center font-bold"
                  title="下へ移動 (Y+10)"
                >
                  ↓
                </button>
                <div />
              </div>
            </div>

            {/* Offset Sliders */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>位置シフト X:</span>
                <span className="text-sky-300 font-bold">{mapOffsetX} px</span>
              </div>
              <input
                type="range"
                min="-200"
                max="200"
                step="5"
                value={mapOffsetX}
                onChange={(e) => setMapOffsetX(parseInt(e.target.value, 10))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>位置シフト Y:</span>
                <span className="text-sky-300 font-bold">{mapOffsetY} px</span>
              </div>
              <input
                type="range"
                min="-200"
                max="200"
                step="5"
                value={mapOffsetY}
                onChange={(e) => setMapOffsetY(parseInt(e.target.value, 10))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>地図スケール:</span>
                <span className="text-sky-300 font-bold">{mapTileScale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.80"
                max="1.20"
                step="0.02"
                value={mapTileScale}
                onChange={(e) => setMapTileScale(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            {/* GIS Projection System Status Badge */}
            <div className="mt-2 pt-2 border-t border-[#333] bg-emerald-950/40 border-emerald-500/30 p-2 rounded flex flex-col gap-1 text-[10px]">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  座標系自動キャリブレーション
                </span>
                <span className="bg-emerald-800 text-emerald-100 text-[9px] px-1 rounded">MATCHED</span>
              </div>
              <div className="text-gray-300 text-[9px]">
                投影変換: EPSG:6677 (平面直角IX系) ↔ Web Mercator
              </div>
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-gray-400">位置整合誤差:</span>
                <span className={gisAlignmentError <= 0.5 ? "text-emerald-300 font-mono font-bold" : "text-amber-300 font-mono font-bold"}>
                  {gisAlignmentError}m {gisAlignmentError <= 0.5 ? "(高精度)" : "(微調整中)"}
                </span>
              </div>
              <button
                onClick={() => {
                  const opt = getOptimalMapCalibration();
                  setMapOffsetX(opt.mapOffsetX);
                  setMapOffsetY(opt.mapOffsetY);
                  setMapTileScale(opt.mapTileScale);
                }}
                className="mt-1 w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-1 px-2 rounded text-[10px] flex items-center justify-center gap-1 shadow transition-colors"
              >
                <Compass className="w-3 h-3" />
                自動プロジェクション補正 (Auto Snap)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SVG Canvas Area with Wheel & Pan Listeners */}
      <div
        className="flex-1 relative overflow-hidden p-2 flex items-center justify-center bg-[#0d0e12]"
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      >
        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgHeight}
          viewBox="0 0 1000 600"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`bg-[#0a0a0d] border border-[#333] rounded shadow-2xl transition-cursor ${
            isPanning ? 'cursor-grabbing' : draggingIpId ? 'cursor-grabbing' : 'cursor-crosshair'
          }`}
        >
          {/* Main Zoom and Pan Transformation Group */}
          <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomScale})`}>
            {/* Background Grid Lines & 2D Map Tiles Layer */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1f2228" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Base Grid */}
            <rect width="8000" height="8000" x="-3500" y="-3500" fill="url(#grid)" />

            {/* Render 2D Geographical Map Tiles (GSI Standard / GSI Pale / GSI Ortho Photo / OSM Map) */}
            {mapStyle !== 'grid' && (
              <g opacity={mapOpacity} className="transition-opacity duration-300 pointer-events-none">
                {tileGrid.map((tile, i) => (
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
                        (e.currentTarget as any).style.display = 'none';
                      } catch (_) {}
                    }}
                  />
                ))}
              </g>
            )}

            {/* PLATEAU Multi-Layer Features Footprints (bldg, tran, wtr, rwy) */}
            {showPlateauOverlay &&
              (project.plateauFeatures && project.plateauFeatures.length > 0
                ? project.plateauFeatures
                : project.plateauBuildings.map((b): PlateauFeature => ({
                    id: b.id,
                    name: b.name,
                    category: 'bldg',
                    categoryLabel: '建物 (bldg)',
                    lod: 'LOD2',
                    x: b.x,
                    y: b.y,
                    z: 0,
                    width: b.width,
                    length: b.length,
                    height: b.height,
                    severity: b.severity,
                    clashDetected: b.clashDetected,
                  }))
              ).map((ft) => {
                const isCritical = ft.severity === 'critical';
                const isMajor = ft.severity === 'major';

                // Color themes by PLATEAU category
                let fillColor = isCritical
                  ? 'rgba(239, 68, 68, 0.4)'
                  : isMajor
                  ? 'rgba(245, 158, 11, 0.4)'
                  : 'rgba(59, 130, 246, 0.35)';
                let strokeColor = isCritical ? '#ef4444' : isMajor ? '#f59e0b' : '#3b82f6';
                let strokeDash = 'none';

                if (ft.category === 'tran') {
                  fillColor = 'rgba(100, 116, 139, 0.3)';
                  strokeColor = '#94a3b8';
                  strokeDash = '4,2';
                } else if (ft.category === 'wtr') {
                  fillColor = 'rgba(2, 132, 199, 0.45)';
                  strokeColor = '#38bdf8';
                } else if (ft.category === 'rwy') {
                  fillColor = 'rgba(6, 182, 212, 0.3)';
                  strokeColor = '#06b6d4';
                  strokeDash = '2,2';
                }

                return (
                  <g key={ft.id} className="pointer-events-none">
                    <rect
                      x={ft.x - ft.width / 2}
                      y={ft.y - ft.length / 2}
                      width={ft.width}
                      height={ft.length}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isCritical ? '2.5' : '1.5'}
                      strokeDasharray={strokeDash}
                      rx="2"
                    />
                    <text
                      x={ft.x}
                      y={ft.y + 3}
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

            {/* Alignment Centerline Path */}
            <path
              d={pathD}
              fill="none"
              stroke="#00a2ed"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Red Vermillion Dashed Redline Overlays from AI Agents */}
            {proposals.map((prop) => {
              if (!prop.dashedAnnotation) return null;
              const { coordinates, color, label } = prop.dashedAnnotation;
              return (
                <g key={prop.id} className="pointer-events-none">
                  {coordinates.map((coord, i) => (
                    <g key={i}>
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r="28"
                        fill="none"
                        stroke={color || '#ff3333'}
                        strokeWidth="2"
                        strokeDasharray="6,4"
                        className="animate-pulse"
                      />
                      <text
                        x={coord.x}
                        y={coord.y - 34}
                        fill={color || '#ff3333'}
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        【赤入れ】{label}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}

            {/* Tangent Lines & Interactive IP Points */}
            {project.ipPoints.map((ip) => {
              const isSelected = ip.id === selectedIpId;
              const isDragging = ip.id === draggingIpId;
              const hasViolation = ip.R > 0 && ip.R < 150;

              return (
                <g
                  key={ip.id}
                  onPointerDown={(e) => handlePointerDownIp(e, ip.id)}
                  className="cursor-grab active:cursor-grabbing group"
                >
                  {/* Drag Handle Outer Ring / Target Reticle */}
                  {isSelected && (
                    <circle
                      cx={ip.x}
                      cy={ip.y}
                      r={isDragging ? '22' : '16'}
                      fill="none"
                      stroke="#ffea00"
                      strokeWidth="1.5"
                      strokeDasharray="4,2"
                      className="animate-spin-slow"
                    />
                  )}

                  {/* Outer Touch Target Area */}
                  <circle cx={ip.x} cy={ip.y} r="18" fill="transparent" />

                  {/* IP Point Circle */}
                  <circle
                    cx={ip.x}
                    cy={ip.y}
                    r={isDragging ? '12' : isSelected ? '10' : '7'}
                    fill={isDragging ? '#00ff88' : isSelected ? '#ffea00' : hasViolation ? '#ef4444' : '#00a2ed'}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="transition-all duration-75 shadow-lg"
                  />

                  {/* Station Ticket & Label */}
                  <text
                    x={ip.x + 14}
                    y={ip.y - 14}
                    fill={isDragging ? '#00ff88' : isSelected ? '#ffea00' : '#d4d4d4'}
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="monospace"
                    className="pointer-events-none drop-shadow"
                  >
                    {ip.name} (KP{ip.kp}m)
                  </text>

                  {/* Live Coordinates Tooltip while Dragging / Selected */}
                  {(isSelected || isDragging) && (() => {
                    const geodetic = svgToLonLat(ip.x, ip.y);
                    return (
                      <g className="pointer-events-none">
                        <rect
                          x={ip.x + 12}
                          y={ip.y + 16}
                          width="180"
                          height="32"
                          fill="#1a1c1e"
                          stroke="#ffea00"
                          strokeWidth="1"
                          rx="3"
                        />
                        <text
                          x={ip.x + 18}
                          y={ip.y + 28}
                          fill="#38bdf8"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          CAD: X:{Math.round(ip.x)}m Y:{Math.round(ip.y)}m
                        </text>
                        <text
                          x={ip.x + 18}
                          y={ip.y + 42}
                          fill="#34d399"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          WGS84: {geodetic.lat.toFixed(5)}°N, {geodetic.lon.toFixed(5)}°E
                        </text>
                      </g>
                    );
                  })()}

                  {ip.R > 0 && !isDragging && (
                    <text
                      x={ip.x + 14}
                      y={ip.y + 4}
                      fill={hasViolation ? '#ef4444' : '#38bdf8'}
                      fontSize="10"
                      fontFamily="monospace"
                      className="pointer-events-none"
                    >
                      R={ip.R}m / A={ip.A1}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Fixed HUD Overlay for Zoom & Pan Mode Info */}
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
