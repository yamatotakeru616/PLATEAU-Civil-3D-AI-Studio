import React, { useState } from 'react';
import { AgentProposal, AlignmentProject, AgentInfo, AgentLogEntry } from '../types/civil';
import {
  AlertTriangle,
  Sparkles,
  Cpu,
  ArrowRight,
  ChevronRight,
  Activity,
  Bot,
  Terminal,
  RefreshCw,
  Zap,
  Trash2,
  Check,
  Search,
  CheckCircle2,
} from 'lucide-react';

interface AgentPanelProps {
  project: AlignmentProject;
  proposals: AgentProposal[];
  agents: AgentInfo[];
  agentLogs: AgentLogEntry[];
  isAutonomousMode: boolean;
  setIsAutonomousMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleAgentAutoRun: (agentId: string) => void;
  runSingleAgentReasoning: (agentId: string) => void;
  clearLogs: () => void;
  onAutoFixAll: () => void;
  onOpenGeminiRagModal: () => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  project,
  proposals,
  agents,
  agentLogs,
  isAutonomousMode,
  setIsAutonomousMode,
  toggleAgentAutoRun,
  runSingleAgentReasoning,
  clearLogs,
  onAutoFixAll,
  onOpenGeminiRagModal,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'proposals' | 'logs'>('matrix');
  const [selectedProp, setSelectedProp] = useState<AgentProposal | null>(proposals[0] || null);
  const [logFilter, setLogFilter] = useState<string>('');

  const filteredLogs = agentLogs.filter((log) => {
    if (!logFilter) return true;
    return (
      log.agentName.toLowerCase().includes(logFilter.toLowerCase()) ||
      log.message.toLowerCase().includes(logFilter.toLowerCase())
    );
  });

