import React, { useState } from 'react';
import {
  Folder,
  ChevronDown,
  ChevronRight,
  Compass,
  Building,
  Layers,
  Cpu,
  ShieldCheck,
  MapPin,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { AlignmentProject, TestInvariantResult } from '../types/civil';

interface ToolspaceProspectorProps {
  project: AlignmentProject;
  invariants: TestInvariantResult[];
  selectedIpId: string | null;
  onSelectIp: (id: string) => void;
  onSelectBuilding: (id: string) => void;
}

export const ToolspaceProspector: React.FC<ToolspaceProspectorProps> = ({
  project,
  invariants,
  selectedIpId,
  onSelectIp,
  onSelectBuilding,
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    alignments: true,
    profiles: true,
    plateau: true,
    agents: true,
    invariants: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const agentList = [
    { name: '1. Orchestrator Agent', status: 'Active (統合制御)' },
    { name: '2. 線形設計 Agent', status: 'Active (クロソイド演算)' },
    { name: '3. 縦断設計 Agent', status: 'Active (VCL勾配計算)' },
    { name: '4. 横断/土工 Agent', status: 'Active (平均断面法)' },
    { name: '5. 道路構造令 RAG Agent', status: 'Active (Gemini連携)' },
    { name: '6. 構造物選定 Agent', status: 'Active (F-103判定)' },
    { name: '7. PLATEAU/地形統合 Agent', status: 'Active (3D干渉検知)' },
    { name: '8. 検証/QA Agent', status: 'Active (Hookテスト)' },
    { name: '9. ドキュメント同期 Agent', status: 'Active (仕様書同期)' },
    { name: '10. ナレッジグラフ/ctx Agent', status: 'Active (GraphIndex)' },
    { name: '11. CAD Agent', status: 'Active (Three.js/LOD)' },
    { name: '12. UI/機能総合検証 Agent', status: 'Active (動的UI検証)' },
  ];

  return (
    <aside className="w-64 bg-[#252526] border-r border-[#3e3e42] flex flex-col h-full text-xs select-none">
      {/* Header */}
      <div className="p-2 bg-[#2d2d30] text-[10px] uppercase tracking-widest font-bold border-b border-[#3e3e42] text-gray-300 flex items-center justify-between">
        <span>Toolspace - Prospector</span>
        <span className="text-[9px] px-1 bg-[#3e3e42] text-emerald-400 rounded">LIVE</span>
      </div>

      {/* Prospector Tree */}
      <div className="flex-1 p-2 overflow-y-auto space-y-2 text-gray-300 font-mono text-[11px]">
        {/* Drawing Root */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 font-bold text-gray-200">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>Drawing1 [東京バイパス]</span>
          </div>

          {/* 1. Alignments Section */}
          <div className="pl-3 space-y-1">
            <div
              onClick={() => toggleSection('alignments')}
              className="flex items-center gap-1 cursor-pointer hover:text-white text-[#00a2ed] font-semibold"
            >
              {openSections.alignments ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Compass className="w-3.5 h-3.5" />
              <span>平面線形 (Alignments) [{project.ipPoints.length} IP]</span>
            </div>

            {openSections.alignments && (
              <div className="pl-4 space-y-0.5 text-gray-400 font-sans">
                {project.ipPoints.map((ip) => {
                  const isSelected = ip.id === selectedIpId;
                  const hasViolation = ip.R > 0 && ip.R < 150;
                  return (
                    <div
                      key={ip.id}
                      onClick={() => onSelectIp(ip.id)}
                      className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#007acc] text-white font-medium'
                          : 'hover:bg-[#333] hover:text-gray-200'
                      }`}
                    >
                      <span className="truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#00a2ed]" />
                        {ip.name}
                      </span>
                      {hasViolation && <span className="text-[9px] text-rose-400 font-bold px-1 bg-rose-950/60 rounded">R={ip.R}m</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Profiles Section */}
          <div className="pl-3 space-y-1">
            <div
              onClick={() => toggleSection('profiles')}
              className="flex items-center gap-1 cursor-pointer hover:text-white text-[#00a2ed] font-semibold"
            >
              {openSections.profiles ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Layers className="w-3.5 h-3.5" />
              <span>縦断計画 (Profiles) [{project.verticalIPs.length} VVIP]</span>
            </div>

            {openSections.profiles && (
              <div className="pl-4 space-y-0.5 text-gray-400 font-sans">
                {project.verticalIPs.map((v) => (
                  <div key={v.id} className="flex justify-between px-1.5 py-0.5 hover:bg-[#333] rounded">
                    <span>KP{v.kp}m</span>
                    <span className="text-gray-500">{v.gradientOut}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. PLATEAU 3D Models */}
          <div className="pl-3 space-y-1">
            <div
              onClick={() => toggleSection('plateau')}
              className="flex items-center gap-1 cursor-pointer hover:text-white text-indigo-400 font-semibold"
            >
              {openSections.plateau ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span>PLATEAU 3D層 (4Layers)</span>
            </div>

            {openSections.plateau && (
              <div className="pl-4 space-y-0.5 text-gray-400 font-sans">
                {project.plateauBuildings.map((bld) => (
                  <div
                    key={bld.id}
                    onClick={() => onSelectBuilding(bld.id)}
                    className="flex items-center justify-between px-1.5 py-0.5 hover:bg-[#333] rounded cursor-pointer truncate"
                  >
                    <span className="truncate">{bld.name}</span>
                    <span className="text-[9px] text-indigo-300 font-mono">{bld.height}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. 12 AI Agents Status */}
          <div className="pl-3 space-y-1">
            <div
              onClick={() => toggleSection('agents')}
              className="flex items-center gap-1 cursor-pointer hover:text-white text-emerald-400 font-semibold"
            >
              {openSections.agents ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>12 源内AIエージェント</span>
            </div>

            {openSections.agents && (
              <div className="pl-4 space-y-0.5 text-gray-400 font-sans">
                {agentList.map((ag) => (
                  <div key={ag.name} className="flex justify-between px-1.5 py-0.5 hover:bg-[#333] rounded text-[10px]">
                    <span className="truncate max-w-[140px] text-gray-300">{ag.name}</span>
                    <span className="text-emerald-400 font-mono text-[9px]">ONLINE</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. AutoTest Invariants */}
          <div className="pl-3 space-y-1">
            <div
              onClick={() => toggleSection('invariants')}
              className="flex items-center gap-1 cursor-pointer hover:text-white text-amber-400 font-semibold"
            >
              {openSections.invariants ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>自動テスト Invariants ({invariants.filter((i) => i.passed).length}/{invariants.length})</span>
            </div>

            {openSections.invariants && (
              <div className="pl-4 space-y-1 text-gray-400 font-sans">
                {invariants.map((inv) => (
                  <div
                    key={inv.id}
                    className={`p-1 rounded text-[10px] border ${
                      inv.passed
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                        : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span className="truncate">{inv.name}</span>
                      {inv.passed ? <Check className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-rose-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
