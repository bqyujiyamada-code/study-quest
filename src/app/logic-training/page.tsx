"use client";

import { useState } from "react";
import { generateLogicLesson } from "../actions/logic-training";

// ローディング中にくるくる回るアニメーション用のCSS
const spinCstyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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
      {/* アニメーションCSSの注入 */}
      <style>{spinCstyle}</style>

      <header style={headerStyle}>
        <span style={headerIconStyle}>⚔️</span>
        <h1 style={titleStyle}>論理のちからクエスト</h1>
        <p style={subtitleStyle}>〜 なぜならマスターになろう 〜</p>
      </header>

      {!lesson ? (
        <div style={inputBoxStyle}>
          <div style={mascotStyle}>🤔</div>
          <p style={inputLabelStyle}>今回の冒険のテーマはなに？</p>
          <input 
            style={inputStyle}
            placeholder="例：方言、宿題、ネコ派かイヌ派か"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
          <br />
          <button 
            onClick={handleStart}
            disabled={loading || !theme}
            style={{
              ...buttonStyle,
              ...(loading || !theme ? buttonDisabledStyle : {})
            }}
          >
            {loading ? (
              <span style={loadingFlexStyle}>
                <span style={spinnerStyle}></span>
                魔法をかけています...
              </span>
            ) : (
              "クエスト開始！ 🚀"
            )}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* 意見のヒント・カード */}
          <section style={opinionCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={cardIconStyle}>💡</span>
              <h2 style={cardTitleStyle}>まずは「自分の考え」を決めよう！</h2>
            </div>
            <div style={opinionContentStyle}>
              <p style={opinionExampleStyle}>{lesson.opinion_example}</p>
              <div style={pointBoxStyle}>
                <strong>✨ 考えるヒント：</strong>{lesson.opinion_point}
              </div>
            </div>
          </section>

          {/* 作文エリアのタイトル */}
          <h3 style={sectionDividerStyle}>⚔️ ３つの強力な「理由」の武器 ⚔️</h3>

          {/* 3つの作文・カード */}
          <div style={gridStyle}>
            {lesson.reasons.map((item: any, i: number) => (
              <article key={i} style={compositionCardStyle}>
                <div style={{...cardHeaderStyle, borderBottom: '2px solid #ddd', paddingBottom: '10px'}}>
                  <span style={fileIconStyle}>📝</span>
                  <span style={reasonTitleStyle}>作戦その {i + 1}：{item.reason_title}</span>
                </div>
                
                <p style={compTextStyle}>{item.composition}</p>
                
                <div style={charCountStyle}>
                  📏 文字数：<strong>{item.composition.length}</strong> / 105 文字
                </div>
                
                <div style={logicCheckStyle}>
                  <div style={checkHeaderStyle}>
                    <span>🕵️‍♂️ Gemini先生の論理チェック</span>
                  </div>
                  <p style={checkBodyStyle}>{item.logic_check}</p>
                  <p style={hintStyle}>💡 アイデアの種：{item.reason_point}</p>
                </div>
              </article>
            ))}
          </div>

          <button 
            onClick={() => { setLesson(null); setTheme(""); }}
            style={backButtonStyle}
          >
            ↩️ 別のテーマで冒険する
          </button>
        </div>
      )}
    </main>
  );
}

// === かわいらしいスタイル定義 ===

// 全体のコンテナ（背景を少し明るく）
const containerStyle = { 
  padding: "40px 20px", 
  maxWidth: "900px", 
  margin: "0 auto", 
  fontFamily: "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif",
  color: "#333",
  backgroundColor: "#f9fcfd", // 薄い水色
  minHeight: "100vh"
};

// ヘッダー周り
const headerStyle = { textAlign: "center" as const, marginBottom: "50px" };
const headerIconStyle = { fontSize: "3rem", display: "block", marginBottom: "10px" };
const titleStyle = { fontSize: "2.5rem", fontWeight: "900", color: "#2c3e50", margin: "0", letterSpacing: "-1px" };
const subtitleStyle = { fontSize: "1.1rem", color: "#7f8c8d", marginTop: "5px", fontWeight: "bold" };

// 入力エリア（秘密の基地っぽいデザイン）
const inputBoxStyle = { 
  textAlign: "center" as const, 
  padding: "60px 20px", 
  border: "none", 
  borderRadius: "30px", 
  backgroundColor: "#fff", 
  boxShadow: "0 15px 35px rgba(0,0,0,0.05)",
  position: "relative" as const
};
const mascotStyle = { fontSize: "4rem", position: "absolute" as const, top: "-40px", left: "calc(50% - 2rem)", backgroundColor: "#f9fcfd", borderRadius: "50%", padding: "10px" };
const inputLabelStyle = { fontWeight: "bold", fontSize: "1.3rem", marginBottom: "25px", color: "#34495e", marginTop: "20px" };
const inputStyle = { 
  padding: "18px", 
  fontSize: "1.2rem", 
  width: "80%", 
  maxWidth: "400px",
  borderRadius: "15px", 
  border: "3px solid #dfe6e9", 
  marginBottom: "30px", 
  outline: "none",
  transition: "border-color 0.3s",
  textAlign: "center" as const
};

