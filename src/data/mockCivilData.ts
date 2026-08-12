import {
  AlignmentProject,
  IPPoint,
  VerticalIP,
  CrossSectionPoint,
  PlateauBuilding,
  PlateauFeature,
  CivilSkill,
  AgentInfo,
} from '../types/civil';

export const INITIAL_AGENTS: AgentInfo[] = [
  {
    id: 'orchestrator_agent',
    number: 1,
    name: '1. Orchestrator Agent',
    role: '全タスク分配・赤入れ集約・コンフリクト調停・VRAM制御',
    status: 'active',
    autoRun: true,
    lastRunTime: 'リアルタイム監視中',
    activityCount: 24,
    latestThought: '全サブエージェント提案を集約中。線形回避案と土工均衡案のコンフリクトを調停済。',
    confidence: 0.99,
  },
  {
    id: 'linear_design_agent',
    number: 2,
    name: '2. 線形設計 Agent',
    role: '平面線形(IP配置, クロソイドA, 円曲線)自動計算',
    status: 'active',
    autoRun: true,
    lastRunTime: '2秒前',
    activityCount: 18,
    latestThought: 'IP-2曲線半径 R=120m < 150m (60km/h規格) 検出。R=160m 拡大案を赤入れ提示中。',
    confidence: 0.98,
  },
  {
    id: 'profile_design_agent',
    number: 3,
    name: '3. 縦断設計 Agent',
    role: '縦断勾配(VCL), すり付け半径, 視距(Sight Distance)検証',
    status: 'active',
    autoRun: true,
    lastRunTime: '3秒前',
    activityCount: 15,
    latestThought: 'KP300m 縦断勾配 i=5.8% > 5.0% 検出。登坂失速防止のため i=4.5% へ緩和案を作成。',
    confidence: 0.95,
  },
  {
    id: 'earthwork_agent',
    number: 4,
    name: '4. 横断/土工 Agent',
    role: '標準横断面・切土/盛土法面・平均断面法 Cut/Fill 算出',
    status: 'active',
    autoRun: true,
    lastRunTime: '5秒前',
    activityCount: 12,
    latestThought: '全横断(KP0~1100m)土量分析中。Cut/Fill比率 1.42(アンバランス)に対し縦断下げ提案。',
    confidence: 0.91,
  },
  {
    id: 'rag_ordinance_agent',
    number: 5,
    name: '5. 道路構造令 RAG Agent',
    role: '道路区分基準照合・Gemini 2.5 Flash 条文根拠自動解説',
    status: 'active',
    autoRun: true,
    lastRunTime: '1秒前',
    activityCount: 21,
    latestThought: '道路構造令 第15条(R値)および第20条(縦断勾配)との整合性を自動判定中。',
    confidence: 0.96,
  },
  {
    id: 'structure_selection_agent',
    number: 6,
    name: '6. 構造物選定 Agent',
    role: 'F-103マトリクスに基づく最適橋梁・トンネル・カルバート推薦',
    status: 'active',
    autoRun: true,
    lastRunTime: '8秒前',
    activityCount: 9,
    latestThought: '汐留谷地交差部 L=120m に対し 3径間連続PC箱桁橋 を自動適用推奨。',
    confidence: 0.92,
  },
  {
    id: 'plateau_clash_agent',
    number: 7,
    name: '7. PLATEAU/地形統合 Agent',
    role: 'PLATEAU 4層(建物/道路/鉄道/DEM) 3D空間干渉検知',
    status: 'active',
    autoRun: true,
    lastRunTime: '1秒前',
    activityCount: 30,
    latestThought: '新橋合同庁舎3号館(LOD2)との立体離隔 22m < 25m を検知。赤入れBOXとバイパス案生成。',
    confidence: 0.99,
  },
  {
    id: 'qa_verification_agent',
    number: 8,
    name: '8. 検証/QA Agent',
    role: '自動テストスイート実行・5大不変条件(Invariants)リアルタイム検証',
    status: 'active',
    autoRun: true,
    lastRunTime: 'リアルタイム',
    activityCount: 42,
    latestThought: 'Auto-Testing Hooks 監視中: 5項目中 2項目(R値・勾配)でInvariantアラートを検出。',
    confidence: 0.99,
  },
  {
    id: 'doc_sync_agent',
    number: 9,
    name: '9. ドキュメント同期 Agent',
    role: '設計仕様書・スキル実行履歴・GEMINI.md 設計情報の動的同期',
    status: 'active',
    autoRun: true,
    lastRunTime: '12秒前',
    activityCount: 8,
    latestThought: 'スキル実行ログおよび設計パラメータのドキュメント同期ログを更新中。',
    confidence: 0.94,
  },
  {
    id: 'knowledge_graph_agent',
    number: 10,
    name: '10. ナレッジグラフ/ctx Agent',
    role: '都内都市バイパス過去設計データ・ナレッジインデックス参照',
    status: 'active',
    autoRun: true,
    lastRunTime: '15秒前',
    activityCount: 11,
    latestThought: '虎ノ門・新橋地区 地質データ(N値>30支持層)および過年度バイパス事例を参照。',
    confidence: 0.93,
  },
  {
    id: 'cad_engine_agent',
    number: 11,
    name: '11. CAD Agent',
    role: 'Three.js 3Dメッシュ生成・Half-Edge CSG・赤入れ破線(Vermillion)描画',
    status: 'active',
    autoRun: true,
    lastRunTime: 'リアルタイム',
    activityCount: 60,
    latestThought: '3Dビューポート描画更新: 破線赤入れシェイプ(Dashed Vermillion)およびLODメッシュ生成中。',
    confidence: 0.99,
  },
  {
    id: 'ui_testing_agent',
    number: 12,
    name: '12. UI/機能総合検証 Agent',
    role: '全リボンコマンド・ビューポート(2D/3D/縦断/横断)・ズームパン・自動テストHookの動的検証',
    status: 'active',
    autoRun: true,
    lastRunTime: 'リアルタイム',
    activityCount: 68,
    latestThought: '【UI自動検証】全ビューポート、ズーム/パン操作、リボンボタンのテスト・UI動作整合性100%パス。',
    confidence: 0.99,
  },
];

