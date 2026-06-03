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
    setStatusMessage("🧙‍♂️ AI先生が思考プロセス（ロジック）を解剖中...");

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

      setStatusMessage("📦 データを袋（FormData）に詰めてS3＆DynamoDBへ転送中...");

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("subject", subject);
      formData.append("title", aiResult.title);
      formData.append("intro", aiResult.intro || "");
      formData.append("content", JSON.stringify(aiResult.content));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const saveResult = await saveKnowledgeCard(formData);

      if (saveResult.success) {
        setStatusMessage("🎉 登録完了！新しいナレッジカードが錬成されたよ！");
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
      setStatusMessage(`❌ エラーが発生しちゃった：${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl border-4 border-indigo-100 my-10">
      <h1 className="text-2xl font-bold text-center text-indigo-700 mb-6 font-mono">
        🔮 ナレッジカード錬成所 (エントリー)
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">どの教科のナレッジ？</label>
          <div className="grid grid-cols-4 gap-2">
            {(["math", "japanese", "science", "society"] as const).map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubject(sub)}
                className={`py-2 px-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  subject === sub
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {sub === "math" && "📐 算数"}
                {sub === "japanese" && "📖 国語"}
                {sub === "science" && "🧪 理科"}
                {sub === "society" && "🌍 社会"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">例題のタイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 円すいのくりぬき回転体"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">問題の図形・画像 (任意)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">問題文（例題）</label>
          <textarea
            rows={4}
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="テキストの問題文をそのまま入力してね"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">テキストの回答例（式やルート）</label>
          <textarea
            rows={4}
            value={answerExample}
            onChange={(e) => setAnswerExample(e.target.value)}
            placeholder="テキストに載っている解説の式や、正解の記述ルートを入力してね"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm font-mono bg-gray-50"
          />
        </div>

        {statusMessage && (
          <div className="p-3 bg-indigo-50 text-indigo-800 text-sm rounded-xl font-medium text-center">
            {statusMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed animate-pulse"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl active:scale-[0.98]"
          }`}
        >
          {isLoading ? "🧙‍♂️ 錬成中..." : "✨ ナレッジカードを生成する"}
        </button>
      </form>
    </div>
  );
}
