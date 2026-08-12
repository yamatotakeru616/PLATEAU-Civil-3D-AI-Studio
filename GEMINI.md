# GEMINI.md — PLATEAU×源内AI統合設計支援システム (CIVIL 3D AI)

## 1. プロジェクト概要

本プロジェクトは、国土交通省の3D都市モデル「PLATEAU」データと、12の専門AIエージェント（源内AI）群が連携し、AutoCAD Civil 3Dのような高度な土木線形設計（平面・縦断・横断・土工）、構造物選定、道路構造令リアルタイム検証、PLATEAU 3D干渉チェック、および赤入れ提案（Dashed Vermillion Annotation）を提供する統合Web CADアプリケーションです。

---

## 2. 統合エージェントアーキテクチャ (12 Autonomous Agents)

全12エージェントは自律並列ループ（Autonomous Multi-Agent Engine `useAutonomousAgentEngine`）上で常時動作し、自律思考・提案生成・コンフリクト調停を行って赤入れオーバーレイ（Dashed Vermillion）を出力します。

特に、**ユーザーによるIP点操作（移動・追加）のトリガー時**には、以下の**リアクティブ・カスケード（連動修正 & 相互クロスチェック）**が自動発動します：
- **Step 1 [連動修復]**: `線形設計 Agent` が幾何パラメトリック補正 (クロソイド $A1, A2$, 半径 $R$) を自動修正。
- **Step 2 [空間干渉再算]**: `PLATEAU/地形統合 Agent` が PLATEAU 3Dモデルとの離隔距離を即座に再スキャン。
- **Step 3 [法令・縦断・土工クロスチェック]**: `道路構造令 RAG Agent`, `縦断設計 Agent`, `横断/土工 Agent`, `構造物選定 Agent` が新線形に対する適合性・縦断勾配・Cut/Fill土量バランスを相互検証。
- **Step 4 [自動テスト & 調停]**: `検証/QA Agent` が不変条件 Invariants を判定し、`Orchestrator Agent` が調停結果を3Dビューポート赤入れとストリームログに同期。

1. **Orchestrator Agent**: タスク分配・赤入れ提案集約・コンフリクト検知・VRAM/メモリ制御
2. **線形設計Agent (平面線形)**: IP点配置、クロソイド曲線(Aパラメータ)、円曲線の最適化
3. **縦断設計Agent**: 縦断勾配(VCL)、すり付け曲線半径、視距(Sight Distance)計算
4. **横断/土工Agent**: 標準横断面、切土/盛土法面、平均断面法による土量(Cut/Fill)算出
5. **道路構造令RAG Agent**: 道路区分(第3種第2級等)に応じた法令基準との照合、Gemini APIによる条文根拠解説
6. **構造物選定Agent**: 支間長・荷重・地形条件に基づくF-103マトリクス構造物(PC箱桁等)推薦
7. **PLATEAU/地形統合Agent**: PLATEAU 4層(建物/道路/鉄道/DEMメッシュ)との3D空間干渉(Clash)検知
8. **検証/QA Agent**: 自動テストスイート実行、線形・土工数値の整合性チェック
9. **ドキュメント同期Agent**: 変更に応じた設計仕様書・スキル定義の同期・整合性チェック
10. **ナレッジグラフ/ctx Agent**: 過去の設計セッションおよび法令ナレッジのインデックス参照
11. **CAD Agent**: 3Dビューポート描画、簡易CSG/ボザン/LOD切り替え、赤入れシェイプ生成
12. **UI/機能総合検証 Agent**: 全ビューポート・リボンコマンド・ズームパン操作・UI機能の導通自動検証

---

## 3. 操作のスキル化 (Agent Skill Engine)

ユーザーおよびAIエージェントの操作はすべてカプセル化された「操作スキル (Civil3DSkill)」として実行されます。

- `skill:add_ip_point`: 平面IP点の追加・移動
- `skill:optimize_clothoid`: クロソイドパラメータ $A$ の自動計算・曲線補正
- `skill:calculate_earthwork`: 全横断の切土量・盛土量(平均断面法)の算出
- `skill:check_compliance`: 道路構造令適合判定(R値, 縦断勾配, 視距)
- `skill:detect_plateau_clash`: PLATEAU建物・インフラモデルとの3D干渉チェック
- `skill:suggest_structure`: 橋梁・トンネル等の推奨構造物マトリクス判定
- `skill:generate_3d_mesh`: 道路体・法面・構造物の3Dメッシュ生成
- `skill:calibrate_gis_projection`: 平面直角座標系 IX系(EPSG:6677) ↔ Webメルカトル(EPSG:3857) 投影変換自動較正
- `skill:load_plateau_real_data`: 国土交通省 PLATEAU 3D都市モデル(建物bldg/道路tran/水路wtr/鉄道rwy)多層一括同期

---

## 4. Hooksによる自動テスト (Auto-Testing Custom Hooks)

