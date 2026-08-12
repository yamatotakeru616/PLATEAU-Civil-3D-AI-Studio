import React from 'react';
import { AlignmentProject } from '../types/civil';

interface CrossSectionViewProps {
  project: AlignmentProject;
  selectedKp: number;
  onSelectKp: (kp: number) => void;
}

export const CrossSectionView: React.FC<CrossSectionViewProps> = ({
  project,
  selectedKp,
  onSelectKp,
}) => {
  const currentSection =
    project.crossSections.find((cs) => cs.kp === selectedKp) || project.crossSections[0];

  const isCut = currentSection.designElevation < currentSection.groundElevation;

  return (
    <div className="w-full h-full bg-[#0a0a0d] relative overflow-hidden select-none flex flex-col">
      {/* Station Selector Header */}
      <div className="h-9 bg-[#252526] border-b border-[#3e3e42] px-3 flex items-center justify-between text-xs text-gray-300 font-mono">
        <div className="flex items-center gap-3">
          <span className="text-[#00a2ed] font-bold">CROSS-SECTION (標準横断面 & 法面設計)</span>
          <span className="text-gray-400">測点 (Station):</span>
          <select
            value={selectedKp}
            onChange={(e) => onSelectKp(Number(e.target.value))}
            className="bg-[#333] border border-[#555] text-white px-2 py-0.5 rounded text-xs font-bold font-mono"
          >
            {project.crossSections.map((cs) => (
              <option key={cs.kp} value={cs.kp}>
                KP{cs.kp}m (切土: {cs.cutArea}m², 盛土: {cs.fillArea}m²)
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 text-xs font-mono">
          <span className="text-amber-400">地盤高 GH: {currentSection.groundElevation}m</span>
          <span className="text-[#00a2ed]">計画高 FH: {currentSection.designElevation}m</span>
        </div>
      </div>

      {/* Main Cross Section Drawing Area */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <svg width="750" height="380" viewBox="0 0 750 380" className="bg-[#0a0a0d] border border-[#222] rounded shadow-inner">
          {/* Grid background */}
          <defs>
            <pattern id="csGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1c1f26" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#csGrid)" />

          {/* Center line (CL) */}
          <line x1="375" y1="20" x2="375" y2="340" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,4" />
          <text x="375" y="16" fill="#ef4444" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            C.L. (道路中心)
          </text>

          {/* Ground surface line */}
          <path
            d="M 50 240 Q 200 220, 375 230 T 700 210"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="4,2"
          />
          <text x="680" y="200" fill="#10b981" fontSize="10" fontFamily="monospace">
            現地形 DEM (GH={currentSection.groundElevation}m)
          </text>

          {/* Road crown & slope geometry */}
          <g transform="translate(375, 170)">
            {/* Roadbed surface */}
            <path
              d="M -180 20 L 0 0 L 180 20 L 220 80 L -220 80 Z"
              fill={isCut ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}
              stroke={isCut ? '#ef4444' : '#10b981'}
              strokeWidth="2.5"
            />

            {/* Road width dimensions */}
            <line x1="-180" y1="-15" x2="180" y2="-15" stroke="#00a2ed" strokeWidth="1.5" />
            <text x="0" y="-22" fill="#00a2ed" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              車道幅員 W = {currentSection.roadWidth}m (2車線)
            </text>

            {/* Slope ratio annotations */}
            <text x="-210" y="45" fill="#fca5a5" fontSize="10" fontFamily="monospace">
              法面 {currentSection.leftSlope}
            </text>
            <text x="150" y="45" fill="#fca5a5" fontSize="10" fontFamily="monospace">
              法面 {currentSection.rightSlope}
            </text>
          </g>
        </svg>

        {/* Quantities summary card below */}
        <div className="mt-4 flex gap-6 font-mono text-xs text-gray-200 bg-[#252526] p-3 rounded border border-[#3e3e42] w-[750px] justify-between">
          <div className="flex items-center gap-2">
            <span className="text-rose-400 font-bold">切土面積 (Cut Area):</span>
            <span className="text-white text-sm font-bold">{currentSection.cutArea} m²</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">盛土面積 (Fill Area):</span>
            <span className="text-white text-sm font-bold">{currentSection.fillArea} m²</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#00a2ed] font-bold">構造区分:</span>
            <span className="text-gray-300">{isCut ? '切土土工 (Cut Section)' : '盛土土工 (Fill Section)'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
