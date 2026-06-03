"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type SubjectType = "math" | "japanese" | "science" | "society";

/**
 * 教科に応じた「ロジックの分岐点」の指示を取得
 */
const getLogicInstruction = (subject: SubjectType): string => {
  switch (subject) {
    case "math":
      return "今回の問題と『一見似ているけれど、決定的にルールや処理が違う別のパターン』を1つ引き合いに出し、構造的な違い（例：カベの傾き、条件の有無、隠れた重なりなど）から、なぜ今回はこの計算処理（引き算や掛け算など）になるのかを論理的に説明してください。";
    case "japanese":
      return "今回の設問と『一見似ているけれど、選んではいけないひっかけ選択肢（本文にない気持ちの推測、行き過ぎた言い換えなど）』を1つ引き合いに出し、なぜ今回はテキストの回答例にある記述や選択肢が正解になるのか、傍線部の前後にある『客観的な本文の根拠・キーワード』を使って説明してください。";
    case "science":
      return "今回の実験・現象と『一見似ているけれど、1箇所だけ条件が違う対照実験や別の自然現象のパターン』を引き合いに出し、なぜ今回はテキストの回答例のような結果・数値・グラフになるのか、物質の性質や変化のきまり（因果関係）から論理的に説明してください。";
    case "society":
      return "今回の出来事や仕組みと『一見似ているけれど、時代や地域、制度が異なる別のパターン』を引き合いに出し、なぜ今回はテキストの回答例のような歴史的背景や社会の動きになるのか、地理的条件や権力の移り変わりなどの原因から論理的に説明してください。";
    default:
      return "今回の問題と『一見似ているけれど、決定的にルールや処理が違う別のパターン』を引き合いに出し、なぜ今回はテキストの回答例にあるような処理を行うのか、構造的な違いから説明してください。";
  }
};

/**
 * 解説カード用のJSONデータを自動生成（フリガナ対応版）
 */
export async function generateKnowledgeCard(payload: {
  subject: SubjectType;
  title: string;
  example: string;
  answerExample: string;
}) {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const subjectNames: Record<SubjectType, string> = {
    math: "算数",
    japanese: "国語",
    science: "理科",
    society: "社会"
  };

  const subjectName = subjectNames[payload.subject];
  const logicInstruction = getLogicInstruction(payload.subject);

  const prompt = `# あなたの役割
あなたは、中学受験を控える小学6年生を指導する、経験豊富で非常に教え方が上手な【${subjectName}】のプロ講師です。
単に公式や解き方を教えるのではなく、「なぜそう考えるのか」「どうすれば初見の問題でその解法をひらめくのか」という【思考の順序（ロジック）】を言語化し、子どもがワクワクしながら納得できる解説を作成してください。

# ユーザーから与えられる情報
・【例題のタイトル】：${payload.title}
・【例題】：${payload.example}
・【テキストの回答例】：${payload.answerExample}

# 出力要件
指定された【JSONフォーマット】に完全に準拠して、解説データを生成してください。不要な挨拶やマークダウンのバッククォート（\`\`\`json）などは含めないか、パースできる形にしてください。

# 指定するJSONフォーマット
{
  "titleKana": "【例題のタイトル：${payload.title}】の読み仮名を、濁点を含めてすべて「ひらがな」だけでスペースを空けずに記述（例：えんすいのくりぬきかいてんたい）",
  "intro": "その問題のテーマや世界観に合わせて、子どもがワクワクして挑戦したくなるようなオリジナルの語りかけ文を1〜2段落で作成",
  "essence": "「${payload.title}とはなにか」を、身近な例えや小学生が直感的にイメージできる言葉で1〜2行の説明文として記述",
  "difference": "「${payload.title}（または似た概念や図形・言葉）」との違いを明確に記述",
  "forkInTheRoad": "【ここが分かれ道！】：${logicInstruction}",
  "weapon": "この単元で無双するための「最強の武器（核心となる考え方）」を子供に向けて1文で提示",
  "degreeOfAppearance": "【よく出る度】：★☆☆☆☆ 〜 ★★★★★ の5段階からテキストで1つ指定",
  "keyPoints": [
    "問題文の中に隠された、解法のヒントになるキーワードや図の特徴を2つ箇条書き形式で配列に格納（項目1）",
    "解法のヒントになるキーワードや図の特徴（項目2）"
  ],
  "logicalSteps": [
    "テキストの第1ステップに対する「なぜなら〜だから！」という子どもの頭の動きに沿った解説",
    "テキストの第2ステップに対する「ここに注目すると〜だから！」という解説"
  ],
  "formula": "この問題を解くためにベースとなった「公式や重要な言葉の式、比の関係式」をテキストで提示",
  "formulaDetail": "公式のそれぞれの要素が、今回の問題のどこに当たるのかを子供向けに優しく解説した文",
  "typicalPatternName": "この問題が属する典型パターンのキャッチーな名前（例：ちょうちょ型、ランプシェード型、オウム返し記述など）",
  "typicalPatternRule": "問題の数値や設定が変わっても、絶対に変わらない不変の「定数」や「ルール」の解説文",
  "reproducibilityTip": "次に似た問題に出会ったとき、問題用紙の余白に「まず何をメモすべきか」「どこに注目すべきか」など、次につながる実践的なアクションを、子供に語りかける口調で伝えた文"
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json|```/g, "");
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    const parsedData = JSON.parse(text);

    return { 
      success: true, 
      title: payload.title,
      intro: parsedData.intro,
      content: parsedData 
    };
  } catch (error: any) {
    console.error("KNOWLEDGE_GENERATION_FAILURE:", error);
    return { success: false, error: "AI先生がちょっと考え込んじゃったみたい。もう一度問題を投げてみてね！" };
  }
}
