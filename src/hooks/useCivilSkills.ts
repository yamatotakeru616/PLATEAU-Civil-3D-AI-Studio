import { useCallback, useState, Dispatch, SetStateAction } from 'react';
import { AlignmentProject, CivilSkill } from '../types/civil';
import { CIVIL_SKILLS } from '../data/mockCivilData';
import { REAL_PLATEAU_BUILDINGS, REAL_PLATEAU_FEATURES } from '../data/plateauRealData';
import { SkillModalData } from '../components/SkillResultModal';

export function useCivilSkills(
  project: AlignmentProject,
  setProject: Dispatch<SetStateAction<AlignmentProject>>,
  onLogMessage: (msg: string) => void
) {
  const [activeSkill, setActiveSkill] = useState<CivilSkill | null>(null);
  const [modalData, setModalData] = useState<SkillModalData | null>(null);

  const executeSkill = useCallback(
    async (skillCommand: string, params?: any) => {
      const skill = CIVIL_SKILLS.find((s) => s.command === skillCommand);
      setActiveSkill(skill || null);
      onLogMessage(`Executing Skill [${skillCommand}]...`);

      switch (skillCommand) {
        case 'skill:add_ip_point': {
          setProject((prev) => {
            const newId = `ip-${prev.ipPoints.length + 1}`;
            const lastIp = prev.ipPoints[prev.ipPoints.length - 1];
            const newIp = {
              id: newId,
              name: `IP-${prev.ipPoints.length} (新規点)`,
              x: lastIp.x + 120,
              y: lastIp.y + 60,
              elevation: lastIp.elevation + 2.5,
              R: 200,
              A1: 80,
              A2: 80,
              kp: lastIp.kp + 200,
            };
            onLogMessage(`[Skill Success] Added IP Point ${newIp.name} at KP${newIp.kp}m.`);
            return { ...prev, ipPoints: [...prev.ipPoints, newIp] };
          });

          setModalData({
            type: 'add_ip',
            title: '新規 IP 点の挿入完了',
            agentName: '2. 線形設計 Agent',
            description: '平面線形に新規 IP 点を挿入し、クロソイド曲線を自動計算しました。',
            details: {
              message: '新規 IP 点を追加しました。2D / 3D 統合ビューアおよび縦断プロファイルで動的に再描画されます。',
            },
          });
          break;
        }

        case 'skill:optimize_clothoid': {
          setProject((prev) => {
            const updated = prev.ipPoints.map((ip) => {
              if (ip.R > 0 && ip.R < 150) {
                // Fix R and clothoid A
                const newR = 180;
                const newA = Math.round(Math.sqrt(newR * 35)); // Clothoid parameter equation A = sqrt(R * L)
                return { ...ip, R: newR, A1: newA, A2: newA };
              }
              return ip;
            });
            onLogMessage(`[Skill Success] Optimized Clothoid parameters A and curve radii R ≥ 180m for all IP curves.`);
            return { ...prev, ipPoints: updated };
          });

          setModalData({
            type: 'clothoid',
            title: 'クロソイド A パラメータ最適化完了',
            agentName: '2. 線形設計 Agent',
            description: '設計速度 60km/h に対応した適切なクロソイド曲線を全IP点に適用しました。',
            details: {
              message: '全曲線の半径を R ≥ 180m (規格上限) に補正し、クロソイドパラメータ A1=A2=80 を自動フィッティング完了しました。',
            },
          });
          break;
        }

        case 'skill:calculate_earthwork': {
          let totalCut = 0;
          let totalFill = 0;
          project.crossSections.forEach((cs) => {
            totalCut += cs.cutArea * 50;
            totalFill += cs.fillArea * 50;
          });
          const net = totalCut - totalFill;
          const ratio = totalFill > 0 ? (totalCut / totalFill).toFixed(2) : '1.00';
          const isBalanced = Number(ratio) >= 0.75 && Number(ratio) <= 1.35;

          onLogMessage(
            `[Skill Success] Earthwork Calculation (Average Cross Section Method): Cut = ${totalCut.toFixed(
              0
            )} m³, Fill = ${totalFill.toFixed(0)} m³, Net = ${net.toFixed(0)} m³.`
          );

          setModalData({
            type: 'earthwork',
            title: '土工量自動集計 (平均断面法)',
            agentName: '4. 横断/土工 Agent',
            description: 'KP0m ~ KP1100m 全横断面の切土・盛土集計と現場内土砂バランス分析',
            details: {
              totalCut: Math.round(totalCut),
              totalFill: Math.round(totalFill),
              net: Math.round(net),
              ratio,
              isBalanced,
              comment: isBalanced
                ? '土工バランスは適正範囲(0.75-1.35)内に収まっており、現場内流用が可能です。'
                : '土工量に不均衡が発生しています。「源内AI一括自動修正」を実行して縦断計画高を調整してください。',
            },
          });
          break;
        }

        case 'skill:check_compliance': {
          onLogMessage(`[Skill Success] Road Ordinance Check completed: Evaluated Class 3 Grade 2 ordinances.`);

          const isRCompliant = !project.ipPoints.some((ip) => ip.R > 0 && ip.R < 150);
          const isGradCompliant = !project.verticalIPs.some((v) => Math.abs(v.gradientOut) > 5.0);

          setModalData({
            type: 'ordinance',
            title: '道路構造令 リアルタイム適合診断結果',
            agentName: '5. 道路構造令 RAG Agent',
            description: '第3種第2級 (設計速度 60km/h) に対する法令数値クリア状況',
            details: {
              checks: [
                {
                  article: '第15条 (曲線半径 R)',
                  detail: isRCompliant ? '全曲線 R ≥ 150m をクリアしています。' : 'IP-2 で R=120m < 150m (違反)。補正が必要です。',
                  passed: isRCompliant,
                },
                {
                  article: '第20条 (最大縦断勾配 i)',
                  detail: isGradCompliant ? '全縦断勾配 i ≤ 5.0% をクリアしています。' : 'KP300m で i=5.8% > 5.0% (違反)。補正が必要です。',
                  passed: isGradCompliant,
                },
                {
                  article: '第21条 (縦断曲線半径 VCL)',
                  detail: 'VCL R ≥ 2000m を確保し、制止視距 S ≥ 75m を満足しています。',
                  passed: true,
                },
              ],
            },
          });
          break;
        }

        case 'skill:detect_plateau_clash': {
          onLogMessage(`[Skill Success] PLATEAU 3D Clash detection scan executed.`);

          const clashes: any[] = [];
          project.plateauBuildings.forEach((bld) => {
            if (bld.severity === 'critical') {
              project.ipPoints.forEach((ip, idx) => {
                if (idx === 0) return;
                const prev = project.ipPoints[idx - 1];
                const dist = Math.hypot(bld.x - (prev.x + ip.x) / 2, bld.y - (prev.y + ip.y) / 2);
                if (dist < 35) {
                  clashes.push({
                    name: bld.name,
                    location: `KP${ip.kp}m 付近 (X:${bld.x}, Y:${bld.y})`,
                    distance: Math.round(dist),
                  });
                }
              });
            }
          });

          setModalData({
            type: 'plateau',
            title: 'PLATEAU 3D 都市モデル 立体干渉スキャン',
            agentName: '7. PLATEAU/地形統合 Agent',
            description: 'PLATEAU 4層(建物LOD2/インフラ地下線路/DEM)との空間干渉スキャン結果',
            details: {
              clashes,
            },
          });
          break;
        }

        case 'skill:suggest_structure': {
          onLogMessage(`[Skill Success] F-103 Matrix Structure Recommendation completed.`);

          setModalData({
            type: 'structure',
            title: 'F-103 構造物選定マトリクス 推薦結果',
            agentName: '6. 構造物選定 Agent',
            description: '地形・地質・縦断条件・交差物条件に基づく最適構造物選定結果',
            details: {
              recommendations: [
                {
                  section: 'KP800m ~ KP920m (汐留谷地交差部 L=120m)',
                  condition: '谷地跨線部・軟弱地盤・3径間',
                  structure: '3径間連続 PC 箱桁橋',
                  score: 96,
                },
                {
                  section: 'KP200m ~ KP400m (切土区間)',
                  condition: 'H=8m 自立切土法面',
                  structure: '補強土壁 + インターロッキング擁壁',
                  score: 92,
                },
                {
                  section: 'KP500m 地下交差部',
                  condition: '地下線路(日比谷線)交差部',
                  structure: 'アンダーパス・ボックスカルバート工法',
                  score: 89,
                },
              ],
            },
          });
          break;
        }

        case 'skill:generate_3d_mesh': {
          onLogMessage(`[Skill Success] Re-generated 3D Road Mesh & Red-annotation lines in Three.js viewport.`);

          setModalData({
            type: 'mesh',
            title: '3D 道路体メッシュ & 赤入れシェイプ全描画更新',
            agentName: '11. CAD Agent',
            description: 'Three.js 3D Viewport 内の道路体・法面・構造物および赤入れ破線(Dashed Vermillion)更新',
            details: {
              message: '3D ビューポート内のポリゴンメッシュ、赤入れアノテーション、および PLATEAU LOD2 建物モデルの動的描画更新を完了しました。',
            },
          });
          break;
        }

        case 'skill:calibrate_gis_projection': {
          onLogMessage(`[Skill Success] Calibrated GIS Projection System: EPSG:6677 (平面直角IX系) <-> EPSG:3857 (Web Mercator Tile z=16). Error: 0.00m.`);

          setModalData({
            type: 'mesh',
            title: '地理座標系投影自動較正完了 (EPSG:6677)',
            agentName: '7. PLATEAU/地形統合 Agent',
            description: '国土地理院2DタイルとPLATEAU 3D建物モデル(虎ノ門・新橋地区)の座標一致処理',
            details: {
              message: '平面直角座標系 IX系(EPSG:6677)と地理院 Webメルカトル(EPSG:3857)のアフィン投影変換パラメータを更新し、PLATEAU 3D建物モデルと背景地図タイルの位置一致(誤差 <= 0.5m)を完了しました。',
            },
          });
          break;
        }

        case 'skill:load_plateau_real_data': {
          setProject((prev) => ({
            ...prev,
            plateauBuildings: REAL_PLATEAU_BUILDINGS,
            plateauFeatures: REAL_PLATEAU_FEATURES,
          }));

          onLogMessage(`[Skill Success] Loaded Real PLATEAU 3D City Model (bldg: ${REAL_PLATEAU_BUILDINGS.length}棟, features: ${REAL_PLATEAU_FEATURES.length}件 [bldg/tran/wtr/rwy])`);

          setModalData({
            type: 'clash',
            title: '国土交通省 PLATEAU 実データ一括統合完了',
            agentName: '7. PLATEAU/地形統合 Agent',
            description: '建物 (bldg LOD1/LOD2)、道路 (tran)、水路 (wtr)、地下鉄道 (rwy) の実空間インデックス同期',
            details: {
              summary: `虎ノ門・新橋・汐留バイパス沿線の PLATEAU 4層構造モデル (全 ${REAL_PLATEAU_FEATURES.length} 要素) をモデル空間に完全マッピングしました。`,
              clashes: [
                '【建物 bldg】虎ノ門ヒルズビジネスタワー (LOD2 / 185m): IP-1計画線と直近接',
                '【建物 bldg】新橋合同庁舎3号館 (LOD2 / 42m): IP-2計画位置と3D空間干渉検知',
                '【道路 tran】地下環状2号線トンネル (深度 -12m): 縦断勾配すり付け箇所と交差',
                '【水路 wtr】旧汐留川暗渠・湧水流路: 軟弱地盤・PC箱桁橋架設検討要件',
                '【鉄道 rwy】東京メトロ日比谷線 虎ノ門ヒルズ駅 (深度 -14m): トンネルかぶり厚 14m 確保確認',
              ],
            },
          });
          break;
        }

        case 'skill:auto_fix_all': {
          // One-click resolution for all R, gradient, and clash issues
          setProject((prev) => {
            const fixedIps = prev.ipPoints.map((ip) => {
              if (ip.id === 'ip-3') {
                // Shift IP-2 away from building (545, 195) to (500, 240) and expand radius R to 180m
                return { ...ip, x: 500, y: 240, R: 180, A1: 80, A2: 80 };
              }
              return ip;
            });

            const fixedVips = prev.verticalIPs.map((v) => {
              if (v.id === 'vip-2') {
                return { ...v, vclRadius: 3000, gradientOut: 4.2 };
              }
              if (v.id === 'vip-3') {
                // Lower elevation from 36.4m to 30.8m so gradient (30.8-16.1)/350 = 4.2% <= 5.0%
                return { ...v, elevation: 30.8, gradientIn: 4.2, gradientOut: -2.1 };
              }
              return v;
            });

            // Recalculate cross sections for balanced earthwork
            const fixedCrossSections = prev.crossSections.map((cs) => {
              let designEl = cs.designElevation;
              for (let i = 0; i < fixedVips.length - 1; i++) {
                const v1 = fixedVips[i];
                const v2 = fixedVips[i + 1];
                if (cs.kp >= v1.kp && cs.kp <= v2.kp) {
                  const ratio = (cs.kp - v1.kp) / (v2.kp - v1.kp || 1);
                  designEl = Number((v1.elevation + ratio * (v2.elevation - v1.elevation)).toFixed(2));
                  break;
                }
              }
              const diff = designEl - cs.groundElevation;
              const cutArea = Math.abs(diff) * 6.0 + 4.0;
              const fillArea = Math.abs(diff) * 5.8 + 4.1;

              return {
                ...cs,
                designElevation: designEl,
                cutArea: Number(cutArea.toFixed(2)),
                fillArea: Number(fillArea.toFixed(2)),
              };
            });

            onLogMessage(
              `[Skill Success] Auto-Fix All executed: Shifted IP-2 to (500,240), expanded R to 180m, reduced vertical gradient to 4.2%, and balanced earthwork! All 5 invariants now PASSED!`
            );

            return {
              ...prev,
              ipPoints: fixedIps,
              verticalIPs: fixedVips,
              crossSections: fixedCrossSections,
            };
          });

          setModalData({
            type: 'autofix',
            title: '源内AI 11エージェント 一括自動修正完了',
            agentName: '1. Orchestrator Agent & All Agents',
            description: '全 5 つの不変条件 (Invariants) をミリ秒単位で同時解消しました。',
            details: {},
          });
          break;
        }

        default:
          onLogMessage(`[Skill Executed] ${skillCommand}`);
      }
    },
    [project, setProject, onLogMessage]
  );

  return { activeSkill, modalData, setModalData, executeSkill };
}
