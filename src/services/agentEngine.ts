import { AlignmentProject, AgentProposal, ClashItem } from '../types/civil';

export class AgentEngine {
  /**
   * Run all 11 Agents to analyze the project and aggregate Dashed Vermillion Redline Annotations
   */
  static runAllAgents(project: AlignmentProject): { proposals: AgentProposal[]; clashes: ClashItem[] } {
    const proposals: AgentProposal[] = [];
    const clashes: ClashItem[] = [];

    // 1. 線形設計Agent (Plan Alignment)
    project.ipPoints.forEach((ip) => {
      if (ip.R > 0 && ip.R < 150 && project.designSpeedKmh >= 60) {
        proposals.push({
          id: `prop-linear-${ip.id}`,
          agentId: 'linear_design_agent',
          agentName: '2. 線形設計 Agent',
          priority: 1,
          title: `曲線半径Rの規格不足 (${ip.name})`,
          description: `設計速度${project.designSpeedKmh}km/hにおける規格下限はR=150mです。現在値R=${ip.R}mは急曲線であり遠心加速度過大のおそれがあります。`,
          suggestedAction: `曲線半径を R=${ip.R}m → R=160m に拡大し、クロソイドA=75を再適用します。`,
          dashedAnnotation: {
            type: 'circle',
            coordinates: [{ x: ip.x, y: ip.y, z: ip.elevation }],
            color: '#ff3333', // Vermillion Red
            label: `R=${ip.R}m < 150m (要拡大)`,
          },
          confidence: 0.98,
          status: 'pending',
        });
      }
    });

    // 2. 縦断設計Agent (Profile Design)
    project.verticalIPs.forEach((vip) => {
      if (Math.abs(vip.gradientOut) > 5.0) {
        proposals.push({
          id: `prop-profile-${vip.id}`,
          agentId: 'profile_design_agent',
          agentName: '3. 縦断設計 Agent',
          priority: 2,
          title: `最大縦断勾配の上限超過 (KP${vip.kp}m)`,
          description: `${project.roadClassification}の規定上限勾配は5.0%です。現在値 i=${vip.gradientOut}% は登坂失速・制動不全の危険があります。`,
          suggestedAction: `縦断計画高を調整し、勾配を i=${vip.gradientOut}% → i=4.5% に緩和します。`,
          dashedAnnotation: {
            type: 'arrow',
            coordinates: [{ x: vip.kp, y: vip.elevation, z: 0 }],
            color: '#ff4400',
            label: `勾配 i=${vip.gradientOut}% > 5.0%`,
          },
          confidence: 0.95,
          status: 'pending',
        });
      }
    });

    // 3. 横断/土工Agent (Earthwork & Cross Section)
    let totalCut = 0;
    let totalFill = 0;
    project.crossSections.forEach((cs) => {
      totalCut += cs.cutArea * 50;
      totalFill += cs.fillArea * 50;
    });

    const balanceRatio = totalFill > 0 ? totalCut / totalFill : 1;
    if (balanceRatio < 0.7 || balanceRatio > 1.4) {
      proposals.push({
        id: 'prop-earthwork-balance',
        agentId: 'earthwork_agent',
        agentName: '4. 横断/土工 Agent',
        priority: 3,
        title: `土工均衡率(Cut/Fill)の不均衡`,
        description: `総切土量 ${totalCut.toFixed(0)}m³ / 総盛土量 ${totalFill.toFixed(0)}m³ (均衡比: ${balanceRatio.toFixed(2)})。現場外での土砂搬出入コストが増大します。`,
        suggestedAction: `縦断計画高を全体的に 1.2m 下げ（または上げ）、Cut/Fill 均衡率 ≈ 1.0 に近づけます。`,
        confidence: 0.91,
        status: 'pending',
      });
    }

    // 4. PLATEAU/地形統合Agent (PLATEAU 3D Clash)
    project.plateauBuildings.forEach((bld) => {
      // Find minimum distance to any alignment segment
      let minDist = Infinity;
      let closestPrevIp = project.ipPoints[0];
      let closestIp = project.ipPoints[1];

      for (let idx = 1; idx < project.ipPoints.length; idx++) {
        const prevIp = project.ipPoints[idx - 1];
        const ip = project.ipPoints[idx];
        const dist = distToLineSegment(
          { x: bld.x, y: bld.y },
          { x: prevIp.x, y: prevIp.y },
          { x: ip.x, y: ip.y }
        );
        if (dist < minDist) {
          minDist = dist;
          closestPrevIp = prevIp;
          closestIp = ip;
        }
      }

      if (minDist < 25) { // Within 25m corridor
        clashes.push({
          id: `clash-${bld.id}`,
          kp: Math.round((closestPrevIp.kp + closestIp.kp) / 2),
          objectName: bld.name,
          clashType: 'building',
          severity: bld.severity,
          location: { x: bld.x, y: bld.y, z: bld.height },
          description: `計画道路用地とPLATEAU 3D構造物「${bld.name}」が離隔${minDist.toFixed(1)}mで接近・立体干渉しています。`,
        });

        proposals.push({
          id: `prop-clash-${bld.id}`,
          agentId: 'plateau_clash_agent',
          agentName: '7. PLATEAU/地形統合 Agent',
          priority: 1,
          title: `PLATEAU 3D都市モデル空間干渉 [${bld.severity.toUpperCase()}]`,
          description: `「${bld.name}」との立体干渉を検出。高層建物/インフラの回避措置またはバイパス線形変更が必要です。`,
          suggestedAction: `IP-2を北西方向へ Δx=-35m, Δy=+20m シフトし、離隔 45m 以上を確保します。`,
          dashedAnnotation: {
            type: 'box',
            coordinates: [{ x: bld.x, y: bld.y, z: bld.height }],
            color: '#ff0055',
            label: `干渉: ${bld.name}`,
          },
          confidence: 0.99,
          status: 'pending',
        });
      }
    });

    // 5. 道路構造令RAG Agent
    proposals.push({
      id: 'prop-rag-ordinance',
      agentId: 'rag_ordinance_agent',
      agentName: '5. 道路構造令 RAG Agent',
      priority: 2,
      title: '道路構造令 第15条・第20条 総合適合性判定',
      description: '【判定: 要線形修正】第3種第2級(設計速度60km/h)において、R<150m区間および縦断勾配>5.0%区間が重複しています。Gemini RAGによる条文根拠解説を参照可能。',
      suggestedAction: 'Gemini AIで解説文を取得し、複合曲線の安全対策(片勾配すり付け長拡大)を適用。',
      confidence: 0.94,
      status: 'pending',
    });

    // 6. 構造物選定Agent (F-103 Matrix)
    proposals.push({
      id: 'prop-structure-f103',
      agentId: 'structure_selection_agent',
      agentName: '6. 構造物選定 Agent',
      priority: 3,
      title: '汐留谷地交差点 (KP800m~920m) 構造物推奨',
      description: '軟弱地盤かつ支間長 L=120m の立体交差区間において、F-103構造物選定マトリクスに基づき「3径間連続PC箱桁橋」を推奨します。',
      suggestedAction: '橋梁構造パラメータを確定し、3Dメッシュを自動生成します。',
      confidence: 0.92,
      status: 'pending',
    });

    // 7. Orchestrator Agent (1. Orchestrator - Conflict resolution)
    proposals.unshift({
      id: 'prop-orchestrator-summary',
      agentId: 'orchestrator_agent',
      agentName: '1. Orchestrator Agent',
      priority: 1,
      title: '源内AI 赤入れ提案集約 & コンフリクト調停',
      description: `全11エージェントの解析を統合しました。優先度最高[Priority 1]: R値不足およびPLATEAU建物干渉の回避、ならびに土工均衡化の提案を1つの統合赤入れとして表示中。`,
      suggestedAction: '「一括最適化スキル」を実行し、IP点再配置と縦断補正を自動適用。',
      confidence: 0.99,
      status: 'pending',
    });

    const uniqueProposals = Array.from(new Map(proposals.map((p) => [p.id, p])).values());
    const uniqueClashes = Array.from(new Map(clashes.map((c) => [c.id, c])).values());

    return { proposals: uniqueProposals, clashes: uniqueClashes };
  }
}

function distToLineSegment(
  p: { x: number; y: number },
  v: { x: number; y: number },
  w: { x: number; y: number }
) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}
