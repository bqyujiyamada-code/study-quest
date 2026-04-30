"use client";

import { useState } from "react";
import { generateLogicLesson, TrainingMode } from "../actions/logic-training";

const globalStyles = `
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .quest-card { animation: fadeIn 0.5s ease-out forwards; }
  .no-break { display: inline-block; white-space: nowrap; }
`;

export default function LogicTrainingPage() {
  const [scene, setScene] = useState<"SELECT" | "INPUT" | "RESULT">("SELECT");
  const [mode, setMode] = useState<TrainingMode>("causality");
  const [theme, setTheme] = useState("");
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const themes = {
    causality: { 
      color: "#6c5ce7", dark: "#4834d4", bg: "#f8f7ff", icon: "🔮", job: "魔法使い", 
      guide: "単語を入力してね。例：『宿題』『方言』『読書』など" 
    },
    contrast: { 
      color: "#ff7675", dark: "#d63031", bg: "#fffafa", icon: "⚔️", job: "勇者", 
      guide: "くらべるテーマを入力してね。例：『試合前の目標』『おやつ選び』など" 
    },
    "pros-cons": { 
      color: "#f1c40f", dark: "#e67e22", bg: "#fffdf0", icon: "🥋", job: "格闘家", 
      guide: "『〜は…したほうがいい』という文章を入れてね。例：『事前情報を得るべきか』" 
    }
  };

  const current = themes[mode];

  const handleStart = async () => {
    setLoading(true);
    const result = await generateLogicLesson(theme, mode);
    if (result.success) {
      setLesson(result.data);
      setScene("RESULT");
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  const reset = () => { setLesson(null); setTheme(""); setScene("SELECT"); };

  return (
    <main style={{ ...containerStyle, backgroundColor: current.bg }}>
      <style>{globalStyles}</style>

      <header style={headerStyle}>
        <div style={{ ...badgeStyle, backgroundColor: current.dark }}>{current.job.toUpperCase()} QUEST</div>
        <h1 style={titleStyle}>論理のちから<span className="no-break" style={{ color: current.dark }}>クエスト</span></h1>
      </header>

      {scene === "SELECT" && (
        <div className="quest-card" style={selectContainer}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "30px" }}>挑戦する修行を選ぼう！</h2>
          <div style={menuGrid}>
            <button onClick={() => { setMode("causality"); setScene("INPUT"); }} style={{ ...menuBtn, borderColor: themes.causality.color }}>
              <div style={{ ...iconCircle, backgroundColor: "#f3f0ff" }}>🔮</div>
              <strong style={{ color: themes.causality.dark }}>魔法使いの修行</strong>
              <small>「なぜなら」で理由をつなぐ</small>
            </button>
            <button onClick={() => { setMode("contrast"); setScene("INPUT"); }} style={{ ...menuBtn, borderColor: themes.contrast.color }}>
              <div style={{ ...iconCircle, backgroundColor: "#fff5f5" }}>⚔️</div>
              <strong style={{ color: themes.contrast.dark }}>勇者の修行</strong>
              <small>「一方で」で違いをくらべる</small>
            </button>
            <button onClick={() => { setMode("pros-cons"); setScene("INPUT"); }} style={{ ...menuBtn, borderColor: themes["pros-cons"].color }}>
              <div style={{ ...iconCircle, backgroundColor: "#fffdeb" }}>🥋</div>
              <strong style={{ color: themes["pros-cons"].dark }}>格闘家の修行</strong>
              <small>賛成・反対で意見をぶつける</small>
            </button>
          </div>
        </div>
      )}

      {scene === "INPUT" && (
        <div className="quest-card" style={inputCard}>
          <div style={{ fontSize: "4rem", marginBottom: "10px" }}>{current.icon}</div>
          <p style={{ fontWeight: "bold", marginBottom: "10px" }}>テーマを入力してね</p>
          <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "20px" }}>💡 {current.guide}</p>
          <input 
            style={inputField}
            placeholder="ここに書くよ..."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
          <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
            <button onClick={() => setScene("SELECT")} style={cancelBtn}>← やめる</button>
            <button onClick={handleStart} disabled={loading || !theme} style={{ ...startBtn, backgroundColor: current.color, boxShadow: `0 6px 0 ${current.dark}` }}>
              {loading ? "精神統一中..." : "修行開始！"}
            </button>
          </div>
        </div>
      )}

      {scene === "RESULT" && lesson && (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          <section className="quest-card" style={{ ...topCard, borderColor: current.color }}>
            <div style={cardHeader}><span style={{ fontSize: "1.5rem" }}>{current.icon}</span> <strong>{current.job}の極意</strong></div>
            <p style={mainText}>{mode === "pros-cons" ? theme : (lesson.opinion_example || (lesson.opinion_a + " vs " + lesson.opinion_b))}</p>
            <div style={teachingBox}>{lesson.teaching_point || lesson.opinion_point}</div>
          </section>

          {mode === "pros-cons" && (
            <div style={gridStyle}>
              {lesson.clash_points.map((p: any, i: number) => (
                <div key={i} className="quest-card" style={clashCard}>
                  <div style={clashTitle}>🥊 攻防の視点：{p.point_title}</div>
                  <div style={clashBox}><span style={tagPros}>賛成</span> {p.pros_view}</div>
                  <div style={clashBox}><span style={tagCons}>反対</span> {p.cons_view}</div>
                </div>
              ))}
            </div>
          )}

          <div style={gridStyle}>
            {(lesson.essays || lesson.reasons).map((item: any, i: number) => (
              <article key={i} className="quest-card" style={{ ...essayCard, borderColor: current.dark }}>
                <div style={{ ...essayTag, backgroundColor: current.bg, color: current.dark }}>
                  {mode === "causality" ? `📜 呪文 ${i+1}` : `🔥 演武：${item.side || item.reason_title}`}
                </div>
                <p style={essayText}>{item.composition}</p>
                <div style={{ ...analysisArea, backgroundColor: current.bg }}>
                  <small style={{ fontWeight: "bold", color: current.dark }}>🥋 {current.job}の分析</small>
                  <p style={analysisBody}>{item.logic_check}</p>
                </div>
              </article>
            ))}
          </div>
          <button onClick={reset} style={backBtn}>↩️ 別の修行に挑む</button>
        </div>
      )}
    </main>
  );
}

