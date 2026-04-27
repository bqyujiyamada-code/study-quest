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

  // モード別デザイン設定
  const themes = {
    causality: { color: "#6c5ce7", dark: "#4834d4", bg: "#f8f7ff", icon: "🔮", job: "魔法使い", sub: "因果関係" },
    contrast: { color: "#ff7675", dark: "#d63031", bg: "#fffafa", icon: "⚔️", job: "勇者", sub: "対比" },
    "pros-cons": { color: "#f1c40f", dark: "#e67e22", bg: "#fffdf0", icon: "🥋", job: "格闘家", sub: "賛成・反対" }
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

      {/* ヘッダー */}
      <header style={headerStyle}>
        <div style={{ ...badgeStyle, backgroundColor: current.dark }}>{current.job.toUpperCase()} LEVEL</div>
        <h1 style={titleStyle}>論理のちから<span className="no-break" style={{ color: current.dark }}>クエスト</span></h1>
        <p style={subtitleStyle}>〜 {current.sub}をマスターせよ！ 〜</p>
      </header>

      {/* シーン1: 選択 */}
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

      {/* シーン2: 入力 */}
      {scene === "INPUT" && (
        <div className="quest-card" style={inputCard}>
          <div style={{ fontSize: "4rem", marginBottom: "10px" }}>{current.icon}</div>
          <p style={{ fontWeight: "bold", marginBottom: "20px" }}>{current.job}のテーマを入力してね</p>
          <input 
            style={inputField}
            placeholder={mode === "pros-cons" ? "例：事前に情報を得るべきか" : "テーマを入力..."}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button onClick={() => setScene("SELECT")} style={cancelBtn}>やめる</button>
            <button onClick={handleStart} disabled={loading || !theme} style={{ ...startBtn, backgroundColor: current.color, boxShadow: `0 6px 0 ${current.dark}` }}>
              {loading ? "精神統一中..." : "修行開始！"}
            </button>
          </div>
        </div>
      )}

      {/* シーン3: 結果 */}
      {scene === "RESULT" && lesson && (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* 【共通】トップ：教え/ヒント */}
          <section className="quest-card" style={{ ...topCard, borderColor: current.color }}>
            <div style={cardHeader}><span style={{ fontSize: "1.5rem" }}>{current.icon}</span> <strong>{current.job}の極意</strong></div>
            <p style={mainText}>{mode === "pros-cons" ? theme : (lesson.opinion_example || lesson.opinion_a + " vs " + lesson.opinion_b)}</p>
            <div style={teachingBox}>{lesson.teaching_point || lesson.opinion_point}</div>
          </section>

          {/* 【格闘家モード専用】対立の視点（乱舞） */}
          {mode === "pros-cons" && (
            <div style={gridStyle}>
              {lesson.clash_points.map((p: any, i: number) => (
                <div key={i} className="quest-card" style={clashCard}>
                  <div style={clashTitle}>🥊 攻防の視点：{p.point_title}</div>
                  <div style={clashBox}><span style={tagPros}>賛成側</span> {p.pros_view}</div>
                  <div style={clashBox}><span style={tagCons}>反対側</span> {p.cons_view}</div>
                </div>
              ))}
            </div>
          )}

          {/* 【全モード共通】作文リザルト */}
          <div style={gridStyle}>
            {(lesson.essays || lesson.reasons).map((item: any, i: number) => (
              <article key={i} className="quest-card" style={{ ...essayCard, borderColor: current.dark }}>
                <div style={{ ...essayTag, backgroundColor: current.bg, color: current.dark }}>
                  {mode === "causality" ? `📜 呪文 ${i+1}` : `🔥 演武：${item.side || item.reason_title}`}
                </div>
                <p style={essayText}>{item.composition}</p>
                <div style={{ ...analysisArea, backgroundColor: current.bg }}>
                  <small style={{ fontWeight: "bold", color: current.dark }}>🥊 {current.job}の分析</small>
                  <p style={analysisBody}>{item.logic_check}</p>
                </div>
              </article>
            ))}
          </div>

          <button onClick={reset} style={backBtn}>↩️ 別のクエストに挑む</button>
        </div>
      )}
    </main>
  );
}

// === スタイル定義 ===
const containerStyle = { padding: "20px", maxWidth: "900px", margin: "0 auto", minHeight: "100vh", fontFamily: "sans-serif", boxSizing: "border-box" as const };
const headerStyle = { textAlign: "center" as const, marginBottom: "30px" };
const badgeStyle = { display: "inline-block", color: "#fff", padding: "4px 12px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", letterSpacing: "2px", marginBottom: "10px" };
const titleStyle = { fontSize: "calc(1.5rem + 3vw)", fontWeight: "900", color: "#2f3542", margin: "0", lineHeight: "1.2" };
const subtitleStyle = { fontSize: "0.9rem", color: "#747d8c", marginTop: "8px", fontWeight: "bold" };

// シーン別
const selectContainer = { textAlign: "center" as const, padding: "20px" };
const menuGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" };
const menuBtn = { padding: "30px", borderRadius: "24px", backgroundColor: "#fff", border: "4px solid", cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "10px" };
const iconCircle = { width: "70px", height: "70px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" };
const inputCard = { textAlign: "center" as const, padding: "40px 20px", backgroundColor: "#fff", borderRadius: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" };
const inputField = { padding: "15px", fontSize: "1.1rem", width: "90%", maxWidth: "400px", borderRadius: "12px", border: "2px solid #ddd", marginBottom: "20px", textAlign: "center" as const };
const startBtn = { padding: "15px 40px", fontSize: "1.1rem", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold" };
const cancelBtn = { background: "none", border: "none", color: "#999", textDecoration: "underline", cursor: "pointer" };

// リザルト
const topCard = { padding: "25px", borderRadius: "24px", backgroundColor: "#fff", border: "3px solid", marginBottom: "10px" };
const cardHeader = { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" };
const mainText = { fontSize: "1.4rem", fontWeight: "900", margin: "10px 0", lineHeight: "1.4" };
const teachingBox = { fontSize: "0.85rem", color: "#666", background: "#f5f5f5", padding: "12px", borderRadius: "12px" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" };

// 格闘家専用
const clashCard = { padding: "20px", backgroundColor: "#fff", borderRadius: "20px", border: "2px solid #2f3542", boxShadow: "5px 5px 0 #2f3542" };
const clashTitle = { fontWeight: "bold", fontSize: "0.9rem", marginBottom: "12px", color: "#e67e22" };
const clashBox = { fontSize: "0.85rem", marginBottom: "8px", lineHeight: "1.5" };
const tagPros = { backgroundColor: "#f1c40f", color: "#000", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", marginRight: "5px" };
const tagCons = { backgroundColor: "#2f3542", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", marginRight: "5px" };

// 作文
const essayCard = { padding: "20px", borderRadius: "24px", backgroundColor: "#fff", border: "3px solid", display: "flex", flexDirection: "column" as const };
const essayTag = { fontSize: "0.8rem", fontWeight: "bold", padding: "4px 12px", borderRadius: "8px", alignSelf: "flex-start" as const, marginBottom: "15px" };
const essayText = { fontSize: "1.1rem", lineHeight: "1.7", fontWeight: "600", flexGrow: 1, margin: 0 };
const analysisArea = { marginTop: "15px", padding: "15px", borderRadius: "15px" };
const analysisBody = { fontSize: "0.85rem", margin: "5px 0 0 0", lineHeight: "1.5" };
const backBtn = { alignSelf: "center", background: "none", border: "none", color: "#999", textDecoration: "underline", cursor: "pointer", padding: "20px" };
