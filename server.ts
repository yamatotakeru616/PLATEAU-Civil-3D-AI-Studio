import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { queryPlateauFeaturesByBBox } from './src/data/plateauRealData';
import { queryRealPlateauBuildingsByBBox } from './src/server/plateauBboxQuery';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

app.post('/api/gemini/rag', async (req, res) => {
  const { roadClass, designSpeed, radius, gradient, sightDistance, issueDescription } = req.body;
  
  const fallbackExplanation = `【道路構造令 Gemini RAG 判定・技術解説】\n■ 対象路線条件:\n・道路区分: ${roadClass || '第3種第2級'} (設計速度: ${designSpeed || 60} km/h)\n・判定箇所: IP-2 (新橋1丁目西) KP520m 付近\n\n■ 照合判定・違反項目:\n1. 曲線半径 (道路構造令 第15条): 現状 R = ${radius || 120}m < 最小規定 150m (不適合)\n2. 縦断勾配 (道路構造令 第20条): 現状 i = ${gradient || 5.8}% > 上限規定 5.0% (不適合)\n3. 制止視距 (道路構造令 第22条): 現状 S = ${sightDistance || 68}m < 規定視距 75m (要改善)\n\n■ エージェント改善処方箋:\n・【平面線形】クロソイドパラメータ A1=80 / A2=80 を維持したまま、曲線半径 R=180m に拡大補正。\n・【縦断計画】KP300m〜KP650m 区間の縦断曲線長 VCL=120m を適用し、最大勾配 i=4.2% に緩和。\n・【PLATEAU 3D干渉】新橋合同庁舎3号館(LOD2)との立体離隔距離を 28.5m 以上確保するため、IP-2 座標を E:500, N:240 へ自律バイパスシフト完了。`;

  const fallbackLegalRefs = [
    '道路構造令 第15条 (曲線半径)',
    '道路構造令 第20条 (縦断勾配)',
    '道路構造令 第22条 (視距)',
    '道路構造令施行令 第27条 (クロソイドすり付け)',
  ];

  try {
    const ai = getGenAIClient();
    if (!ai) {
      return res.json({
        success: true,
        isFallback: true,
        explanation: fallbackExplanation,
        legalReferences: fallbackLegalRefs,
      });
    }

    const prompt = `あなたは日本の土木道路設計および「道路構造令」の熟練技術エキスパートAIです。\n以下の設計値および指摘事項について、道路構造令の条文根拠（第何条、施行令、解説・運用など）を交えて、技術的解説と具体的な線形修正案を回答してください。\n\n■ 設計条件:\n- 道路区分: ${roadClass || '第3種第2級'}\n- 設計速度: ${designSpeed || 60} km/h\n- 現状平面曲線半径 R: ${radius} m\n- 現状縦断勾配 i: ${gradient} %\n- 現状制止視距 S: ${sightDistance} m\n- 発生している問題: ${issueDescription}\n\n■ 回答形式:\n1. 道路構造令適合判定結果 (OK/要修正/違反)\n2. 根拠条文および規定値の解説\n3. 具体的な改善提案 (クロソイドパラメータAの変更、IP点シフト量、VCL縦断曲線半径などの数値含む)\n4. PLATEAU 3D都市モデルとの干渉回避の留意点\n\n技術的かつ明確に日本語で回答してください。`;

    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(null), 5000)
    );

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const response: any = await Promise.race([geminiPromise, timeoutPromise]);

    if (!response || !response.text) {
      return res.json({
        success: true,
        isFallback: true,
        explanation: fallbackExplanation,
        legalReferences: fallbackLegalRefs,
      });
    }

    res.json({
      success: true,
      explanation: response.text,
      legalReferences: fallbackLegalRefs,
    });
  } catch (error: any) {
    console.error('Gemini RAG Error, using fallback:', error);
    res.json({
      success: true,
      isFallback: true,
      explanation: fallbackExplanation,
      legalReferences: fallbackLegalRefs,
    });
  }
});

app.post('/api/gemini/agent-consult', async (req, res) => {
  try {
    const { agentId, agentName, contextData } = req.body;

    const ai = getGenAIClient();
    if (!ai) {
      return res.json({
        success: true,
        agentId,
        agentName,
        isFallback: true,
        reply: `【${agentName} AI エージェント分析】\\n現在のパラメータ (${JSON.stringify(contextData)}) に対し、赤入れ提案 (Dashed Vermillion) を集約しました。安全率と土工バランスを考慮し、推奨位置へIP点を自動シフト可能です。`,
      });
    }

    const prompt = `あなたは「源内AI」土木CAD統合システムの【${agentName}】エージェントです。\n現在の設計コンテキスト:\n${JSON.stringify(contextData, null, 2)}\n\n専門エージェントとして、現在の設計数値に対する修正提案（赤入れ指示）、土木工学的な定量的アドバイス、リスク分析を簡潔な日本語で提示してください。`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      agentId,
      agentName,
      reply: response.text,
    });
  } catch (error: any) {
    console.error('Agent Consult Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Agent consulting failed',
    });
  }
});

// Real PLATEAU Spatial BBox Query (Tokyo 23-ku MVT incl. Minato 13103 + mock fallback)
app.post('/api/plateau/query-bbox', async (req, res) => {
  try {
    const { minLon, minLat, maxLon, maxLat } = req.body;
    if (minLon === undefined || minLat === undefined || maxLon === undefined || maxLat === undefined) {
      return res.status(400).json({ success: false, error: 'Missing bounding box parameters' });
    }

    let result;
    try {
      result = await queryRealPlateauBuildingsByBBox(
        Number(minLon),
        Number(minLat),
        Number(maxLon),
        Number(maxLat)
      );
    } catch (e) {
      console.warn('Real PLATEAU query failed, using mock:', e);
      result = {
        ...queryPlateauFeaturesByBBox(Number(minLon), Number(minLat), Number(maxLon), Number(maxLat)),
        source: 'mock-fallback' as const,
        tileCount: 0,
      };
    }

    res.json({
      success: true,
      source: result.source,
      tileCount: result.tileCount,
      queryBBox: result.bbox,
      featureCounts: result.counts,
      totalCount: result.features.length,
      buildings: result.buildings,
      features: result.features,
    });
  } catch (error: any) {
    console.error('PLATEAU BBox Query Error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Spatial query failed' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CIVIL 3D AI Studio Server running on http://localhost:${PORT}`);
  });
}

startServer();
