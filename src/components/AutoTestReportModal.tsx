import React from 'react';
import { AlignmentProject, TestInvariantResult } from '../types/civil';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  RefreshCw,
  Cpu,
} from 'lucide-react';

interface AutoTestReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  testResults: TestInvariantResult[];
  project: AlignmentProject;
  onRunFullScan: () => void;
  onAutoFixAll: () => void;
}

export const AutoTestReportModal: React.FC<AutoTestReportModalProps> = ({
  isOpen,
  onClose,
  testResults,
  project,
  onRunFullScan,
  onAutoFixAll,
}) => {
  if (!isOpen) return null;

  const passedCount = testResults.filter((r) => r.passed).length;
  const totalCount = testResults.length;
  const isAllPassed = passedCount === totalCount;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1c1d21] border border-[#3e3e42] rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden font-sans text-gray-200 flex flex-col max-h-[85vh]">
        {/* Header Bar */}
        <div className="p-4 bg-gradient-to-r from-[#252526] via-[#2d2d30] to-[#1c1d21] border-b border-[#3e3e42] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-950/80 border border-rose-500/50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">8. 検証/QA Agent 自動テスト診断レポート</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  useAutoTestEngine
                </span>
              </div>
              <p className="text-xs text-gray-400">
                道路構造令・土工バランス・3D空間干渉・視距に関する 5 つの不変条件 (Invariants) リアルタイム評価
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Summary Banner */}
        <div className="p-4 bg-[#141518] border-b border-[#2d2d30] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div
              className={`text-2xl font-black font-mono px-4 py-2 rounded-lg border flex items-center gap-2 ${
                isAllPassed
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
                  : 'bg-amber-950/80 text-amber-300 border-amber-600/60'
              }`}
            >
              {isAllPassed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              )}
              <span>
                {passedCount} / {totalCount} PASSED
              </span>
            </div>

            <div className="text-xs space-y-1">
              <div className="text-gray-300 font-bold">
                対象設計規格: <span className="text-sky-300">{project.roadClassification}</span> (V={project.designSpeedKmh}km/h)
              </div>
              <div className="text-gray-400">
                監視状況: 11源内AIエージェント自律監視エンジンとリアルタイム同期中
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRunFullScan}
              className="px-3 py-2 bg-[#2d2d30] hover:bg-[#3e3e42] text-white rounded-lg text-xs font-bold border border-gray-600 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-4 h-4 text-sky-400" />
              <span>全自動QAスキャン再実行</span>
            </button>

            <button
              onClick={() => {
                onAutoFixAll();
                onClose();
              }}
              className="px-3 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold shadow border border-rose-400/40 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>不整合一括自動適用 (Auto-Fix)</span>
            </button>
          </div>
        </div>

        {/* Test Cases Detail List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#1c1d21]">
          {testResults.map((test, index) => {
            return (
              <div
                key={test.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  test.passed
                    ? 'bg-[#18191c] border-[#2e3036] hover:border-emerald-600/40'
                    : 'bg-[#221818] border-rose-800/60 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 w-full">
                    <div className="mt-0.5 shrink-0">
                      {test.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      )}
                    </div>

                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-gray-400">
                            Invariant {index + 1}:
                          </span>
                          <h3 className="text-sm font-bold text-white">{test.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#28292d] text-amber-300 border border-[#3e3e42]">
                            担当: {test.associatedAgent}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                            test.passed
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}
                        >
                          {test.passed ? 'PASSED (適合)' : 'ALERT (不適合)'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-300 mb-2 leading-relaxed">{test.description}</p>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#121315] p-2 rounded border border-[#2d2d30]">
                        <div>
                          <span className="text-gray-500">現在地計算値: </span>
                          <span
                            className={
                              test.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                            }
                          >
                            {test.currentValue}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">法令/設計閾値: </span>
                          <span className="text-sky-300">{test.thresholdValue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#141518] border-t border-[#2d2d30] flex items-center justify-between text-xs font-mono text-gray-400">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>8. 検証/QA Agent & Orchestrator Agent が常時不変条件をトリガー監視中</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2d2d30] hover:bg-[#3e3e42] text-gray-200 rounded text-xs font-bold transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