`useAutoTestEngine` などのカスタムHookが設計操作のたびにリアルタイムで不変条件(Invariants)をテスト実行します。

- **Invariant 1 (R値下限)**: 設計速度（例: 60km/h）に対する最小曲線半径 $R \ge R_{min}$
- **Invariant 2 (土工バランス)**: $\text{Cut Volume} / \text{Fill Volume} \approx 1.0$ (土工均衡率)
- **Invariant 3 (縦断勾配)**: 最大縦断勾配 $i_{max} \le 5\%$ (第3種第2級の場合)
- **Invariant 4 (視距確保)**: 制止視距 $S \ge S_{req}$
- **Invariant 5 (干渉ゼロ)**: PLATEAU重要構造物(severity=critical)との干渉要素数が0であること
- **Invariant 6 (ナビゲーション操作導通)**: 2D/3Dビューポートでのホイールズーム・ドラッグパンの動作判定
- **Invariant 7 (GIS/PLATEAU座標系整合性)**: 平面直角IX系(EPSG:6677)とWebメルカトル(EPSG:3857)の投影位置誤差 $\le 0.5\text{m}$ 判定
- **Invariant 8 (PLATEAU本物多層データ整合性)**: PLATEAU 4層 (建物 bldg/道路 tran/水路 wtr/鉄道 rwy) の空間インデックス・属性・空間離隔検証

---

## 5. Grill Me (技術的ツッコミ・問題提起・解決策)

### 質問・ツッコミ1: WEBブラウザ環境でのOCCT-WASM / メモリ制約
- **ツッコミ**: 本格的な3D CADカーネル(OpenCASCADE WASM)をブラウザで動かすと、数MBのDEMメッシュやPLATEAU 3Dタイルで即座にVRAM/WASMメモリ上限に達します。
- **解決策**: Three.jsの軽量ポリゴン演算＋Half-Edge構造による軽量3D表示を採用し、必要な箇所のみ簡易CSG / メッシュジェネレータで動的にLODをコントロールします。

### 質問・ツッコミ2: 道路構造令RAGの実効性とレスポンス速度
- **ツッコミ**: 毎操作ごとにLLMを呼び出すとレイテンシが大きくCADのリアルタイム性が損なわれます。
- **解決策**: 数値判定（$R < 150m$ 等）はミリ秒単位のJavaScript計算エンジンで行い、違法箇所の理由説明や例外規定の参照時のみGemini APIを非同期で呼ぶ2レイヤー構成とします。

### 質問・ツッコミ3: 赤入れ提案 (Dashed Vermillion Annotation) の衝突回避
- **ツッコミ**: 11個のエージェントが同時に画面上に修正案を描画すると視認性が破壊されます。
- **解決策**: Orchestrator Agentが優先順位付けとレイヤーフィルタリングを行い、重ね合わせ（コンフリクト）を検知して1つの統合赤入れとしてまとめます。

### 質問・ツッコミ4: 国土地理院Webメルカトルタイル(EPSG:3857)とCAD平面直角座標系(EPSG:6677)の位置ズレ
- **ツッコミ**: 国土地理院・OSMのWebメルカトル地図(緯度経度)と、PLATEAU 3D/Civil 3Dの平面直角座標(メートル単位)は投影モデルが異なるため、単純重ね合わせでは建物や線形位置が数10m以上ズレます。
- **解決策**: `src/utils/gisProjection.ts` による極座標・アフィン投影変換とアンカー基準自動フィッティングを実装し、誤差 $\le 0.5\text{m}$ 高精度アライメントを実現しました。

### 質問・ツッコミ5: PLATEAU実データ (建物/道路/水路/鉄道) のブラウザ内描画パフォーマンス
- **ツッコミ**: CityGML の巨大な PLATEAU データをそのままクライアントで描画するとメモリ低下やフレームレート落下の危険があります。
- **解決策**: 虎ノ門・新橋バイパス沿線（KP 0m〜1100m, 左右500m圏内）の空間バウンディングボックスで最適化された `plateauRealData.ts` インデックスを採用し、 Three.js 3D View & 2D SVG 上で 60fps スムーズ表示を確保しました。

---

## 6. 実装ロードマップ & Plan

1. **Phase 1: フルスタック基盤・サーバーAPI設定** (Express + Gemini API 連携 + Vite)
2. **Phase 2: CIVIL 3D 統合ワークスペース UI** (Three.js 3D View, 2D Alignment View, Profile View, Cross-Section View, Agent Panel)
3. **Phase 3: 11エージェントモジュール & RAGエンジン** (線形・縦断・土工・構造令・PLATEAU干渉)
4. **Phase 4: 操作のスキル化 & カスタムHook自動テスト** (`useAutoTestEngine`, `useCivil3DSkills`)
5. **Phase 5: PLATEAUサンプルデータ統合 & インタラクティブ赤入れオーバーレイ**

