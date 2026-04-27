"use client";

import { useState } from "react";
import { generateLogicLesson, TrainingMode } from "../actions/logic-training";

// アニメーションと共通スタイル
const globalStyles = `
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .quest-card { animation: fadeIn 0.5s ease-out forwards; }
  .vs-badge { 
    background: #2f3542; color: #fff; padding: 5px 15px; border-radius: 50px; 
    font-weight: 900; font-style: italic; font-size: 1.2rem; margin: 0 10px;
  }
`;

export default function LogicTrainingPage() {
  const [scene, setScene] = useState<"SELECT" | "INPUT" | "RESULT">("SELECT");
  const [mode, setMode] = useState<TrainingMode>("causality");
  const [theme, setTheme] = useState("");
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // モードごとのスタイル設定
  const isMagic = mode === "causality";
  const themeColor = isMagic ? "#a29bfe" : "#ff7675"; // 紫 vs 赤
  const accentColor = isMagic ? "#6c5ce7" : "#d63031";
  const bgGradient = isMagic 
    ? "linear-gradient(135deg, #f8f7ff 0%, #efedff 100%)" 
    : "linear-gradient(135deg, #fffafa 0%, #ffecec 100%)";

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

  const resetQuest = () => {
    setLesson(null);
    setTheme("");
    setScene("SELECT");
  };

  return (
    <main style={{ ...containerBase, background: bgGradient }}>
      <style>{globalStyles}</style>

      {/* --- ヘッダー --- */}
      <header style={headerStyle}>
        <div style={{ ...badgeTopStyle, backgroundColor: accentColor }}>
          {isMagic ? "WISE WIZARD LEVEL" : "BRAVE HERO LEVEL"}
        </div>
        <h1 style={titleStyle}>
          論理のちから<span style={{ ...noBreakSpan, color: accentColor }}>クエスト</span>
        </h1>
        <p style={subtitleStyle}>
          {isMagic ? "〜 因果関係の魔法をマスターせよ！ 〜" : "〜 二つの意見を戦わせて選べ！ 〜"}
        </p>
      </header>

      {/* --- シーン1: クエスト選択 --- */}
      {scene === "SELECT" && (
        <div style={selectSceneStyle}>
          <h2 style={menuTitleStyle}>挑戦する修行を選んでね！</h2>
          <div style={menuGridStyle}>
            <button onClick={() => { setMode("causality"); setScene("INPUT"); }} style={menuButtonStyle}>
              <div style={iconCircle}>🔮</div>
              <p style={menuName}>魔法使いの修行</p>
              <span style={menuDesc}>「なぜなら」の魔法で<br/>理由をしっかりつなげる！</span>
            </button>
            <button onClick={() => { setMode("contrast"); setScene("INPUT"); }} style={{ ...menuButtonStyle, borderColor: "#ff7675" }}>
              <div style={{ ...iconCircle, backgroundColor: "#ffecec" }}>⚔️</div>
              <p style={{ ...menuName, color: "#d63031" }}>勇者の修行</p>
              <span style={menuDesc}>「一方で」の剣で<br/>二つの意見をくらべる！</span>
            </button>
          </div>
        </div>
      )}

      {/* --- シーン2: テーマ入力 --- */}
      {scene === "INPUT" && (
        <div className="quest-card" style={inputBoxStyle}>
          <div style={mascotStyle}>{isMagic ? "🧙‍♀️" : "🛡️"}</div>
          <p style={inputLabelStyle}>
            {isMagic ? "魔法をかけるテーマは何にする？" : "戦わせるテーマを入力してね！"}
          </p>
          <input 
            style={inputStyle}
            placeholder={isMagic ? "例：宿題、方言" : "例：試合の目標"}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button onClick={() => setScene("SELECT")} style={backSmallStyle}>もどる</button>
            <button onClick={handleStart} disabled={loading || !theme} style={{ ...buttonStyle, backgroundColor: themeColor, boxShadow: `0 6px 0 ${accentColor}` }}>
              {loading ? "MP消費中..." : "修行開始！"}
            </button>
          </div>
        </div>
      )}

      {/* --- シーン3: 結果表示 --- */}
      {scene === "RESULT" && lesson && (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* 因果関係モード（魔法使い）の表示 */}
          {mode === "causality" && (
            <>
              <section className="quest-card" style={opinionCardStyle}>
                <div style={cardHeaderStyle}><span>🔮</span> <strong>魔法の意見：</strong></div>
                <p style={mainOpinionText}>{lesson.opinion_example}</p>
                <div style={hintBoxStyle}>✨ 魔法のコツ：{lesson.opinion_point}</div>
              </section>
              <div style={gridStyle}>
                {lesson.reasons.map((item: any, i: number) => (
                  <article key={i} className="quest-card" style={{ ...cardBase, borderColor: accentColor }}>
                    <div style={reasonTag}>📜 呪文その{i+1}: {item.reason_title}</div>
                    <p style={compText}>{item.composition}</p>
                    <div style={analysisArea}>
                      <small style={{ color: accentColor, fontWeight: "bold" }}>📖 じゅもんの解説</small>
                      <p style={analysisText}>{item.logic_check}</p>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {/* 対比モード（勇者）の表示 */}
          {mode === "contrast" && (
            <>
              <section className="quest-card" style={vsCardStyle}>
                <div style={vsContainer}>
                  <div style={sideA}>
                    <small style={sideLabel}>意見 A</small>
                    <p style={sideText}>{lesson.opinion_a}</p>
                  </div>
                  <div className="vs-badge">VS</div>
                  <div style={sideB}>
                    <small style={sideLabel}>意見 B</small>
                    <p style={sideText}>{lesson.opinion_b}</p>
                  </div>
                </div>
                <div style={teachingBox}>🛡️ 勇者の教え：{lesson.teaching_point}</div>
              </section>

              <div style={gridStyle}>
                {lesson.essays.map((item: any, i: number) => (
                  <article key={i} className="quest-card" style={{ ...cardBase, borderColor: accentColor }}>
                    <div style={{ ...reasonTag, backgroundColor: "#fff5f5", color: accentColor }}>
                      ⚔️ 戦術 {i === 0 ? "A" : "B"}: {item.side}
                    </div>
                    <p style={compText}>{item.composition}</p>
                    <div style={{ ...analysisArea, backgroundColor: "#fffafa" }}>
                      <small style={{ color: accentColor, fontWeight: "bold" }}>🤺 戦じゅつの分析</small>
                      <p style={analysisText}>{item.logic_check}</p>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <button onClick={resetQuest} style={resetButtonStyle}>↩️ 別のクエストに挑む</button>
        </div>
      )}
    </main>
  );
}

// === スタイル定義 ===

const containerBase = { padding: "20px", maxWidth: "900px", margin: "0 auto", minHeight: "100vh", fontFamily: "sans-serif" };
const headerStyle = { textAlign: "center" as const, marginBottom: "30px" };
const badgeTopStyle = { display: "inline-block", color: "#fff", padding: "4px 12px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", letterSpacing: "2px", marginBottom: "10px" };
const titleStyle = { fontSize: "calc(1.5rem + 3vw)", fontWeight: "900", color: "#2f3542", margin: "0", lineHeight: "1.2" };
const noBreakSpan = { display: "inline-block", whiteSpace: "nowrap" as const };
const subtitleStyle = { fontSize: "0.9rem", color: "#747d8c", marginTop: "8px", fontWeight: "bold" };

// クエスト選択
const selectSceneStyle = { textAlign: "center" as const, marginTop: "20px" };
const menuTitleStyle = { fontSize: "1.2rem", color: "#2f3542", marginBottom: "25px" };
const menuGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" };
const menuButtonStyle = { 
  padding: "30px 20px", borderRadius: "24px", border: "4px solid #a29bfe", backgroundColor: "#fff", cursor: "pointer",
  transition: "transform 0.2s", boxShadow: "0 10px 20px rgba(0,0,0,0.05)"
};
const iconCircle = { 
  width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#f8f7ff", margin: "0 auto 15px",
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem"
};
const menuName = { fontSize: "1.4rem", fontWeight: "900", margin: "0 0 10px 0", color: "#6c5ce7" };
const menuDesc = { fontSize: "0.85rem", color: "#747d8c", lineHeight: "1.5" };

// 入力画面
const inputBoxStyle = { textAlign: "center" as const, padding: "50px 20px", borderRadius: "24px", backgroundColor: "#fff", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" };
const mascotStyle = { fontSize: "4rem", marginBottom: "10px" };
const inputLabelStyle = { fontWeight: "bold", fontSize: "1.1rem", marginBottom: "20px" };
const inputStyle = { padding: "15px", fontSize: "1.1rem", width: "90%", maxWidth: "350px", borderRadius: "12px", border: "2px solid #ced4da", marginBottom: "25px", textAlign: "center" as const };
const buttonStyle = { padding: "16px 40px", fontSize: "1.1rem", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold" };
const backSmallStyle = { background: "none", border: "none", color: "#747d8c", cursor: "pointer", textDecoration: "underline" };

// 結果：因果関係
const opinionCardStyle = { backgroundColor: "#fffbe0", padding: "20px", borderRadius: "20px", border: "2px solid #f1c40f" };
const mainOpinionText = { fontSize: "1.3rem", fontWeight: "900", margin: "10px 0" };
const hintBoxStyle = { fontSize: "0.85rem", color: "#7f8c8d", background: "#fff", padding: "10px", borderRadius: "10px" };

// 結果：対比（VSカード）
const vsCardStyle = { 
  background: "linear-gradient(135deg, #fff 0%, #f9f9f9 100%)", padding: "20px", borderRadius: "24px", border: "3px solid #2f3542",
  boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
};
const vsContainer = { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "15px" };
const sideA = { flex: 1, textAlign: "center" as const };
const sideB = { flex: 1, textAlign: "center" as const };
const sideLabel = { fontSize: "0.7rem", fontWeight: "bold", color: "#ff7675", textTransform: "uppercase" as const };
const sideText = { fontSize: "1.1rem", fontWeight: "900", margin: "5px 0" };
const teachingBox = { fontSize: "0.85rem", color: "#2f3542", background: "#eee", padding: "12px", borderRadius: "12px", textAlign: "center" as const };

// 共通カード
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" };
const cardBase = { padding: "20px", borderRadius: "24px", backgroundColor: "#fff", border: "3px solid", display: "flex", flexDirection: "column" as const };
const reasonTag = { fontSize: "0.85rem", fontWeight: "bold", padding: "5px 12px", borderRadius: "8px", alignSelf: "flex-start" as const, marginBottom: "15px", backgroundColor: "#f8f7ff" };
const compText = { fontSize: "1.1rem", lineHeight: "1.7", fontWeight: "600", flexGrow: 1 };
const analysisArea = { marginTop: "15px", backgroundColor: "#f8f7ff", padding: "15px", borderRadius: "15px" };
const analysisText = { fontSize: "0.85rem", margin: "5px 0 0 0", color: "#2f3542", lineHeight: "1.5" };
const resetButtonStyle = { alignSelf: "center", background: "none", border: "none", color: "#747d8c", cursor: "pointer", textDecoration: "underline", padding: "20px" };
