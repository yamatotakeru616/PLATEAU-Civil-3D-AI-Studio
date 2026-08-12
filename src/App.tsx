import React, { useState, useMemo } from 'react';
import { AlignmentProject, AgentProposal, ClashItem } from './types/civil';
import { DEFAULT_PROJECT } from './data/mockCivilData';
import { queryPlateauFeaturesByBBox } from './data/plateauRealData';
import { AgentEngine } from './services/agentEngine';
import { useAutoTestEngine } from './hooks/useAutoTestEngine';
import { useCivilSkills } from './hooks/useCivilSkills';
import { useAutonomousAgentEngine } from './hooks/useAutonomousAgentEngine';

import { Header } from './components/Header';
import { RibbonBar } from './components/RibbonBar';
import { ToolspaceProspector } from './components/ToolspaceProspector';
import { Viewport3D } from './components/Viewport3D';
import { Alignment2DView } from './components/Alignment2DView';
import { ProfileView } from './components/ProfileView';
import { CrossSectionView } from './components/CrossSectionView';
import { AgentPanel } from './components/AgentPanel';
import { AutoTestStatusPanel } from './components/AutoTestStatusPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { CommandLineFooter } from './components/CommandLineFooter';
import { GeminiRagModal } from './components/GeminiRagModal';
import { AutoTestReportModal } from './components/AutoTestReportModal';
import { SkillResultModal } from './components/SkillResultModal';