export const INITIAL_IP_POINTS: IPPoint[] = [
  { id: 'ip-1', name: 'BP (起点 虎ノ門西)', x: 0, y: 0, elevation: 12.5, R: 0, A1: 0, A2: 0, kp: 0 },
  { id: 'ip-2', name: 'IP-1 (虎ノ門ヒルズ交差点)', x: 434, y: 78, elevation: 14.8, R: 180, A1: 75, A2: 75, kp: 250 },
  { id: 'ip-3', name: 'IP-2 (新橋合同庁舎西)', x: 742, y: 123, elevation: 18.2, R: 120, A1: 60, A2: 60, kp: 520 }, // R=120 violates R_min 150m for 60km/h
  { id: 'ip-4', name: 'IP-3 (新橋駅前広場)', x: 1248, y: 245, elevation: 22.0, R: 250, A1: 90, A2: 90, kp: 840 },
  { id: 'ip-5', name: 'EP (終点 汐留メディアタワー)', x: 1357, y: 601, elevation: 25.4, R: 0, A1: 0, A2: 0, kp: 1100 },
];

export const INITIAL_VERTICAL_IPS: VerticalIP[] = [
  { id: 'vip-1', kp: 0, elevation: 12.5, vclRadius: 0, gradientIn: 0, gradientOut: 1.2 },
  { id: 'vip-2', kp: 300, elevation: 16.1, vclRadius: 2500, gradientIn: 1.2, gradientOut: 5.8 }, // 5.8% violates max 5.0%
  { id: 'vip-3', kp: 650, elevation: 36.4, vclRadius: 1800, gradientIn: 5.8, gradientOut: -2.1 },
  { id: 'vip-4', kp: 1100, elevation: 25.4, vclRadius: 0, gradientIn: -2.1, gradientOut: 0 },
];

