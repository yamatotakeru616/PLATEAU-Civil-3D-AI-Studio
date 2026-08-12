import React from 'react';
import { TestInvariantResult } from '../types/civil';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

interface AutoTestStatusPanelProps {
  invariants: TestInvariantResult[];
  onAutoFixAll: () => void;
}

export const AutoTestStatusPanel: React.FC<AutoTestStatusPanelProps> = ({
  invariants,
  onAutoFixAll,
}) => {
  const passedCount = invariants.filter((i) => i.passed).length;
  const totalCount = invariants.length;
  const allPassed = passedCount === totalCount;

  return (
    <div className="w-full h-full bg-[#1a1c1e] text-gray-200 flex flex-col p-4 select-none font-sans overflow-y-auto">
      {/* Header */}
      <div className="p-4 bg-[#252526] rounded-lg border border-[#3e3e42] mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-full ${allPassed ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50' : 'bg-rose-950 text-rose-400 border border-rose-500/50'}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Auto-Testing Custom Hook (`useAutoTestEngine`)
            </h2>
            <p className="text-xs text-gray-400">
              設計操作のたびにリアルタイムで不変条件 (Invariants) をテスト実行します。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right font-mono">
            <span className="text-xs text-gray-400 block">不変条件適合率</span>
            <span className={`text-lg font-bold ${allPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {passedCount} / {totalCount} PASSED ({(passedCount / totalCount * 100).toFixed(0)}%)
            </span>
          </div>

          <button
            onClick={onAutoFixAll}
            className="px-4 py-2 bg-[#007acc] hover:bg-[#00a2ed] text-white font-bold text-xs rounded shadow flex items-center gap-2 border border-[#00a2ed]/50"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>不変条件 一括自動補正</span>
          </button>
        </div>
      </div>

      {/* Invariants Grid */}
      <div className="space-y-3">
        {invariants.map((inv) => (
          <div
            key={inv.id}
            className={`p-4 rounded-lg border transition-all ${
              inv.passed
                ? 'bg-[#252526] border-emerald-900/50 text-gray-200'
                : 'bg-rose-950/20 border-rose-800/60 text-rose-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                {inv.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 animate-bounce" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {inv.name}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#333] text-amber-300 border border-[#444]">
                      担当: {inv.associatedAgent}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{inv.description}</p>
                </div>
              </div>

              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                  inv.passed
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                    : 'bg-rose-950 border-rose-600 text-rose-300'
                }`}
              >
                {inv.passed ? 'PASSED (適合)' : 'FAILED (違反)'}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-4 text-xs font-mono bg-[#1a1c1e] p-2.5 rounded border border-[#333]">
              <div>
                <span className="text-gray-500 block">現在値:</span>
                <span className={inv.passed ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                  {inv.currentValue}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">規定閾値 (Threshold):</span>
                <span className="text-gray-300">{inv.thresholdValue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