export default function App() {
  const [project, setProject] = useState<AlignmentProject>(DEFAULT_PROJECT);
  const [activeTab, setActiveTab] = useState<string>('3d_view');
  const [selectedIpId, setSelectedIpId] = useState<string | null>('ip-3');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedKp, setSelectedKp] = useState<number>(500);
  const [isRagModalOpen, setIsRagModalOpen] = useState<boolean>(false);
  const [isQaReportModalOpen, setIsQaReportModalOpen] = useState<boolean>(false);

  const [logs, setLogs] = useState<string[]>([
    'Initializing Civil 3D AI Studio Workspace v2.5...',
    'Loaded PLATEAU 3D Urban Model Dataset (Buildings, DEM Mesh, Road Infrastructure).',
    'Activated 11 源内AI Agents & Auto-Testing Custom Hook (`useAutoTestEngine`).',
    'Ready. Type command or click Ribbon buttons to execute skills.',
  ]);

  const handleAddLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const invariants = useAutoTestEngine(project);
  const passedInvariantsCount = invariants.filter((i) => i.passed).length;

  const { proposals, clashes } = useMemo(() => {
    return AgentEngine.runAllAgents(project);
  }, [project]);

  const { modalData, setModalData, executeSkill } = useCivilSkills(project, setProject, handleAddLog);

  const {
    agents,
    agentLogs,
    isAutonomousMode,
    setIsAutonomousMode,
    toggleAgentAutoRun,
    runSingleAgentReasoning,
    clearLogs,
  } = useAutonomousAgentEngine(project, setProject, handleAddLog);

  const handleAutoFixAll = () => {
    executeSkill('skill:auto_fix_all');
  };

  const handleUpdateElevation = (ipOrVipId: string, newElevation: number) => {
    setProject((prev) => {
      const roundEl = Number(newElevation.toFixed(2));
      const targetPlanIp = prev.ipPoints.find((ip) => ip.id === ipOrVipId);
      const targetVip = prev.verticalIPs.find((v) => v.id === ipOrVipId);
      const targetKp = targetPlanIp ? targetPlanIp.kp : targetVip ? targetVip.kp : null;

      const newIpPoints = prev.ipPoints.map((ip) => {
        if (ip.id === ipOrVipId || (targetKp !== null && Math.abs(ip.kp - targetKp) < 30)) {
          return { ...ip, elevation: roundEl };
        }
        return ip;
      });

      const newVerticalIPs = prev.verticalIPs.map((vip) => {
        if (vip.id === ipOrVipId || (targetKp !== null && Math.abs(vip.kp - targetKp) < 30)) {
          return { ...vip, elevation: roundEl };
        }
        return vip;
      });

      for (let i = 0; i < newVerticalIPs.length; i++) {
        if (i < newVerticalIPs.length - 1) {
          const dist = newVerticalIPs[i + 1].kp - newVerticalIPs[i].kp;
          const dEl = newVerticalIPs[i + 1].elevation - newVerticalIPs[i].elevation;
          newVerticalIPs[i].gradientOut = Number(((dEl / (dist || 1)) * 100).toFixed(1));
          newVerticalIPs[i + 1].gradientIn = newVerticalIPs[i].gradientOut;
        }
      }

      const newCrossSections = prev.crossSections.map((cs) => {
        let designEl = cs.designElevation;
        for (let i = 0; i < newVerticalIPs.length - 1; i++) {
          const v1 = newVerticalIPs[i];
          const v2 = newVerticalIPs[i + 1];
          if (cs.kp >= v1.kp && cs.kp <= v2.kp) {
            const ratio = (cs.kp - v1.kp) / (v2.kp - v1.kp || 1);
            designEl = Number((v1.elevation + ratio * (v2.elevation - v1.elevation)).toFixed(2));
            break;
          }
        }
        const diff = designEl - cs.groundElevation;
        const cutArea = diff < 0 ? Number((Math.abs(diff) * 12.4 + 4.2).toFixed(2)) : 0;
        const fillArea = diff > 0 ? Number((diff * 14.2 + 5.1).toFixed(2)) : 0;

        return {
          ...cs,
          designElevation: designEl,
          cutArea,
          fillArea,
        };
      });

      handleAddLog(`[計画高GH変更] 縦断計画高: GH=${roundEl}m に変更。勾配・土工バランスを連動再計算しました。`);

      return {
        ...prev,
        ipPoints: newIpPoints,
        verticalIPs: newVerticalIPs,
        crossSections: newCrossSections,
      };
    });
  };

  const handleUpdateRadius = (ipId: string, newR: number) => {
    setProject((prev) => {
      const updated = prev.ipPoints.map((ip) => {
        if (ip.id === ipId) {
          const newA = Math.round(Math.sqrt(newR * 35));
          return { ...ip, R: newR, A1: newA, A2: newA };
        }
        return ip;
      });
      handleAddLog(`Updated IP curve radius to R=${newR}m.`);
      return { ...prev, ipPoints: updated };
    });
  };

  const handleExecuteCommand = (cmd: string) => {
    handleAddLog(`Entered Command: ${cmd}`);
    if (cmd.startsWith('skill:')) {
      executeSkill(cmd);
    } else if (cmd === 'autofix') {
      handleAutoFixAll();
    } else {
      handleAddLog(`Unknown command "${cmd}". Try skill:optimize_clothoid or autofix.`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1a1c1e] text-[#d4d4d4] font-sans overflow-hidden select-none">
      <Header
        project={project}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenGeminiModal={() => setIsRagModalOpen(true)}
        passedInvariantsCount={passedInvariantsCount}
        totalInvariantsCount={invariants.length}
        onOpenQaReportModal={() => setIsQaReportModalOpen(true)}
      />

      <RibbonBar
        project={project}
        onExecuteSkill={executeSkill}
        onAutoFixAll={handleAutoFixAll}
        onTriggerBBoxSelect={() => {
          setActiveTab('2d_plan');
          handleAddLog('[2D 範囲選択モード起動] 平面線形2D画面でマウスドラッグして取得するPLATEAUエリアを選択してください。');
        }}
      />

      <main className="flex-1 flex overflow-hidden relative">
        <ToolspaceProspector
          project={project}
          invariants={invariants}
          selectedIpId={selectedIpId}
          onSelectIp={(id) => {
            setSelectedIpId(id);
            handleAddLog(`Selected IP Point: ${id}`);
          }}
          onSelectBuilding={(id) => {
            setSelectedBuildingId(id);
            handleAddLog(`Selected PLATEAU Building: ${id}`);
          }}
        />

        <section className="flex-1 relative bg-[#0a0a0d] overflow-hidden flex flex-col">
          {activeTab === '3d_view' && (
            <Viewport3D
              project={project}
              proposals={proposals}
              selectedIpId={selectedIpId}
              onSelectIp={(id) => setSelectedIpId(id)}
              onSwitchTo2DPlan={() => {
                setActiveTab('2d_plan');
                handleAddLog('[2D 範囲選択モード起動] 平面線形2D画面でマウスドラッグして取得するPLATEAUエリアを選択してください。');
              }}
            />
          )}

          {activeTab === '2d_plan' && (
            <Alignment2DView
              project={project}
              proposals={proposals}
              selectedIpId={selectedIpId}
              onSelectIp={(id) => setSelectedIpId(id)}
              onUpdateIpPosition={(id, newX, newY) => {
                setProject((prev) => ({
                  ...prev,
                  ipPoints: prev.ipPoints.map((p) => (p.id === id ? { ...p, x: newX, y: newY } : p)),
                }));
              }}
              onSelectRegion={async (bbox) => {
                handleAddLog(`[PLATEAU 2D BBox Query] Selected area: Lon [${bbox.minLon.toFixed(4)} ~ ${bbox.maxLon.toFixed(4)}], Lat [${bbox.minLat.toFixed(4)} ~ ${bbox.maxLat.toFixed(4)}]`);
                try {
                  const res = await fetch('/api/plateau/query-bbox', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bbox),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setProject((prev) => ({
                      ...prev,
                      plateauBuildings: data.buildings ?? [],
                      plateauFeatures: data.features ?? [],
                    }));
                    const n = data.totalCount ?? 0;
                    if (n === 0) {
                      handleAddLog(`[PLATEAU BBox Query] 選択範囲内の地物は 0 件です。範囲を広げて再選択してください。`);
                    } else {
                      handleAddLog(`[PLATEAU BBox Query Success] Loaded ${n} PLATEAU features (${data.featureCounts.bldg} bldg, ${data.featureCounts.tran} tran, ${data.featureCounts.rwy} rwy, ${data.featureCounts.wtr} wtr) inside selected region.`);
                    }
                  }
                } catch (_) {
                  const result = queryPlateauFeaturesByBBox(bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat);
                  setProject((prev) => ({
                    ...prev,
                    plateauBuildings: result.buildings,
                    plateauFeatures: result.features,
                  }));
                  if (result.features.length === 0) {
                    handleAddLog(`[PLATEAU BBox Query] 選択範囲内の地物は 0 件です。範囲を広げて再選択してください。`);
                  } else {
                    handleAddLog(`[PLATEAU BBox Query Loaded] ${result.features.length} features (bldg:${result.counts.bldg} tran:${result.counts.tran} wtr:${result.counts.wtr} rwy:${result.counts.rwy}) loaded for selected area.`);
                  }
                }
              }}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView project={project} onUpdateElevation={handleUpdateElevation} />
          )}

          {activeTab === 'cross_section' && (
            <CrossSectionView project={project} selectedKp={selectedKp} onSelectKp={(kp) => setSelectedKp(kp)} />
          )}

          {activeTab === 'agent_panel' && (
            <AgentPanel
              project={project}
              proposals={proposals}
              agents={agents}
              agentLogs={agentLogs}
              isAutonomousMode={isAutonomousMode}
              setIsAutonomousMode={setIsAutonomousMode}
              toggleAgentAutoRun={toggleAgentAutoRun}
              runSingleAgentReasoning={runSingleAgentReasoning}
              clearLogs={clearLogs}
              onAutoFixAll={handleAutoFixAll}
              onOpenGeminiRagModal={() => setIsRagModalOpen(true)}
            />
          )}

          {activeTab === 'autotest' && (
            <AutoTestStatusPanel invariants={invariants} onAutoFixAll={handleAutoFixAll} />
          )}
        </section>

        <PropertiesPanel
          project={project}
          selectedIpId={selectedIpId}
          onUpdateRadius={handleUpdateRadius}
          onUpdateElevation={handleUpdateElevation}
          onUpdateIpPosition={(id, newX, newY) => {
            setProject((prev) => ({
              ...prev,
              ipPoints: prev.ipPoints.map((p) => (p.id === id ? { ...p, x: newX, y: newY } : p)),
            }));
            handleAddLog(`Moved IP Point ${id} to X=${Math.round(newX)}, Y=${Math.round(newY)}`);
          }}
        />
      </main>

      <CommandLineFooter project={project} logs={logs} onExecuteCommand={handleExecuteCommand} />

      <GeminiRagModal project={project} isOpen={isRagModalOpen} onClose={() => setIsRagModalOpen(false)} />

      <AutoTestReportModal
        isOpen={isQaReportModalOpen}
        onClose={() => setIsQaReportModalOpen(false)}
        testResults={invariants}
        project={project}
        onRunFullScan={() => {
          handleAddLog('⚡ [全自動QAスキャン] 5つの不変条件(Invariants)のリアルタイム再判定を実施完了。');
        }}
        onAutoFixAll={handleAutoFixAll}
      />

      <SkillResultModal data={modalData} onClose={() => setModalData(null)} onApplyFix={handleAutoFixAll} />
    </div>
  );
}