// スタイル定義
const containerStyle = { padding: "20px", maxWidth: "900px", margin: "0 auto", minHeight: "100vh", fontFamily: "sans-serif", boxSizing: "border-box" as const };
const headerStyle = { textAlign: "center" as const, marginBottom: "30px" };
const badgeStyle = { display: "inline-block", color: "#fff", padding: "4px 12px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", letterSpacing: "2px", marginBottom: "10px" };
const titleStyle = { fontSize: "calc(1.4rem + 3vw)", fontWeight: "900", color: "#2f3542", margin: "0", lineHeight: "1.2" };
const selectContainer = { textAlign: "center" as const };
const menuGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" };
const menuBtn = { padding: "30px", borderRadius: "24px", backgroundColor: "#fff", border: "4px solid", cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "10px" };
const iconCircle = { width: "70px", height: "70px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" };
const inputCard = { textAlign: "center" as const, padding: "40px 20px", backgroundColor: "#fff", borderRadius: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" };
const inputField = { padding: "15px", fontSize: "1.1rem", width: "90%", maxWidth: "400px", borderRadius: "12px", border: "2px solid #ddd", marginBottom: "10px", textAlign: "center" as const };
const startBtn = { padding: "15px 40px", fontSize: "1.1rem", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold" };
const cancelBtn = { background: "none", border: "none", color: "#999", textDecoration: "underline", cursor: "pointer" };
const topCard = { padding: "25px", borderRadius: "24px", backgroundColor: "#fff", border: "3px solid" };
const cardHeader = { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" };
const mainText = { fontSize: "1.4rem", fontWeight: "900", margin: "10px 0" };
const teachingBox = { fontSize: "0.85rem", color: "#666", background: "#f5f5f5", padding: "12px", borderRadius: "12px" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" };
const clashCard = { padding: "20px", backgroundColor: "#fff", borderRadius: "20px", border: "2px solid #2f3542" };
const clashTitle = { fontWeight: "bold", fontSize: "0.9rem", marginBottom: "12px", color: "#e67e22" };
const clashBox = { fontSize: "0.85rem", marginBottom: "8px" };
const tagPros = { backgroundColor: "#f1c40f", color: "#000", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", marginRight: "5px" };
const tagCons = { backgroundColor: "#2f3542", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", marginRight: "5px" };
const essayCard = { padding: "20px", borderRadius: "24px", backgroundColor: "#fff", border: "3px solid", display: "flex", flexDirection: "column" as const };
const essayTag = { fontSize: "0.8rem", fontWeight: "bold", padding: "4px 12px", borderRadius: "8px", alignSelf: "flex-start" as const, marginBottom: "15px" };
const essayText = { fontSize: "1.1rem", lineHeight: "1.7", fontWeight: "600", flexGrow: 1 };
const analysisArea = { marginTop: "15px", padding: "15px", borderRadius: "15px" };
const analysisBody = { fontSize: "0.85rem", margin: "5px 0 0 0", lineHeight: "1.5" };
const backBtn = { alignSelf: "center", background: "none", border: "none", color: "#999", textDecoration: "underline", cursor: "pointer", padding: "20px" };
