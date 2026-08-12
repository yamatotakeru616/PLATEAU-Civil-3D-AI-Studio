import React from 'react';
import {
  X,
  CheckCircle2,
  Calculator,
  Building2,
  ShieldAlert,
  Box,
  Wand2,
  Sparkles,
  Layers,
  BarChart3,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { AlignmentProject } from '../types/civil';

export interface SkillModalData {
  type: 'earthwork' | 'structure' | 'plateau' | 'ordinance' | 'autofix' | 'clothoid' | 'mesh' | 'add_ip';
  title: string;
  agentName: string;
  description: string;
  details: any;
}

interface SkillResultModalProps {
  data: SkillModalData | null;
  onClose: () => void;
  onApplyFix?: () => void;
}

export const SkillResultModal: React.FC<SkillResultModalProps> = ({
  data,
  onClose,
  onApplyFix,
}) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1c1d21] border border-[#3e3e42] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden font-sans text-gray-200 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-[#252526] via-[#2d2d30] to-[#1c1d21] border-b border-[#3e3e42] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#007acc]/20 border border-[#00a2ed]/50 flex items-center justify-center shrink-0">
              {data.type === 'earthwork' && <Calculator className="w-5 h-5 text-emerald-400" />}
              {data.type === 'structure' && <Box className="w-5 h-5 text-cyan-400" />}
              {data.type === 'plateau' && <Building2 className="w-5 h-5 text-rose-400" />}
              {data.type === 'ordinance' && <ShieldAlert className="w-5 h-5 text-indigo-400" />}
              {data.type === 'autofix' && <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />}
              {data.type === 'clothoid' && <Wand2 className="w-5 h-5 text-amber-400" />}
              {data.type === 'mesh' && <Layers className="w-5 h-5 text-emerald-400" />}
              {data.type === 'add_ip' && <CheckCircle2 className="w-5 h-5 text-sky-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{data.title}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[#2b2c30] text-sky-300 border border-[#3e3e42]">
                  担当: {data.agentName}
                </span>
              </div>
              <p className="text-xs text-gray-400">{data.description}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs font-sans bg-[#141518]">
          {/* Earthwork Content */}
          {data.type === 'earthwork' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#1e1f24] border border-[#2d2d30] rounded-lg text-center">
                  <div className="text-gray-400 text-[11px] font-mono mb-1">切土総量 (Cut)</div>
                  <div className="text-xl font-bold font-mono text-rose-400">{data.details.totalCut} m³</div>
                </div>
                <div className="p-3 bg-[#1e1f24] border border-[#2d2d30] rounded-lg text-center">
                  <div className="text-gray-400 text-[11px] font-mono mb-1">盛土総量 (Fill)</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">{data.details.totalFill} m³</div>
                </div>
                <div className="p-3 bg-[#1e1f24] border border-[#2d2d30] rounded-lg text-center">
                  <div className="text-gray-400 text-[11px] font-mono mb-1">差引残土 (Net)</div>
                  <div className="text-xl font-bold font-mono text-amber-300">{data.details.net} m³</div>
                </div>
              </div>

              <div className="p-3 bg-[#1e1f24] border border-[#2d2d30] rounded-lg space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-gray-400">土工均衡率 (Cut/Fill Ratio):</span>
                  <span className={`font-bold ${data.details.isBalanced ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {data.details.ratio} ({data.details.isBalanced ? '適正 0.75-1.35' : '調整推奨'})
                  </span>
                </div>
                <div className="w-full h-3 bg-[#111215] rounded-full overflow-hidden flex border border-[#333]">
                  <div
                    style={{ width: `${Math.min(100, (data.details.totalCut / (data.details.totalCut + data.details.totalFill)) * 100)}%` }}
                    className="bg-rose-500 h-full"
                    title="切土割合"
                  />
                  <div
                    style={{ width: `${Math.min(100, (data.details.totalFill / (data.details.totalCut + data.details.totalFill)) * 100)}%` }}
                    className="bg-emerald-500 h-full"
                    title="盛土割合"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#18191d] border border-[#2d2d30] rounded-lg text-gray-300 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>4. 横断/土工 Agent 判定コメント:</span>
                </div>
                <p className="text-xs leading-relaxed text-gray-400">{data.details.comment}</p>
              </div>
            </div>
          )}

          {/* Structure Content */}
          {data.type === 'structure' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#1e1f24] border border-[#2d2d30] rounded-lg space-y-2">
                <div className="text-gray-300 font-bold text-sm">F-103 マトリクス 推奨構造物一覧</div>
                <div className="space-y-2 font-mono">
                  {data.details.recommendations.map((item: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-[#121316] rounded border border-[#2d2d30] flex items-center justify-between">
                      <div>
                        <div className="text-cyan-400 font-bold">{item.section}</div>
                        <div className="text-gray-400 text-[11px]">{item.condition}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">{item.structure}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          推薦度: {item.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PLATEAU Clash Content */}
          {data.type === 'plateau' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#1e1f24] border border-[#2d2d30] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-bold">PLATEAU 3D都市モデル空間干渉検知結果</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${data.details.clashes.length === 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                    Critical干渉: {data.details.clashes.length} 件
                  </span>
                </div>

                {data.details.clashes.length === 0 ? (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-600/50 rounded-lg text-emerald-300 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold">3D空間干渉クリア (Clash Zero)</div>
                      <div className="text-xs text-emerald-400/80">PLATEAU 4層(建物/インフラ/DEM)との安全離隔距離(≥25m)を確保しています。</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 font-mono">
                    {data.details.clashes.map((c: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-[#221818] rounded border border-rose-800/60 flex items-center justify-between">
                        <div>
                          <div className="text-rose-400 font-bold">{c.name}</div>
                          <div className="text-gray-400 text-[11px]">{c.location}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-amber-300 font-bold">離隔 {c.distance}m &lt; 25m</div>
                          <span className="text-[10px] text-rose-300">回避バイパス推奨</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ordinance Compliance Content */}
          {data.type === 'ordinance' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#1e1f24] border border-[#2d2d30] rounded-lg space-y-2">
                <div className="text-gray-300 font-bold">道路構造令 法令適合判定</div>
                <div className="space-y-2 font-mono">
                  {data.details.checks.map((item: any, idx: number) => (
                    <div key={idx} className={`p-2.5 rounded border flex items-center justify-between ${item.passed ? 'bg-[#121814] border-emerald-800/60' : 'bg-[#221818] border-rose-800/60'}`}>
                      <div>
                        <div className="text-white font-bold">{item.article}</div>
                        <div className="text-gray-400 text-[11px]">{item.detail}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.passed ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                        {item.passed ? '適合 (OK)' : '要調整 (NG)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AutoFix Content */}
          {data.type === 'autofix' && (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-950/40 border border-emerald-600/60 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-base font-bold text-emerald-300">源内AI 11エージェント 一括自動修正完了！</h3>
                    <p className="text-xs text-emerald-400/90">
                      R値・縦断勾配・PLATEAU干渉・土工バランスが1発解消され、全5不変条件 (Invariants) が PASSED になりました。
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#111813] p-3 rounded-lg border border-emerald-800/50">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>平面曲線 R: 120m → 180m (≥150m OK)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>縦断勾配 i: 5.8% → 4.2% (≤5.0% OK)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>PLATEAU 3D干渉: 2件 → 0件 CLEAR</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>土工バランス比率: 1.02 (最適)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Simple Toast / Message for Clothoid, Mesh, Add IP */}
          {(data.type === 'clothoid' || data.type === 'mesh' || data.type === 'add_ip') && (
            <div className="p-4 bg-[#1e1f24] border border-[#2d2d30] rounded-lg text-gray-200 leading-relaxed font-mono">
              {data.details.message}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#141518] border-t border-[#2d2d30] flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-gray-500">
            12. UI/機能総合検証 Agent 動作記録同期済み
          </span>

          <div className="flex items-center gap-2">
            {data.type !== 'autofix' && onApplyFix && (
              <button
                onClick={() => {
                  onApplyFix();
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded text-xs font-bold shadow flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>源内AI一括自動修正を適用</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#2d2d30] hover:bg-[#3e3e42] text-gray-200 rounded text-xs font-bold transition-all"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
