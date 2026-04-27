"use client";

import { useState } from "react";
import { generateLogicLesson } from "../actions/logic-training";

const globalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .quest-card {
    animation: fadeIn 0.5s ease-out forwards;
  }
`;

export default function LogicTrainingPage() {
  const [theme, setTheme] = useState("");
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    const result = await generateLogicLesson(theme);
    if (result.success) {
      setLesson(result.data);
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  return (
    <main style={containerStyle}>
      <style>{globalStyles}</style>

      <header style={headerStyle}>
        <div style={badgeTopStyle}>LEVEL UP STUDY</div>
        <h1 style={titleStyle}>
          論理のちから<span style={noBreakSpan}>クエスト</span>
        </h1>
        <p style={subtitleStyle}>〜 因果関係の魔法をマスターせよ！ 〜</p>
      </header>

      {!lesson ? (
        <div style={inputBoxStyle}>
          <div style={mascotStyle}>💎</div>
          <p style={inputLabelStyle}>冒険の「テーマ」を入力してね</p>
          <input 
            style={inputStyle}
            placeholder="例：方言、宿題、給食"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
          <button 
            onClick={handleStart}
            disabled={loading || !theme}
            style={{
              ...buttonStyle,
              ...(loading || !theme ? buttonDisabledStyle : {})
            }}
          >
            {loading ? "MPを消費して作成中..." : "冒険をはじめる！"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <section className="quest-card" style={opinionCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={cardIconStyle}>👑</span>
              <h2 style={cardTitleStyle}>キミの「意見」をきめよう！</h2>
            </div>
            <div style={opinionContentStyle}>
              <p style={opinionExampleStyle}>{lesson.opinion_example}</p>
              <div style={pointBoxStyle}>
                <span style={{marginRight: '5px'}}>📜</span> {lesson.opinion_point}
              </div>
            </div>
          </section>

          <div style={dividerContainer}>
            <div style={dividerLine}></div>
            <span style={dividerText}>GET REWARDS</span>
            <div style={dividerLine}></div>
          </div>

          <div style={gridStyle}>
            {lesson.reasons.map((item: any, i: number) => (
              <article 
                key={i} 
                className="quest-card"
                style={{
                  ...compositionCardBase,
                  ...getCardTheme(i),
                  animationDelay: `${i * 0.15}s`
                }}
              >
                {/* 理由・根拠のタイトル部分 */}
                <div style={reasonTitleTagStyle}>
                  {getItemIcon(i)} 根拠：{item.reason_title}
                </div>
                
                <div style={textBubbleStyle}>
                  <p style={compTextStyle}>{item.composition}</p>
                </div>
                
                <div style={statusRowStyle}>
                  <div style={charCounterStyle}>
                    LEN: <span style={{fontSize: '1.2rem'}}>{item.composition.length}</span>/105
                  </div>
                  <div style={logicBadgeStyle}>LOGIC OK!</div>
                </div>
                
                <div style={analysisBoxStyle}>
                  <div style={analysisTitle}>📝 じゅもんの解説</div>
                  <p style={analysisBody}>{item.logic_check}</p>
                </div>
              </article>
            ))}
          </div>

          <button 
            onClick={() => { setLesson(null); setTheme(""); }}
            style={backButtonStyle}
          >
            ↩️ 別のクエストに挑む
          </button>
        </div>
      )}
    </main>
  );
}

// === スタイル定義修正版 ===

const containerStyle = { 
  padding: "20px", 
  maxWidth: "900px", 
  margin: "0 auto", 
  fontFamily: "'Inter', 'Hiragino Kaku Gothic ProN', sans-serif",
  backgroundColor: "#f0f2f5",
  minHeight: "100vh",
  boxSizing: "border-box" as const
};

const headerStyle = { textAlign: "center" as const, marginBottom: "30px" };
const badgeTopStyle = { 
  display: "inline-block", 
  backgroundColor: "#2f3542", 
  color: "#fff", 
  padding: "4px 12px", 
  borderRadius: "4px", 
  fontSize: "0.7rem", 
  fontWeight: "bold",
  letterSpacing: "2px",
  marginBottom: "10px"
};

const titleStyle = { 
  fontSize: "calc(1.5rem + 3vw)", 
  fontWeight: "900", 
  color: "#2f3542", 
  margin: "0", 
  lineHeight: "1.2",
  display: "block"
};

// 「クエスト」が絶対に切れないようにする魔法
const noBreakSpan = {
  display: "inline-block",
  whiteSpace: "nowrap" as const,
  color: "#ff4757"
};

const subtitleStyle = { fontSize: "0.9rem", color: "#747d8c", marginTop: "8px", fontWeight: "bold" };

// 入力画面
const inputBoxStyle = { 
  textAlign: "center" as const, 
  padding: "40px 20px", 
  borderRadius: "24px", 
  backgroundColor: "#fff", 
  boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
};
const mascotStyle = { fontSize: "3rem", marginBottom: "15px" };
const inputLabelStyle = { fontWeight: "bold", fontSize: "1.1rem", marginBottom: "20px", color: "#2f3542" };
const inputStyle = { 
  padding: "15px", 
  fontSize: "1.1rem", 
  width: "90%", 
  maxWidth: "350px",
  borderRadius: "12px", 
  border: "2px solid #ced4da", 
  marginBottom: "25px", 
  textAlign: "center" as const
};
const buttonStyle = { 
  padding: "16px 40px", 
  fontSize: "1.1rem", 
  backgroundColor: "#70a1ff", 
  color: "#fff", 
  border: "none", 
  borderRadius: "12px", 
  cursor: "pointer", 
  fontWeight: "bold", 
  boxShadow: "0 6px 0 #5352ed"
};
const buttonDisabledStyle = { backgroundColor: "#dfe4ea", boxShadow: "0 6px 0 #a4b0be", cursor: "not-allowed" };

// カード関連
const cardHeaderStyle = { display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" };
const cardIconStyle = { fontSize: "1.4rem" };
const cardTitleStyle = { fontSize: "1rem", margin: "0", fontWeight: "bold", color: "#2f3542" };

const opinionCardStyle = { 
  background: "linear-gradient(135deg, #fff9e6 0%, #fff2cc 100%)",
  padding: "20px", 
  borderRadius: "20px", 
  border: "2px solid #eccc68",
  boxShadow: "0 4px 15px rgba(236, 204, 104, 0.2)"
};
const opinionContentStyle = { padding: "0 5px" };
const opinionExampleStyle = { fontSize: "1.3rem", fontWeight: "900", marginBottom: "12px", lineHeight: "1.4" };
const pointBoxStyle = { fontSize: "0.85rem", color: "#57606f", background: "rgba(255,255,255,0.6)", padding: "10px", borderRadius: "10px" };

const dividerContainer = { display: "flex", alignItems: "center", gap: "15px", margin: "30px 0" };
const dividerLine = { flex: 1, height: "2px", backgroundColor: "#dfe4ea" };
const dividerText = { fontSize: "0.7rem", fontWeight: "bold", color: "#a4b0be", letterSpacing: "2px" };

// 作文カード
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "25px" };
const compositionCardBase = { 
  padding: "20px", 
  borderRadius: "24px", 
  borderWidth: "3px",
  borderStyle: "solid",
  backgroundColor: "#fff",
  display: "flex",
  flexDirection: "column" as const,
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)"
};

// 【追加】理由・根拠のタイトルタグ
const reasonTitleTagStyle = {
  fontSize: "0.9rem",
  fontWeight: "900",
  marginBottom: "15px",
  padding: "6px 12px",
  borderRadius: "8px",
  backgroundColor: "rgba(255,255,255,0.8)",
  alignSelf: "flex-start" as const,
  boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
};

const textBubbleStyle = { background: "#fff", padding: "18px", borderRadius: "18px", border: "1px solid rgba(0,0,0,0.05)", marginBottom: "15px", flexGrow: 1 };
const compTextStyle = { fontSize: "1.1rem", lineHeight: "1.7", fontWeight: "600", margin: 0 };
const statusRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: "15px" };
const charCounterStyle = { fontSize: "0.7rem", color: "#747d8c", fontWeight: "bold" };
const logicBadgeStyle = { backgroundColor: "#2ed573", color: "#fff", padding: "3px 10px", borderRadius: "6px", fontSize: "0.65rem", fontWeight: "bold" };
const analysisBoxStyle = { background: "rgba(255,255,255,0.5)", padding: "15px", borderRadius: "15px" };
const analysisTitle = { fontSize: "0.8rem", fontWeight: "bold", marginBottom: "8px", display: "block" };
const analysisBody = { fontSize: "0.85rem", margin: 0, lineHeight: "1.6", color: "#2f3542" };

const backButtonStyle = { 
  alignSelf: "center", 
  background: "none", 
  border: "none", 
  color: "#747d8c", 
  cursor: "pointer", 
  textDecoration: "underline", 
  marginTop: "30px", 
  fontSize: "0.9rem",
  fontWeight: "bold",
  padding: "20px"
};

const getCardTheme = (i: number) => {
  const themes = [
    { borderColor: "#70a1ff", backgroundColor: "#f1f6ff", color: "#1e90ff" },
    { borderColor: "#7bed9f", backgroundColor: "#f2fff6", color: "#2ed573" },
    { borderColor: "#a29bfe", backgroundColor: "#f8f7ff", color: "#6c5ce7" },
  ];
  return themes[i % 3];
};

const getItemIcon = (i: number) => ["⚔️", "🛡️", "🏹"][i % 3];
