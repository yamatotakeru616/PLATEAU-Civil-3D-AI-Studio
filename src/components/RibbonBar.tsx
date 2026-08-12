import React from 'react';
import {
  Plus,
  Wand2,
  Calculator,
  ShieldAlert,
  Building2,
  Box,
  CheckCheck,
  RefreshCw,
  Compass,
  FileCheck2,
} from 'lucide-react';
import { AlignmentProject } from '../types/civil';

interface RibbonBarProps {
  project: AlignmentProject;
  onExecuteSkill: (command: string) => void;
  onAutoFixAll: () => void;
}

export const RibbonBar: React.FC<RibbonBarProps> = ({
  project,
  onExecuteSkill,
  onAutoFixAll,
}) => {
  return (
    <div className="h-20 bg-[#252526] border-b border-[#3e3e42] flex items-center px-3 gap-4 text-xs overflow-x-auto select-none">
      {/* 1. 線形ツール Group */}
      <div className="flex flex-col items-center gap-1 pr-3 border-r border-[#3e3e42]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onExecuteSkill('skill:add_ip_point')}
            className="flex flex-col items-center p-1.5 bg-[#333] hover:bg-[#007acc]/30 border border-[#444] rounded text-gray-200 hover:text-white hover:border-[#007acc] transition-all group"
            title="IP点を追加"
          >
            <Plus className="w-5 h-5 text-[#00a2ed]" />
            <span className="text-[10px] mt-0.5">IP追加</span>
          </button>
          <button
            onClick={() => onExecuteSkill('skill:optimize_clothoid')}
            className="flex flex-col items-center p-1.5 bg-[#333] hover:bg-[#007acc]/30 border border-[#444] rounded text-gray-200 hover:text-white hover:border-[#007acc] transition-all"
            title="クロソイドAパラメータを自動計算最適化"
          >
            <Wand2 className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] mt-0.5">クロソイド最適</span>
          </button>
        </div>
        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">平面線形 (Alignments)</span>
      </div>

      {/* 2. 土工 & 横断 Group */}
      <div className="flex flex-col items-center gap-1 pr-3 border-r border-[#3e3e42]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onExecuteSkill('skill:calculate_earthwork')}
            className="flex flex-col items-center p-1.5 bg-[#333] hover:bg-[#007acc]/30 border border-[#444] rounded text-gray-200 hover:text-white hover:border-[#007acc] transition-all"
            title="平均断面法による土工量(Cut/Fill)再集計"
          >
            <Calculator className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] mt-0.5">土工集計</span>
          </button>
          <button
            onClick={() => onExecuteSkill('skill:suggest_structure')}
            className="flex flex-col items-center p-1.5 bg-[#333] hover:bg-[#007acc]/30 border border-[#444] rounded text-gray-200 hover:text-white hover:border-[#007acc] transition-all"
            title="F-103構造物マトリクス判定"
          >
            <Box className="w-5 h-5 text-cyan-400" />
            <span className="text-[10px] mt-0.5">構造物選定</span>
          </button>
        </div>
        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">横断・構造物 (Corridors)</span>
      </div>

      {/* 3. PLATEAU & 法令 RAG Group */}
      <div className="flex flex-col items-center gap-1 pr-3 border-r border-[#3e3e42]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onExecuteSkill('skill:detect_plateau_clash')}
            className="flex flex-col items-center p-1.5 bg-[#333] hover:bg-[#007acc]/30 border border-[#444] rounded text-gray-200 hover:text-white hover:border-[#007acc] transition-all"
            title="PLATEAU 3Dモデル立体干渉検知"
          >
            <Building2 className="w-5 h-5 text-rose-400" />
            <span className="text-[10px] mt-0.5">PLATEAU干渉</span>
          </button>
          <button
            onClick={() => onExecuteSkill('skill:check_compliance')}
            className="flex flex-col items-center p-1.5 bg-[#333] hover:bg-[#007acc]/30 border border-[#444] rounded text-gray-200 hover:text-white hover:border-[#007acc] transition-all"
            title="道路構造令照合"
          >
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <span className="text-[10px] mt-0.5">道路構造令</span>
          </button>
        </div>
        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">PLATEAU & RAG</span>
      </div>

      {/* 4. 源内AI 11エージェント & 一括自動修復 */}
      <div className="flex flex-col items-center gap-1 pr-3 border-r border-[#3e3e42]">
        <button
          onClick={onAutoFixAll}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#007acc] to-indigo-600 hover:from-[#00a2ed] hover:to-indigo-500 text-white rounded font-bold shadow transition-all border border-[#00a2ed]/50 text-xs"
        >
          <CheckCheck className="w-4 h-4" />
          <div className="flex flex-col text-left leading-tight">
            <span>源内AI 一括自動修正</span>
            <span className="text-[9px] font-normal opacity-90">R値・縦断勾配・干渉を1発解決</span>
          </div>
        </button>
        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Auto-Fix Engine</span>
      </div>

      {/* 5. 3D Mesh Generator */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => onExecuteSkill('skill:generate_3d_mesh')}
          className="flex flex-col items-center p-1.5 bg-[#333] hover:bg-[#007acc]/30 border border-[#444] rounded text-gray-200 hover:text-white hover:border-[#007acc] transition-all"
          title="Three.js 3D道路メッシュ再描画"
        >
          <RefreshCw className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] mt-0.5">3Dメッシュ更新</span>
        </button>
        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">3D Render</span>
      </div>
    </div>
  );
};
