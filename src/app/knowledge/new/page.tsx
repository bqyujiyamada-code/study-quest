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
    /* ★全体をマックス600pxに制限し、中央寄せ＆左右にスマホ用の余白を確保 */
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px", boxSizing: "border-box" }}>
      
      <h1 style={{ textAlign: "center", marginBottom: "24px" }}>
        🔮 ナレッジカード錬成所
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* 教科選択 */}
        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>どの教科のナレッジ？</label>
          {/* スマホでもタップしやすいように flex-wrap と十分な余白を確保 */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {(["math", "japanese", "science", "society"] as const).map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubject(sub)}
                style={{
                  padding: "10px 16px",
                  fontSize: "0.9rem",
                  fontWeight: subject === sub ? "bold" : "normal",
                  cursor: "pointer",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: subject === sub ? "#e0e7ff" : "#fff",
                  flexGrow: 1, /* スマホ画面でボタンが横いっぱいに綺麗に広がるように */
                  minWidth: "70px",
                  textAlign: "center"
                }}
              >
                {sub === "math" && "📐 算数"}
                {sub === "japanese" && "📖 国語"}
                {sub === "science" && "🧪 理科"}
                {sub === "society" && "🌍 社会"}
              </button>
            ))}
          </div>
        </div>

        {/* タイトル入力 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontWeight: "bold" }}>例題のタイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 円すいのくりぬき回転体"
            style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #ccc" }}
          />
        </div>

        {/* 画像アップロード欄 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontWeight: "bold" }}>問題の図形・画像 (任意)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ width: "100%", padding: "8px 0", boxSizing: "border-box" }}
          />
        </div>

        {/* 例題入力 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontWeight: "bold" }}>問題文（例題）</label>
          <textarea
            rows={4}
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="テキストの問題文をそのまま入力してね"
            style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #ccc", fontSize: "0.9rem" }}
          />
        </div>

        {/* 回答例入力 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontWeight: "bold" }}>テキストの回答例（式やルート）</label>
          <textarea
            rows={4}
            value={answerExample}
            onChange={(e) => setAnswerExample(e.target.value)}
            placeholder="テキストに載っている解説の式や、正解の記述ルートを入力してね"
            style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #ccc", fontSize: "0.9rem" }}
          />
        </div>

        {/* ステータス表示 */}
        {statusMessage && (
          <div style={{ padding: "12px", backgroundColor: "#f0f4f8", borderRadius: "8px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#333", fontWeight: "medium" }}>{statusMessage}</p>
          </div>
        )}

        {/* 送信ボタン */}
        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            padding: "16px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            color: "#fff",
            backgroundColor: isLoading ? "#aaa" : "#4f46e5",
            border: "none",
            borderRadius: "8px",
            cursor: isLoading ? "not-allowed" : "pointer",
            marginTop: "8px"
          }}
        >
          {isLoading ? "🧙‍♂️ 錬成中..." : "✨ ナレッジカードを生成する"}
        </button>
      </form>
    </div>
  );
}
