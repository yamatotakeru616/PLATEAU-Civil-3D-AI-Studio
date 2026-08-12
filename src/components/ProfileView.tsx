import React, { useRef, useState } from 'react';
import { AlignmentProject } from '../types/civil';

interface ProfileViewProps {
  project: AlignmentProject;
  onSelectVerticalIp?: (id: string) => void;
  onUpdateElevation?: (vipId: string, newElevation: number) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  project,
  onSelectVerticalIp,
  onUpdateElevation,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedVipId, setSelectedVipId] = useState<string | null>(project.verticalIPs[1]?.id || 'vip-2');
  const [draggingVipId, setDraggingVipId] = useState<string | null>(null);

  const svgWidth = 900;
  const svgHeight = 450;

  // Scale calculations for profile
  const minKp = 0;
  const maxKp = 1100;
  const minEl = 5;
  const maxEl = 40;

  const mapX = (kp: number) => 60 + ((kp - minKp) / (maxKp - minKp)) * (svgWidth - 100);
  const mapY = (el: number) => svgHeight - 60 - ((el - minEl) / (maxEl - minEl)) * (svgHeight - 100);

  const unmapY = (svgY: number) => {
    const ratio = (svgHeight - 60 - svgY) / (svgHeight - 100);
    const rawEl = minEl + ratio * (maxEl - minEl);
    return Math.max(minEl, Math.min(maxEl, Number(rawEl.toFixed(1))));
  };

  const getSvgY = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * svgHeight;
    return y;
  };

  const handlePointerDownVip = (e: React.PointerEvent, vipId: string) => {
    e.stopPropagation();
    setSelectedVipId(vipId);
    setDraggingVipId(vipId);
    if (onSelectVerticalIp) onSelectVerticalIp(vipId);
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingVipId || !onUpdateElevation) return;
    const svgY = getSvgY(e);
    const newEl = unmapY(svgY);
    onUpdateElevation(draggingVipId, newEl);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingVipId) {
      if (e.currentTarget.releasePointerCapture) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
      setDraggingVipId(null);
    }
  };

  const activeVip = project.verticalIPs.find((v) => v.id === selectedVipId) || project.verticalIPs[1];

  const handleNudgeElevation = (delta: number) => {
    if (activeVip && onUpdateElevation) {
      const nextEl = Math.max(minEl, Math.min(maxEl, Number((activeVip.elevation + delta).toFixed(1))));
      onUpdateElevation(activeVip.id, nextEl);
    }
  };

  // Ground elevation path
  const groundD = project.crossSections.reduce((acc, cs, idx) => {
    const x = mapX(cs.kp);
    const y = mapY(cs.groundElevation);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Design elevation path
  const designD = project.verticalIPs.reduce((acc, vip, idx) => {
    const x = mapX(vip.kp);
    const y = mapY(vip.elevation);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  return (
    <div className="w-full h-full bg-[#0a0a0d] relative overflow-hidden select-none flex flex-col">
      {/* Header Bar */}
      <div className="h-9 bg-[#252526] border-b border-[#3e3e42] px-3 flex items-center justify-between text-xs text-gray-300 font-mono">
        <div className="flex items-center gap-3">
          <span className="text-[#00a2ed] font-bold">PROFILE VIEW (縦断プロファイル & VCL)</span>
          <span className="text-gray-500">VCL: 縦断曲線半径</span>
          <span className="text-emerald-400">制止視距: S ≥ 75m</span>
        </div>
        <div className="text-[11px] text-amber-400 font-bold animate-pulse">
          ⚡ [縦断計画高ドラッグ可能] 縦断IP点(VIP)を直接上下ドラッグまたはボタンで変更できます
        </div>
      </div>

      {/* Quick Elevation Control Banner */}
      {activeVip && (
        <div className="bg-[#1a1c1e] border-b border-[#3e3e42] px-4 py-1.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-bold">選択中縦断IP:</span>
            <span className="text-amber-400 font-bold">KP{activeVip.kp}m</span>
            <span className="text-gray-400">計画高 GH =</span>
            <input
              type="number"
              step="0.1"
              value={activeVip.elevation}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!isNaN(val) && onUpdateElevation) {
                  onUpdateElevation(activeVip.id, val);
                }
              }}
              className="w-20 px-2 py-0.5 bg-[#0d0e12] border border-[#00a2ed] rounded text-emerald-400 font-bold text-center focus:outline-none"
            />
            <span className="text-gray-400">m</span>
            <span className="text-gray-500 text-[11px] ml-2">
              (勾配Out: <span className={Math.abs(activeVip.gradientOut) > 5.0 ? 'text-rose-400 font-bold' : 'text-sky-300'}>{activeVip.gradientOut}%</span>)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-[10px]">微調整:</span>
            <button
              onClick={() => handleNudgeElevation(-1.0)}
              className="px-2 py-0.5 bg-[#2d2d30] hover:bg-[#ef4444] text-white rounded border border-gray-600 text-[11px] transition-colors"
            >
              -1.0m
            </button>
            <button
              onClick={() => handleNudgeElevation(-0.2)}
              className="px-2 py-0.5 bg-[#2d2d30] hover:bg-[#f97316] text-white rounded border border-gray-600 text-[11px] transition-colors"
            >
              -0.2m
            </button>
            <button
              onClick={() => handleNudgeElevation(0.2)}
              className="px-2 py-0.5 bg-[#2d2d30] hover:bg-[#10b981] text-white rounded border border-gray-600 text-[11px] transition-colors"
            >
              +0.2m
            </button>
            <button
              onClick={() => handleNudgeElevation(1.0)}
              className="px-2 py-0.5 bg-[#2d2d30] hover:bg-[#00a2ed] text-white rounded border border-gray-600 text-[11px] transition-colors"
            >
              +1.0m
            </button>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="flex-1 p-4 flex items-center justify-center overflow-auto bg-[#0d0e12]">
        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`bg-[#0a0a0d] border border-[#333] rounded shadow-2xl ${
            draggingVipId ? 'cursor-ns-resize' : 'cursor-crosshair'
          }`}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="profileGrid" width="60" height="40" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 40" fill="none" stroke="#1f2228" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#profileGrid)" />

          {/* Axes */}
          <line x1="60" y1="30" x2="60" y2={svgHeight - 60} stroke="#444" strokeWidth="2" />
          <line x1="60" y1={svgHeight - 60} x2={svgWidth - 40} y2={svgHeight - 60} stroke="#444" strokeWidth="2" />

          {/* Y Axis Labels (Elevation m) */}
          {[10, 20, 30, 40].map((el) => (
            <g key={el}>
              <text x="50" y={mapY(el) + 4} fill="#888" fontSize="10" fontFamily="monospace" textAnchor="end">
                {el}m
              </text>
              <line x1="56" y1={mapY(el)} x2="60" y2={mapY(el)} stroke="#666" />
            </g>
          ))}

          {/* Ground Elevation Line */}
          <path d={groundD} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4,2" />

          {/* Design Elevation Line */}
          <path d={designD} fill="none" stroke="#00a2ed" strokeWidth="3" />

          {/* Vertical IPs & Interactive Drag Handles */}
          {project.verticalIPs.map((vip) => {
            const x = mapX(vip.kp);
            const y = mapY(vip.elevation);
            const isSelected = vip.id === selectedVipId;
            const isDragging = vip.id === draggingVipId;
            const hasGradViolation = Math.abs(vip.gradientOut) > 5.0;

            return (
              <g
                key={vip.id}
                onPointerDown={(e) => handlePointerDownVip(e, vip.id)}
                className="cursor-ns-resize active:cursor-grabbing group"
              >
                {/* Target Ring */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isDragging ? '20' : '15'}
                    fill="none"
                    stroke="#ffea00"
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                    className="animate-spin-slow"
                  />
                )}

                {/* Touch Hit Area */}
                <circle cx={x} cy={y} r="18" fill="transparent" />

                {/* VIP point dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isDragging ? '11' : isSelected ? '9' : '6'}
                  fill={isDragging ? '#00ff88' : isSelected ? '#ffea00' : hasGradViolation ? '#ef4444' : '#00a2ed'}
                  stroke="#fff"
                  strokeWidth="2.5"
                  className="transition-all duration-75 shadow-lg"
                />

                {/* KP & Elevation Label */}
                <text
                  x={x}
                  y={y - 14}
                  fill={isDragging ? '#00ff88' : isSelected ? '#ffea00' : '#e2e8f0'}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow"
                >
                  KP{vip.kp}m (GH={vip.elevation.toFixed(1)}m)
                </text>

                {vip.vclRadius > 0 && !isDragging && (
                  <text
                    x={x}
                    y={y + 20}
                    fill={hasGradViolation ? '#fca5a5' : '#38bdf8'}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    i={vip.gradientOut}% / VCL R={vip.vclRadius}m
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

