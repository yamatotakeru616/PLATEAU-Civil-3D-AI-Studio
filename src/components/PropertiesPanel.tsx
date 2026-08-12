import React from 'react';
import { AlignmentProject } from '../types/civil';

interface PropertiesPanelProps {
  project: AlignmentProject;
  selectedIpId: string | null;
  onUpdateRadius: (ipId: string, newR: number) => void;
  onUpdateIpPosition?: (ipId: string, newX: number, newY: number) => void;
  onUpdateElevation?: (ipId: string, newElevation: number) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  project,
  selectedIpId,
  onUpdateRadius,
  onUpdateIpPosition,
  onUpdateElevation,
}) => {
  const selectedIp = project.ipPoints.find((ip) => ip.id === selectedIpId) || project.ipPoints[1];

  const handleNudge = (deltaX: number, deltaY: number) => {
    if (onUpdateIpPosition) {
      const newX = Math.max(20, Math.min(980, selectedIp.x + deltaX));
      const newY = Math.max(20, Math.min(580, selectedIp.y + deltaY));
      onUpdateIpPosition(selectedIp.id, newX, newY);
    }
  };

  const handleElevationChange = (newEl: number) => {
    if (onUpdateElevation) {
      onUpdateElevation(selectedIp.id, newEl);
    }
  };

  return (
    <aside className="w-72 bg-[#252526] border-l border-[#3e3e42] flex flex-col h-full text-xs select-none">
      {/* Header */}
      <div className="p-2 bg-[#2d2d30] text-[10px] uppercase tracking-widest font-bold border-b border-[#3e3e42] text-gray-300">
        Properties - CAD Inspector
      </div>

      <div className="p-3 space-y-4 overflow-y-auto flex-1 font-sans">
        {/* Selection Category */}
        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Selection Object</label>
          <div className="text-sm text-[#00a2ed] font-bold font-mono truncate">{selectedIp.name}</div>
        </div>

        {/* Alignment Properties */}
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between border-b border-[#333] pb-1">
            <span className="text-gray-500">測点 (KP)</span>
            <span className="text-white">KP{selectedIp.kp}m</span>
          </div>

          {/* Editable X Coordinate */}
          <div className="border-b border-[#333] pb-1.5 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">X 座標 (E)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={Math.round(selectedIp.x)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && onUpdateIpPosition) {
                      onUpdateIpPosition(selectedIp.id, val, selectedIp.y);
                    }
                  }}
                  className="w-20 px-1.5 py-0.5 bg-[#1a1c1e] border border-[#444] rounded text-right text-sky-300 text-xs font-mono focus:border-[#00a2ed] focus:outline-none"
                />
                <span className="text-gray-500 text-[10px]">m</span>
              </div>
            </div>
          </div>

          {/* Editable Y Coordinate */}
          <div className="border-b border-[#333] pb-1.5 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Y 座標 (N)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={Math.round(selectedIp.y)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && onUpdateIpPosition) {
                      onUpdateIpPosition(selectedIp.id, selectedIp.x, val);
                    }
                  }}
                  className="w-20 px-1.5 py-0.5 bg-[#1a1c1e] border border-[#444] rounded text-right text-sky-300 text-xs font-mono focus:border-[#00a2ed] focus:outline-none"
                />
                <span className="text-gray-500 text-[10px]">m</span>
              </div>
            </div>
          </div>

          {/* Nudge Movement Buttons */}
          <div className="p-2 bg-[#1a1c1e] rounded border border-[#3e3e42] space-y-1.5">
            <div className="text-[10px] text-amber-400 font-bold flex items-center justify-between">
              <span>IP点位置 微調整 (Nudge Move)</span>
              <span className="text-[9px] text-gray-500">Δ = 25m</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center font-bold text-[10px]">
              <div />
              <button
                onClick={() => handleNudge(0, -25)}
                className="py-1 bg-[#333] hover:bg-[#00a2ed] hover:text-white text-gray-200 rounded border border-gray-600 active:scale-95 transition-all"
              >
                ▲ 北
              </button>
              <div />
              <button
                onClick={() => handleNudge(-25, 0)}
                className="py-1 bg-[#333] hover:bg-[#00a2ed] hover:text-white text-gray-200 rounded border border-gray-600 active:scale-95 transition-all"
              >
                ◀ 西
              </button>
              <div className="py-1 text-gray-500 text-[9px] flex items-center justify-center">IP</div>
              <button
                onClick={() => handleNudge(25, 0)}
                className="py-1 bg-[#333] hover:bg-[#00a2ed] hover:text-white text-gray-200 rounded border border-gray-600 active:scale-95 transition-all"
              >
                東 ▶
              </button>
              <div />
              <button
                onClick={() => handleNudge(0, 25)}
                className="py-1 bg-[#333] hover:bg-[#00a2ed] hover:text-white text-gray-200 rounded border border-gray-600 active:scale-95 transition-all"
              >
                ▼ 南
              </button>
              <div />
            </div>
          </div>

          {/* Editable Elevation GH */}
          <div className="border-b border-[#333] pb-2 pt-1 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-emerald-400 font-bold">計画標高 (GH)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={selectedIp.elevation}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) {
                      handleElevationChange(val);
                    }
                  }}
                  className="w-20 px-1.5 py-0.5 bg-[#1a1c1e] border border-[#00a2ed] rounded text-right text-emerald-400 font-bold text-xs font-mono focus:outline-none"
                />
                <span className="text-gray-500 text-[10px]">m</span>
              </div>
            </div>
            {/* Quick Elevation Nudge Buttons */}
            <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
              <button
                onClick={() => handleElevationChange(Number((selectedIp.elevation - 1.0).toFixed(1)))}
                className="py-0.5 bg-[#333] hover:bg-rose-600 hover:text-white text-gray-300 rounded border border-gray-600 active:scale-95 transition-all"
              >
                -1.0m
              </button>
              <button
                onClick={() => handleElevationChange(Number((selectedIp.elevation - 0.2).toFixed(1)))}
                className="py-0.5 bg-[#333] hover:bg-amber-600 hover:text-white text-gray-300 rounded border border-gray-600 active:scale-95 transition-all"
              >
                -0.2m
              </button>
              <button
                onClick={() => handleElevationChange(Number((selectedIp.elevation + 0.2).toFixed(1)))}
                className="py-0.5 bg-[#333] hover:bg-emerald-600 hover:text-white text-gray-300 rounded border border-gray-600 active:scale-95 transition-all"
              >
                +0.2m
              </button>
              <button
                onClick={() => handleElevationChange(Number((selectedIp.elevation + 1.0).toFixed(1)))}
                className="py-0.5 bg-[#333] hover:bg-sky-600 hover:text-white text-gray-300 rounded border border-gray-600 active:scale-95 transition-all"
              >
                +1.0m
              </button>
            </div>
          </div>

          {/* Editable Radius */}
          <div className="border-b border-[#333] pb-2 pt-1 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-amber-400 font-bold">曲線半径 (R)</span>
              <span className={selectedIp.R > 0 && selectedIp.R < 150 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {selectedIp.R} m
              </span>
            </div>
            {selectedIp.R > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min="80"
                  max="300"
                  step="10"
                  value={selectedIp.R}
                  onChange={(e) => onUpdateRadius(selectedIp.id, Number(e.target.value))}
                  className="w-full accent-[#00a2ed] cursor-pointer h-1.5 bg-[#333] rounded"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between border-b border-[#333] pb-1">
            <span className="text-gray-500">クロソイド A1</span>
            <span className="text-cyan-400 font-bold">{selectedIp.A1}</span>
          </div>

          <div className="flex justify-between border-b border-[#333] pb-1">
            <span className="text-gray-500">道路区分</span>
            <span className="text-gray-300">{project.roadClassification}</span>
          </div>

          <div className="flex justify-between border-b border-[#333] pb-1">
            <span className="text-gray-500">設計速度</span>
            <span className="text-gray-300">{project.designSpeedKmh} km/h</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={() => onUpdateRadius(selectedIp.id, 180)}
            className="w-full py-2 bg-[#007acc] hover:bg-[#00a2ed] text-white text-xs rounded font-medium shadow border border-[#00a2ed]/40 transition-colors"
          >
            規格適合半径 R=180m を一括適用
          </button>
        </div>
      </div>
    </aside>
  );
};
