"use client";

import { useState } from "react";
import { generateKnowledgeCard, SubjectType } from "@/app/actions/knowledge-generator";
import { saveKnowledgeCard } from "@/app/actions/knowledge";

export default function KnowledgeEntryPage() {
  const [userId] = useState("user_01");
  const [subject, setSubject] = useState<SubjectType>("math");
  const [title, setTitle] = useState("");
  const [example, setExample] = useState("");
  const [answerExample, setAnswerExample] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !example || !answerExample) {
      alert("タイトル、例題、回答例は必須だよ！");
      return;
    }

    setIsLoading(true);
    setStatusMessage("AI先生が思考プロセスを解剖中...");

    try {
      const aiResult = await generateKnowledgeCard({
        subject,
        title,
        example,
        answerExample,
      });

      if (!aiResult.success || !aiResult.content) {
        throw new Error(aiResult.error || "AI生成に失敗しました");
      }

      setStatusMessage("データをまとめて転送中...");

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("subject", subject);
      formData.append("title", aiResult.title || title);
      formData.append("intro", aiResult.intro || "");
      formData.append("content", JSON.stringify(aiResult.content));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const saveResult = await saveKnowledgeCard(formData);

      if (saveResult.success) {
        setStatusMessage("登録完了！新しいナレッジカードが錬成されたよ！");
        setTitle("");
        setExample("");
        setAnswerExample("");
        setImageFile(null);
        (e.target as HTMLFormElement).reset();
      } else {
        throw new Error(saveResult.error);
      }
    } catch (error: any) {
      console.error(error);
      setStatusMessage(`エラーが発生しちゃった：${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>ナレッジカード錬成所 (エントリー)</h1>

      <form onSubmit={handleSubmit}>
        {/* 教科選択 */}
        <div>
          <label>どの教科のナレッジ？</label>
          <div>
            {(["math", "japanese", "science", "society"] as const).map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubject(sub)}
                style={{
                  fontWeight: subject === sub ? "bold" : "normal",
                  marginRight: "8px"
                }}
              >
                {sub === "math" && "算数"}
                {sub === "japanese" && "国語"}
                {sub === "science" && "理科"}
                {sub === "society" && "社会"}
              </button>
            ))}
          </div>
        </div>

        {/* タイトル入力 */}
        <div>
          <label>例題のタイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 円すいのくりぬき回転体"
          />
        </div>

        {/* 画像アップロード欄 */}
        <div>
          <label>問題の図形・画像 (任意)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {/* 例題入力 */}
        <div>
          <label>問題文（例題）</label>
          <textarea
            rows={4}
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="テキストの問題文を入力してね"
          />
        </div>

        {/* 回答例入力 */}
        <div>
          <label>テキストの回答例（式やルート）</label>
          <textarea
            rows={4}
            value={answerExample}
            onChange={(e) => setAnswerExample(e.target.value)}
            placeholder="テキストの解説の式や、正解の記述ルートを入力してね"
          />
        </div>

        {/* ステータス表示 */}
        {statusMessage && (
          <div>
            <p>{statusMessage}</p>
          </div>
        )}

        {/* 送信ボタン */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "錬成中..." : "ナレッジカードを生成する"}
        </button>
      </form>
    </div>
  );
}
