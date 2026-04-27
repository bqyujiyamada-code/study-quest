"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type TrainingMode = "causality" | "contrast";

export async function generateLogicLesson(theme: string, mode: TrainingMode = "causality") {
  // モデルは最新の gemini-3-flash-preview を使用
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  // モードに応じてプロンプトを出し分け
  const prompt = mode === "causality" 
    ? `あなたは、小中学生向けに「論理的な文章の書き方」を教える専門講師です。
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
    1. composition（作文）は必ず「私は、〜。なぜなら、〜からだ。」の構成にし、105文字以内にすること。
    2. reasonsは異なる視点で3つ作成すること。`
    
    : `あなたは論理的思考の専門講師です。「${theme}」というテーマについて、あえて異なる2つの立場（AとB）から対比させて考えるトレーニング資料をJSON形式で作成してください。

    ### 出力フォーマット:
    {
      "opinion_a": "立場Aの意見例",
      "opinion_b": "立場Bの意見例",
      "contrast_points": [
        {
          "point_title": "対比の視点（例：結果のわかりやすさ、周囲への影響など）",
          "desc_a": "Aの場合：〜。",
          "desc_b": "その一方でBは：〜。"
        }
      ],
      "teaching_point": "対比を抽出する際のポイント（どのような効果や問題点が生じるか考える等）",
      "essays": [
        {
          "side": "Aの立場",
          "composition": "（私は〜の方がよいと思う。なぜなら〜だからだ。一方で〜。私は〜なので〜にするほうがよいと思う、の構成で135〜165文字）",
          "logic_check": "この文章の論理的ポイントや説得力の解説"
        },
        {
          "side": "Bの立場",
          "composition": "（同上の構成でBの立場の作文を135〜165文字）",
          "logic_check": "この文章の論理的ポイントや説得力の解説"
        }
      ]
    }

    ### 厳守事項:
    1. contrast_points（対比）は必ず2つ以上作成すること。
    2. essaysのcomposition（作文）は135文字以上165文字以内を厳守すること。
    3. 文章の構成は「意見＋根拠＋対比＋結論」の形にすること。`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    return { success: true, data: JSON.parse(text) };
  } catch (error: any) {
    console.error("LOGIC_LESSON_FAILURE:", error);
    
    let errorMessage = "修行の準備がうまくできなかったよ。もう一度試してみてね。";
    if (error.status === 503 || error.message?.includes("503")) {
      errorMessage = "今Gemini先生が非常に混み合っているみたい。30秒ほど待ってからもう一度挑戦してね！";
    }
    
    return { success: false, error: errorMessage };
  }
}
