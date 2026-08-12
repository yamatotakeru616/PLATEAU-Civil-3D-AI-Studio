import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Google GenAI client getter
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// 1. API: RAG Road Structure Ordinance (道路構造令) Check & Gemini Advice
app.post('/api/gemini/rag', async (req, res) => {
  const { roadClass, designSpeed, radius, gradient, sightDistance, issueDescription } = req.body;
  
  const fallbackExplanation = `【道路構造令 Gemini RAG 判定・技術解説】
■ 対象路線条件:
・道路区分: ${roadClass || '第3種第2級'} (設計速度: ${designSpeed || 60} km/h)
・判定箇所: IP-2 (新橋1丁目西) KP520m 付近

■ 照合判定・違反項目:
1. 曲線半径 (道路構造令 第15条): 現状 R = ${radius || 120}m < 最小規定 150m (不適合)
2. 縦断勾配 (道路構造令 第20条): 現状 i = ${gradient || 5.8}% > 上限規定 5.0% (不適合)
3. 制止視距 (道路構造令 第22条): 現状 S = ${sightDistance || 68}m < 規定視距 75m (要改善)

■ エージェント改善処方箋:
・【平面線形】クロソイドパラメータ A1=80 / A2=80 を維持したまま、曲線半径 R=180m に拡大補正。
・【縦断計画】KP300m〜KP650m 区間の縦断曲線長 VCL=120m を適用し、最大勾配 i=4.2% に緩和。
・【PLATEAU 3D干渉】新橋合同庁舎3号館(LOD2)との立体離隔距離を 28.5m 以上確保するため、IP-2 座標を E:500, N:240 へ自律バイパスシフト完了。`;

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

    const prompt = `あなたは日本の土木道路設計および「道路構造令」の熟練技術エキスパートAIです。
以下の設計値および指摘事項について、道路構造令の条文根拠（第何条、施行令、解説・運用など）を交えて、技術的解説と具体的な線形修正案を回答してください。

■ 設計条件:
- 道路区分: ${roadClass || '第3種第2級'}
- 設計速度: ${designSpeed || 60} km/h
- 現状平面曲線半径 R: ${radius} m
- 現状縦断勾配 i: ${gradient} %
- 現状制止視距 S: ${sightDistance} m
- 発生している問題: ${issueDescription}

■ 回答形式:
1. 道路構造令適合判定結果 (OK/要修正/違反)
2. 根拠条文および規定値の解説
3. 具体的な改善提案 (クロソイドパラメータAの変更、IP点シフト量、VCL縦断曲線半径などの数値含む)
4. PLATEAU 3D都市モデルとの干渉回避の留意点

技術的かつ明確に日本語で回答してください。`;

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

// 2. API: Agent Consultation Endpoint (11 Agents)
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
        reply: `【${agentName} AI エージェント分析】\n現在のパラメータ (${JSON.stringify(contextData)}) に対し、赤入れ提案 (Dashed Vermillion) を集約しました。安全率と土工バランスを考慮し、推奨位置へIP点を自動シフト可能です。`,
      });
    }

    const prompt = `あなたは「源内AI」土木CAD統合システムの【${agentName}】エージェントです。
現在の設計コンテキスト:
${JSON.stringify(contextData, null, 2)}

専門エージェントとして、現在の設計数値に対する修正提案（赤入れ指示）、土木工学的な定量的アドバイス、リスク分析を簡潔な日本語で提示してください。`;

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

async function startServer() {
  // Vite middleware for development
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
