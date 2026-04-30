"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type TrainingMode = "causality" | "contrast" | "pros-cons";

export async function generateLogicLesson(theme: string, mode: TrainingMode = "causality") {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  let prompt = "";

  if (mode === "causality") {
    prompt = `あなたは論理的思考の専門講師「魔法使い」です。「${theme}」というテーマについて、因果関係を重視したトレーニング資料を以下のJSON形式で回答してください。
    {
      "opinion_example": "私は、〜と考えている。",
      "opinion_point": "思考のポイント",
      "reasons": [
        { "reason_title": "理由の視点", "reason_point": "ヒント", "composition": "構成...", "logic_check": "解説" }
      ]
    }`;
  } else if (mode === "contrast") {
    prompt = `あなたは論理的思考の専門講師「勇者」です。「${theme}」というテーマについて、異なる2つの立場（AとB）から対比させて考えるトレーニング資料をJSON形式で作成してください。
    {
      "opinion_a": "立場Aの意見例",
      "opinion_b": "立場Bの意見例",
      "contrast_points": [
        { "point_title": "視点", "desc_a": "Aの場合：〜", "desc_b": "その一方でBは：〜" }
      ],
      "teaching_point": "解説",
      "essays": [
        { "side": "Aの立場", "composition": "135〜165文字", "logic_check": "解説" },
        { "side": "Bの立場", "composition": "135〜165文字", "logic_check": "解説" }
      ]
    }`;
  } else {
    prompt = `あなたは論理的思考の専門講師「格闘家」です。「${theme}」という意見に対して、賛成と反対の両方の立場から論理的に考えるトレーニング資料をJSON形式で作成してください。
    {
      "pros_opinion": "賛成の立場",
      "cons_opinion": "反対の立場",
      "clash_points": [
        { "point_title": "対立する視点", "pros_view": "賛成の場合：〜", "cons_view": "その一方で反対は：〜" }
      ],
      "teaching_point": "ポイント解説",
      "essays": [
        { "side": "賛成の立場", "composition": "135〜165文字", "logic_check": "解説" },
        { "side": "反対の立場", "composition": "135〜165文字", "logic_check": "解説" }
      ]
    }`;
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // 強力なJSON抽出ロジック
    text = text.replace(/```json|```/g, "");
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    return { success: true, data: JSON.parse(text) };
  } catch (error: any) {
    console.error("LOGIC_LESSON_FAILURE:", error);
    return { success: false, error: "通信エラーが発生したよ。もう一度修行してみよう！" };
  }
}
