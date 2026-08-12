import React from 'react';
import { Layers, ShieldCheck, Cpu, Box, Sparkles } from 'lucide-react';
import { AlignmentProject } from '../types/civil';

interface HeaderProps {
  project: AlignmentProject;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenGeminiModal: () => void;
  passedInvariantsCount: number;
  totalInvariantsCount: number;
  onOpenQaReportModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  activeTab,
  setActiveTab,
  onOpenGeminiModal,
  passedInvariantsCount,
  totalInvariantsCount,
  onOpenQaReportModal,
}) => {
  const tabs = [
    { id: '3d_view', label: '3D 統合ビュー (Three.js)' },
    { id: '2d_plan', label: '平面線形 2D (Clothoid)' },
    { id: 'profile', label: '縦断プロファイル (VCL)' },
    { id: 'cross_section', label: '横断・土工 (Cut/Fill)' },
    { id: 'agent_panel', label: '12 AIエージェント 赤入れ' },
    { id: 'autotest', label: '自動テスト Hook' },
  ];

  const allPassed = passedInvariantsCount === totalInvariantsCount;

  return (
    <header className="h-11 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between px-3 select-none z-20">
      {/* Left: Brand & App Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#007acc] rounded flex items-center justify-center font-extrabold text-white text-xs shadow-sm">
            C3D
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              CIVIL 3D AI Studio <span className="text-[10px] px-1.5 py-0.2 bg-[#00a2ed]/20 text-[#00a2ed] rounded border border-[#00a2ed]/40">PLATEAU×源内AI</span>
            </span>
            <span className="text-[10px] text-gray-400 truncate max-w-[280px]">
              {project.name} [{project.roadClassification} {project.designSpeedKmh}km/h]
            </span>
          </div>
        </div>

        {/* View Tabs */}
        <nav className="flex gap-0.5 ml-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-xs rounded-t transition-colors font-medium border-t border-x ${
                  isActive
                    ? 'bg-[#1a1c1e] text-[#00a2ed] border-[#555] font-bold border-t-2 border-t-[#00a2ed]'
                    : 'text-gray-300 hover:text-white hover:bg-[#3e3e42]/60 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 text-xs">
        {/* Gemini RAG Button */}
        <button
          onClick={onOpenGeminiModal}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#007acc]/20 hover:bg-[#007acc]/30 border border-[#007acc]/50 text-[#00a2ed] rounded text-xs transition-all font-medium"
          title="道路構造令 RAG 法令解説 AI を起動"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00a2ed] animate-pulse" />
          <span>道路構造令 Gemini RAG</span>
        </button>

        {/* AutoTest Invariant Badge */}
        <div
          onClick={() => {
            if (onOpenQaReportModal) {
              onOpenQaReportModal();
            } else {
              setActiveTab('autotest');
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs cursor-pointer border font-mono transition-all ${
            allPassed
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-300 animate-pulse'
          }`}
          title="不変条件 (Invariants) リアルタイム自動テスト状態"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Invariants: {passedInvariantsCount}/{totalInvariantsCount}</span>
        </div>

        {/* Projection Info */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-400 border-l border-[#3e3e42] pl-3">
          <span className="font-mono">EPSG:6677 (平面直角IX)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
      </div>
    </header>
  );
};
