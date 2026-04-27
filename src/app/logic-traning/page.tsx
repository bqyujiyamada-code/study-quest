"use client";

import { useState } from "react";
// さきほど作成したアクションをインポート
import { generateLogicLesson } from "../actions/logic-training";

export default function LogicTrainingPage() {
  const [theme, setTheme] = useState("");
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const data = await generateLogicLesson(theme);
      setLesson(data);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  return (
    <main style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "30px" }}>
        🧠 論理のちからクエスト
      </h1>

      {!lesson ? (
        <div style={{ textAlign: "center", padding: "40px", border: "3px solid #333", borderRadius: "20px" }}>
          <p style={{ fontWeight: "bold", fontSize: "1.2rem" }}>今回のテーマを教えてね！</p>
          <input 
            style={{ padding: "12px", fontSize: "1.1rem", width: "70%", borderRadius: "8px", border: "2px solid #ccc", marginBottom: "20px" }}
            placeholder="例：方言、宿題、給食のメニュー"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
          <br />
          <button 
            onClick={handleStart}
            disabled={loading || !theme}
            style={{ padding: "15px 40px", fontSize: "1.2rem", backgroundColor: "#0070f3", color: "#fff", border: "none", borderRadius: "50px", cursor: "pointer", fontWeight: "bold" }}
          >
            {loading ? "考え中..." : "クエスト開始！"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          {/* 意見のヒント */}
          <section style={{ backgroundColor: "#fff9c4", padding: "25px", borderRadius: "15px", border: "2px solid #fbc02d" }}>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 10px 0" }}>💡 意見のつくりかた</h2>
            <p style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "10px" }}>{lesson.opinion_example}</p>
            <p style={{ fontSize: "0.9rem", color: "#666", lineHeight: "1.5" }}>✨ ポイント：{lesson.opinion_point}</p>
          </section>

          {/* 3つの作文 */}
          <div style={{ display: "grid", gap: "20px" }}>
            {lesson.reasons.map((item: any, i: number) => (
              <article key={i} style={{ border: "2px solid #000", padding: "20px", borderRadius: "15px", backgroundColor: "#fff" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#0070f3", marginBottom: "10px" }}>作文例 {i + 1}：{item.reason_title}</div>
                <p style={{ fontSize: "1.1rem", lineHeight: "1.7", marginBottom: "10px" }}>{item.composition}</p>
                <div style={{ textAlign: "right", fontSize: "0.8rem", color: "#888", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                  文字数：{item.composition.length}文字
                </div>
                <div style={{ marginTop: "15px", fontSize: "0.9rem", color: "#444", background: "#f9f9f9", padding: "15px", borderRadius: "8px" }}>
                  <strong>✅ 論理のチェック：</strong><br />
                  {item.logic_check}
                </div>
              </article>
            ))}
          </div>

          <button 
            onClick={() => { setLesson(null); setTheme(""); }}
            style={{ alignSelf: "center", background: "none", border: "none", color: "#0070f3", cursor: "pointer", textDecoration: "underline" }}
          >
            別のテーマでもういちど
          </button>
        </div>
      )}
    </main>
  );
}