// クエスト開始ボタン（ぷっくりしたデザイン）
const buttonStyle = { 
  padding: "20px 60px", 
  fontSize: "1.4rem", 
  backgroundColor: "#ff7675", // ポップな赤
  color: "#fff", 
  border: "none", 
  borderRadius: "50px", 
  cursor: "pointer", 
  fontWeight: "bold", 
  boxShadow: "0 8px 0 #e15f5f",
  transition: "all 0.1s",
  transform: "translateY(0)"
};
const buttonDisabledStyle = { backgroundColor: "#b2bec3", boxShadow: "0 8px 0 #636e72", cursor: "not-allowed" };

// ローディング中のスタイル
const loadingFlexStyle = { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" };
const spinnerStyle = {
  width: "20px",
  height: "20px",
  border: "3px solid rgba(255,255,255,0.3)",
  borderTop: "3px solid #fff",
  borderRadius: "50%",
  animation: "spin 1s linear infinite"
};

// 結果エリアの共通カードスタイル
const cardHeaderStyle = { display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" };
const cardIconStyle = { fontSize: "1.5rem" };
const cardTitleStyle = { fontSize: "1.2rem", margin: "0", color: "#2c3e50", fontWeight: "bold" };

// 意見カード（やわらかい黄色）
const opinionCardStyle = { 
  backgroundColor: "#fffbe0", 
  padding: "30px", 
  borderRadius: "25px", 
  border: "3px solid #f1c40f",
  boxShadow: "0 10px 20px rgba(241, 196, 15, 0.1)"
};
const opinionContentStyle = { paddingLeft: "35px" };
const opinionExampleStyle = { fontSize: "1.4rem", fontWeight: "bold", marginBottom: "15px", color: "#000", lineHeight: "1.4" };
const pointBoxStyle = { fontSize: "0.95rem", color: "#7f8c8d", background: "#fff", padding: "15px", borderRadius: "12px", border: "1px solid #f1c40f" };

// 作文エリアの区切り
const sectionDividerStyle = { textAlign: "center" as const, color: "#7f8c8d", fontSize: "1rem", margin: "40px 0 20px 0", letterSpacing: "2px" };

// 作文カードのグリッド（PCだと横並び、スマホだと縦並び）
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "25px" };

// 作文カード（白ベースに青のアクセント）
const compositionCardStyle = { 
  border: "3px solid #2c3e50", 
  padding: "25px", 
  borderRadius: "25px", 
  backgroundColor: "#fff", 
  boxShadow: "0 10px 0 #2c3e50", // 3Dっぽい影
  display: "flex",
  flexDirection: "column" as const
};
const fileIconStyle = { fontSize: "1.2rem" };
const reasonTitleStyle = { fontSize: "1rem", fontWeight: "bold", color: "#0070f3" };
const compTextStyle = { fontSize: "1.2rem", lineHeight: "1.8", margin: "20px 0", fontWeight: "500", color: "#000", flexGrow: 1 };
const charCountStyle = { textAlign: "right" as const, fontSize: "0.85rem", color: "#7f8c8d", padding: "10px 0", borderTop: "1px solid #eee" };

// Gemini先生のチェックエリア（吹き出しっぽいデザイン）
const logicCheckStyle = { 
  marginTop: "15px", 
  background: "#e3f2fd", // 薄い青
  padding: "20px", 
  borderRadius: "15px", 
  position: "relative" as const
};
const checkHeaderStyle = { fontWeight: "bold", color: "#1565c0", marginBottom: "10px", fontSize: "0.9rem" };
const checkBodyStyle = { fontSize: "0.95rem", color: "#444", margin: "0 0 10px 0", lineHeight: "1.6" };
const hintStyle = { fontSize: "0.8rem", color: "#7f8c8d", fontStyle: "italic", borderTop: "1px solid #bbdefb", paddingTop: "8px" };

// 戻るボタン
const backButtonStyle = { 
  alignSelf: "center", 
  background: "none", 
  border: "none", 
  color: "#7f8c8d", 
  cursor: "pointer", 
  textDecoration: "underline", 
  marginTop: "40px", 
  fontSize: "1rem",
  fontWeight: "bold"
};