  return (
    <div className="w-full h-full bg-[#1a1c1e] text-gray-200 flex flex-col select-none overflow-hidden font-sans">
      {/* Top Bar Header */}
      <div className="p-2.5 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-rose-500 animate-pulse" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              源内AI 12エージェント自律統合システム
            </h2>
          </div>

          {/* Mode Badge */}
          <button
            onClick={() => setIsAutonomousMode((prev) => !prev)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono flex items-center gap-1.5 border transition-all ${
              isAutonomousMode
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 shadow-sm shadow-emerald-900/50'
                : 'bg-gray-800 text-gray-400 border-gray-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAutonomousMode ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'
              }`}
            />
            <span>{isAutonomousMode ? '⚡ 自律連動 ON (Autonomous)' : '⏸ 自律連動 OFF (Paused)'}</span>
          </button>
        </div>

        {/* Sub-Tabs Switcher & Quick Fix */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#1a1c1e] p-0.5 rounded border border-[#3e3e42] text-xs font-mono font-medium">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-[#00a2ed] text-white font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>12エージェント自律モニター ({agents.filter((a) => a.autoRun).length}/{agents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('proposals')}
              className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                activeTab === 'proposals'
                  ? 'bg-[#00a2ed] text-white font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>赤入れ提案集約 ({proposals.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-[#00a2ed] text-white font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>自律思考ストリーム ({agentLogs.length})</span>
            </button>
          </div>

          <button
            onClick={onAutoFixAll}
            className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs rounded shadow border border-rose-400/40 flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>全赤入れ一括反映 (Auto-Fix)</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-hidden bg-[#1a1c1e]">
        {/* TAB 1: 11 AGENTS AUTONOMOUS MATRIX */}
        {activeTab === 'matrix' && (
          <div className="w-full h-full p-3 overflow-y-auto bg-[#1a1c1e] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map((ag) => {
              const isAnalyzing = ag.status === 'analyzing';
              return (
                <div
                  key={ag.id}
                  className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                    isAnalyzing
                      ? 'bg-[#2a2a30] border-amber-500/60 shadow-md shadow-amber-950/30'
                      : ag.autoRun
                      ? 'bg-[#252526] border-[#3e3e42] hover:border-sky-500/50'
                      : 'bg-[#1e1e20] border-gray-800 opacity-70'
                  }`}
                >
                  <div>
                    {/* Header line */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-rose-950/80 border border-rose-600/50 text-rose-300 font-mono font-bold text-[10px] flex items-center justify-center">
                          {ag.number}
                        </span>
                        <h3 className="text-xs font-bold text-white tracking-tight">{ag.name}</h3>
                      </div>

                      {/* Status indicator */}
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                          isAnalyzing
                            ? 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse'
                            : ag.autoRun
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-gray-800 text-gray-500 border-gray-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isAnalyzing
                              ? 'bg-amber-400'
                              : ag.autoRun
                              ? 'bg-emerald-400 animate-ping'
                              : 'bg-gray-500'
                          }`}
                        />
                        <span>{isAnalyzing ? '分析中...' : ag.autoRun ? '自律稼働中' : '停止中'}</span>
                      </span>
                    </div>

                    {/* Role description */}
                    <p className="text-[11px] text-gray-400 mb-2 leading-tight">{ag.role}</p>

                    {/* Latest thought balloon */}
                    <div className="p-2 rounded bg-[#1a1c1e] border border-[#333] text-[11px] text-sky-200/90 font-mono mb-3 space-y-1">
                      <div className="flex items-center justify-between text-[9px] text-gray-500">
                        <span>LATEST AUTONOMOUS THOUGHT</span>
                        <span>{ag.lastRunTime}</span>
                      </div>
                      <p className="line-clamp-2 leading-relaxed">{ag.latestThought}</p>
                    </div>
                  </div>

                  {/* Footer controls */}
                  <div className="pt-2 border-t border-[#3a3a3e] flex items-center justify-between text-xs font-mono">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={ag.autoRun}
                        onChange={() => toggleAgentAutoRun(ag.id)}
                        className="rounded bg-[#1a1c1e] border-gray-600 text-rose-500 focus:ring-0 cursor-pointer"
                      />
                      <span>自律ON</span>
                    </label>

                    <button
                      onClick={() => runSingleAgentReasoning(ag.id)}
                      disabled={isAnalyzing}
                      className="px-2.5 py-1 bg-sky-900/80 hover:bg-sky-800 text-sky-200 border border-sky-600/50 rounded text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Gemini自律推論</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: PROPOSALS REDLINE AGGREGATION */}
        {activeTab === 'proposals' && (
          <div className="w-full h-full flex overflow-hidden">
            {/* Proposals List */}
            <div className="w-1/2 border-r border-[#3e3e42] overflow-y-auto p-3 space-y-2 bg-[#252526]">
              {proposals.map((prop) => {
                const isSelected = selectedProp?.id === prop.id;
                return (
                  <div
                    key={prop.id}
                    onClick={() => setSelectedProp(prop)}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#2d2d30] border-[#00a2ed] shadow-md ring-1 ring-[#00a2ed]/50'
                        : 'bg-[#1a1c1e] border-[#3e3e42] hover:border-[#555]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/50">
                        {prop.agentName}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        Confidence: {(prop.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white mb-1">{prop.title}</h3>
                    <p className="text-[11px] text-gray-400 line-clamp-2 mb-2">{prop.description}</p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-[#00a2ed]">
                      <span>提案: {prop.suggestedAction.slice(0, 32)}...</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Proposal Detail */}
            <div className="w-1/2 p-4 overflow-y-auto bg-[#1a1c1e] flex flex-col justify-between">
              {selectedProp ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-mono text-rose-400 uppercase tracking-wider font-bold">
                      {selectedProp.agentName} 提案詳細
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{selectedProp.title}</h3>
                  </div>

                  <div className="p-3 bg-[#252526] rounded border border-[#3e3e42] space-y-2">
                    <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>指摘・技術的背景</span>
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">{selectedProp.description}</p>
                  </div>

                  <div className="p-3 bg-[#252526] rounded border border-[#3e3e42] space-y-2">
                    <h4 className="text-xs font-bold text-[#00a2ed] flex items-center gap-1">
                      <ArrowRight className="w-4 h-4" />
                      <span>推奨修正アクション</span>
                    </h4>
                    <p className="text-xs text-gray-200 leading-relaxed font-mono">
                      {selectedProp.suggestedAction}
                    </p>
                  </div>

                  {/* Gemini RAG Ordinance Consultation */}
                  <div className="p-3 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 rounded border border-indigo-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>道路構造令 Gemini RAG AI 解説</span>
                      </span>
                      <button
                        onClick={onOpenGeminiRagModal}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition-all shadow"
                      >
                        Gemini解説生成
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      道路構造令第15条・20条の条文根拠および例外規定をGemini 2.5 Flashで照合・解説生成します。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                  左側の赤入れ提案を選択してください
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: STREAM LOGS */}
        {activeTab === 'logs' && (
          <div className="w-full h-full flex flex-col bg-[#1a1c1e] p-3 overflow-hidden">
            {/* Filter & Actions Bar */}
            <div className="mb-2 flex items-center justify-between gap-2 shrink-0">
              <div className="flex-1 flex items-center bg-[#252526] border border-[#3e3e42] rounded px-2 py-1">
                <Search className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                <input
                  type="text"
                  placeholder="ログメッセージ・エージェント名でフィルタ..."
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none w-full"
                />
              </div>

              <button
                onClick={clearLogs}
                className="px-2.5 py-1 bg-[#252526] hover:bg-[#333] text-gray-400 hover:text-rose-400 border border-[#3e3e42] rounded text-xs font-mono flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>クリア</span>
              </button>
            </div>

            {/* Terminal Log Output */}
            <div className="flex-1 bg-[#121314] rounded border border-[#2d2d30] p-3 overflow-y-auto font-mono text-[11px] space-y-1.5">
              {filteredLogs.length === 0 ? (
                <div className="text-gray-600 text-center py-8">ストリームログはありません</div>
              ) : (
                filteredLogs.map((log) => {
                  let badgeBg = 'bg-gray-800 text-gray-300 border-gray-700';
                  if (log.type === 'proposal') badgeBg = 'bg-rose-950 text-rose-300 border-rose-800';
                  if (log.type === 'conflict') badgeBg = 'bg-amber-950 text-amber-300 border-amber-800';
                  if (log.type === 'rag') badgeBg = 'bg-indigo-950 text-indigo-300 border-indigo-800';

                  return (
                    <div key={log.id} className="flex items-start gap-2 border-b border-[#1e1e20] pb-1">
                      <span className="text-gray-500 shrink-0 select-none">[{log.timestamp}]</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] border shrink-0 ${badgeBg}`}>
                        {log.agentName}
                      </span>
                      <span className="text-gray-300 leading-relaxed break-all">{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
