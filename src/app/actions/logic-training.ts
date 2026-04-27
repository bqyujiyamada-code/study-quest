"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateLogicLesson(theme: string) {
  // モデル名を最新の gemini-3-flash-preview に固定
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = `あなたは、小学生・中学生向けに「論理的な文章の書き方」を教える専門講師です。
    テーマ「${theme}」について、因果関係を重視したトレーニング資料を以下のJSON形式で回答してください。

    ### 出力フォーマット:
    {
      "opinion_example": "私は、${theme}について、〜と考えている。",
      "opinion_point": "意見を作る際の思考のポイント",
      "reasons": [
        {
          "reason_title": "理由の視点（例：文化、自分自身、社会など）",
          "reason_point": "この根拠を思いつくためのヒント",
          "composition": "私は、${theme}について、〜と考えている。なぜなら、〜からだ。",
          "logic_check": "この作文の因果関係がなぜ正しいのかの解説"
        }
      ]
    }

    ### 厳守事項:
    1. composition（作文）は、必ず「私は、〜。なぜなら、〜からだ。」という構成にし、105文字以内にしてください。
    2. reasonsは異なる視点で3つ作成してください。
    3. 解説は、娘さんが納得できるよう、優しく論理的に書いてください。`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    // 成功時はデータをラップして返す
    return { success: true, data: JSON.parse(text) };
  } catch (error: any) {
    console.error("LOGIC_LESSON_FAILURE:", error);
    
    let errorMessage = "レッスンがうまく作れなかったよ。もう一度テーマを入れてみてね。";
    
    // 503エラー（混雑）を個別に判定
    if (error.status === 503 || error.message?.includes("503")) {
      errorMessage = "今Gemini先生が非常に混み合っているみたい。30秒ほど待ってからもう一度「クエスト開始」を押してみてね。";
    }
    
    // 失敗時もオブジェクトとして返し、クライアント側で確実に受け取れるようにする
    return { success: false, error: errorMessage };
  }
}
