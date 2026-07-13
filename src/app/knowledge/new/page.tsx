"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateKnowledgeCard } from "@/app/actions/knowledge-generator";
import { saveKnowledgeCard } from "@/app/actions/knowledge";
import { type SubjectType, KNOWLEDGE_SUBJECTS } from "@/lib/subjects";
import { KNOWLEDGE_USER_ID } from "@/lib/user";

export default function NewKnowledgePage() {
  const router = useRouter();
  const [userId] = useState(KNOWLEDGE_USER_ID);
  const [subject, setSubject] = useState<SubjectType>("math");
  const [title, setTitle] = useState("");
  const [example, setExample] = useState("");
  const [answerExample, setAnswerExample] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !example || !answerExample) {
      alert("すべての項目を入力してね！");
      return;
    }

    setIsLoading(true);
    setStatusMessage("AI先生が魔法のロジックカードを錬成中...");

    try {
      // 1. AIでナレッジの中身を生成（サーバー側で自動圧縮されて戻る）
      const aiResult = await generateKnowledgeCard({
        subject,
        title,
        example,
        answerExample,
      });

      if (!aiResult.success || !aiResult.compressedContent) {
        throw new Error(aiResult.error || "カードの自動生成に失敗しちゃいました。");
      }

      setStatusMessage("画像とデータを安全にサーバーへ転送中...");

      // 2. データをFormDataにまとめ、DynamoDB/S3保存用アクションを叩く
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("subject", subject);
      formData.append("title", title);
      formData.append("intro", aiResult.intro);
      formData.append("content", aiResult.compressedContent); // 圧縮データを文字列として渡す

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const saveResult = await saveKnowledgeCard(formData);

      if (saveResult.success) {
        setStatusMessage("錬成完了！神殿に移動します...");
        router.push("/knowledge");
      } else {
        throw new Error(saveResult.error || "データベースへの保存に失敗しました。");
      }
    } catch (error) {
      alert((error as Error).message || "エラーが発生しました。");
    } finally {
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#1e293b", fontSize: "1.6rem" }}>🧪 新しいナレッジの錬成</h1>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px", fontSize: "0.9rem" }}>教科</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value as SubjectType)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
            {KNOWLEDGE_SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px", fontSize: "0.9rem" }}>問題のタイトル（例：円すいのくりぬき回転体）</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：等差数列の応用・カベにぶつかるハネ返り" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px", fontSize: "0.9rem" }}>例題（問題文）</label>
          <textarea value={example} onChange={(e) => setExample(e.target.value)} placeholder="テキストの問題文をそのまま入力してね" style={{ width: "100%", height: "100px", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px", fontSize: "0.9rem" }}>テキストの回答例（答えの数値や略解）</label>
          <textarea value={answerExample} onChange={(e) => setAnswerExample(e.target.value)} placeholder="例：703.36cm²（途中式がないシンプルなものでOK）" style={{ width: "100%", height: "60px", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px", fontSize: "0.9rem" }}>参考画像（ある場合だけでOK）</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} style={{ fontSize: "0.85rem" }} />
        </div>

        <button type="submit" disabled={isLoading} style={{ width: "100%", padding: "14px", border: "none", borderRadius: "12px", backgroundColor: isLoading ? "#94a3b8" : "#2563eb", color: "#fff", fontWeight: "bold", fontSize: "1rem", cursor: isLoading ? "not-allowed" : "pointer", boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)" }}>
          {isLoading ? "錬成中..." : "🔮 魔法のナレッジを生成する"}
        </button>
      </form>

      {statusMessage && (
        <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", color: "#0369a1", fontSize: "0.85rem", textAlign: "center", fontWeight: "500" }}>
          ⏳ {statusMessage}
        </div>
      )}
    </div>
  );
}