export const generateCrossSections = (): CrossSectionPoint[] => {
  const sections: CrossSectionPoint[] = [];
  for (let kp = 0; kp <= 1100; kp += 50) {
    const ground = 12 + (kp / 1000) * 12 + Math.sin(kp / 80) * 2.5;
    const design = 12.5 + (kp / 1100) * 12.9 + Math.sin(kp / 200) * 1.5;
    const diff = design - ground;
    
    // Cut if design < ground, Fill if design > ground
    const cutArea = diff < 0 ? Math.abs(diff) * 12.4 + 4.2 : 0;
    const fillArea = diff > 0 ? diff * 14.2 + 5.1 : 0;

    sections.push({
      kp,
      groundElevation: Number(ground.toFixed(2)),
      designElevation: Number(design.toFixed(2)),
      cutArea: Number(cutArea.toFixed(2)),
      fillArea: Number(fillArea.toFixed(2)),
      leftSlope: diff > 0 ? '1:1.5 (盛土)' : '1:1.2 (切土)',
      rightSlope: diff > 0 ? '1:1.5 (盛土)' : '1:1.2 (切土)',
      roadWidth: 10.5,
    });
  }
  return sections;
};

import { REAL_PLATEAU_BUILDINGS, REAL_PLATEAU_FEATURES } from './plateauRealData';

export const INITIAL_PLATEAU_BUILDINGS: PlateauBuilding[] = REAL_PLATEAU_BUILDINGS;

export const CIVIL_SKILLS: CivilSkill[] = [
  { id: 'sk-1', command: 'skill:add_ip_point', name: '平面IP点追加/変更', category: '線形', description: '平面線形に新しいIP点を挿入し、クロソイド曲線と円曲線を自動フィッティングします。' },
  { id: 'sk-2', command: 'skill:optimize_clothoid', name: 'クロソイドA最適化', category: '線形', description: '設計速度とR値に基づき、適切なクロソイドパラメータA1, A2を自動計算補正します。' },
  { id: 'sk-3', command: 'skill:calculate_earthwork', name: '土工量自動集計(平均断面法)', category: '土工', description: '全横断面の切土積・盛土積から平均断面法で総土量(Cut/Fill m³)と均衡率を計算します。' },
  { id: 'sk-4', command: 'skill:check_compliance', name: '道路構造令リアルタイム検証', category: '法令RAG', description: '第3種第2級の設計速度60km/hに対する最小半径R、最大縦断勾配i、視距Sの適否をチェック。' },
  { id: 'sk-5', command: 'skill:detect_plateau_clash', name: 'PLATEAU 3D都市模型干渉検知', category: 'PLATEAU', description: 'PLATEAU 4層(建物/道路/鉄道/DEMメッシュ)と計画3D道路空間との交差・干渉を判定。' },
  { id: 'sk-6', command: 'skill:suggest_structure', name: 'F-103マトリクス構造物推奨', category: '構造物', description: '支間長・地質・縦断条件からPC箱桁橋・鋼桁・カルバートの最適構造を推論・自動提案。' },
  { id: 'sk-7', command: 'skill:generate_3d_mesh', name: '3D道路体メッシュ生成', category: '3Dメッシュ', description: 'Three.js 3Dビューポートへ道路体・法面・構造物メッシュを高精度リアルタイム描画。' },
  { id: 'sk-8', command: 'skill:calibrate_gis_projection', name: '地理座標系投影自動較正', category: 'GIS', description: '平面直角座標系 IX系(EPSG:6677)とWebメルカトル(EPSG:3857)の2D地図・PLATEAU 3Dモデル位置合わせ。' },
  { id: 'sk-9', command: 'skill:load_plateau_real_data', name: 'PLATEAU実データ多層一括統合', category: 'PLATEAU', description: '国土地理院・国土交通省 PLATEAU 3D都市モデル(建物bldg/道路tran/水路wtr/鉄道rwy)を完全同期ロード。' },
];

export const DEFAULT_PROJECT: AlignmentProject = {
  id: 'proj-1',
  name: '東京環状道路 新橋・虎ノ門バイパス線形計画',
  roadClassification: '第3種第2級',
  designSpeedKmh: 60,
  ipPoints: INITIAL_IP_POINTS,
  verticalIPs: INITIAL_VERTICAL_IPS,
  crossSections: generateCrossSections(),
  plateauBuildings: INITIAL_PLATEAU_BUILDINGS,
  plateauFeatures: REAL_PLATEAU_FEATURES,
  selectedKp: 500,
  vramBudgetMB: 4096,
  currentKernel: 'intuitive_halfedge',
};
