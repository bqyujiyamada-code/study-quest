"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateLogicLesson(theme: string) {
  // 娘さんのトレーニング用には、最新の gemini-3-flash-preview を指定
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = `あなたは、小学生・中学生向けに「論理的な文章の書き方」を教える専門講師です。
    テーマ「${theme}」について、因果関係を重視したトレーニング資料を以下のJSON形式で回答してください。

    ### 出力フォーマット:
    {
      "opinion_example": "テーマに対する一文の意見例（私は、${theme}について、〜と考えている）",
      "opinion_point": "意見を作る際の思考のポイントやキーワードのアドバイス",
      "reasons": [
        {
          "reason_title": "理由の視点（例：自分にとって、社会にとって、文化としてなど）",
          "reason_point": "この根拠を思いつくための問いかけや考え方のポイント",
          "composition": "「意見＋なぜなら〜からだ」の形式で105文字以内の作文",
          "logic_check": "この作文の因果関係や根拠がなぜ正しいのかの論理解説"
        }
      ]
    }

    ### 厳守事項:
    1. composition（作文）は、必ず「私は、〜。なぜなら、〜からだ。」という因果関係を明確にした構成にし、105文字以内にしてください。
    2. reasonsは異なる視点（多角的な考え方）で3つ作成してください。
    3. 解説は、論理のつながりを褒めつつ、ポイントを優しく解説してください。`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error: any) {
    console.error("LOGIC_LESSON_FAILURE:", error);
    // 503エラーなどのハンドリング（DevPhraseでの知見を活かして）
    if (error.status === 503) {
      throw new Error("今Gemini先生が混み合っているみたい。少し待ってからもう一度試してね。");
    }
    throw new Error("レッスンがうまく作れなかったよ。もう一度テーマを入れてみてね。");
  }
}
