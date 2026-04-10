"use client";

import { useState, useEffect } from "react";
import { saveStudyLog } from "@/app/actions/study";

type Mode = "SELECT" | "TIMER" | "CONFIRM" | "RESULT";

// デザイン定義をCSS変数で扱えるように整理
const SUBJECTS = [
  { name: "算数", icon: "📐", color: "#4CC9F0", shadow: "#3A86FF" },
  { name: "国語", icon: "📖", color: "#FF4D6D", shadow: "#C9184A" },
  { name: "理科", icon: "🧪", color: "#72EFDD", shadow: "#208B81" },
  { name: "社会", icon: "🗺️", color: "#FFB703", shadow: "#FB8500" },
  { name: "論理", icon: "🧩", color: "#B5179E", shadow: "#7209B7" },
  { name: "作文", icon: "✍️", color: "#FF85A1", shadow: "#FF477E" },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("SELECT");
  const [subject, setSubject] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [memo, setMemo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{points: number, combo: number} | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("currentStudy");
    if (stored) {
      const { subject, startTime } = JSON.parse(stored);
      setSubject(subject);
      setStartTime(startTime);
      setMode("TIMER");
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === "TIMER" && startTime) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000 / 60);
        setElapsed(diff >= 180 ? 180 : diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, startTime]);

  const handleSave = async () => {
    setIsSaving(true);
    const original = startTime ? Math.floor((Date.now() - startTime) / 1000 / 60) : elapsed;
    const res = await saveStudyLog({
      userId: "daughter_01",
      subject,
      duration: elapsed,
      originalDuration: original,
      isEdited: elapsed !== original,
      memo
    });
    if (res.success) {
      setResult({ points: res.points!, combo: res.combo! });
      setMode("RESULT");
    }
    setIsSaving(false);
  };

  return (
    <main className="main-container">
      {/* キラキラ背景粒子 */}
      <div className="sparkles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="sparkle">✨</div>
        ))}
      </div>

      <div className="content-wrapper">
        {/* レベルヘッダー */}
        <div className="level-header">
          <div className="level-badge">5</div>
          <div className="level-info">
            <span className="level-title">見習い探検家</span>
            <div className="exp-bar-bg">
              <div className="exp-bar-fill" style={{ width: '45%' }}></div>
            </div>
          </div>
        </div>

        {/* メインカード */}
        <div className="game-card">
          {mode === "SELECT" && (
            <div className="fade-in">
              <h1 className="title">冒険の行き先は？</h1>
              <div className="subject-grid">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.name}
                    className="puni-button"
                    style={{ '--btn-color': s.color, '--btn-shadow': s.shadow } as any}
                    onClick={() => {
                      setSubject(s.name);
                      const now = Date.now();
                      setStartTime(now);
                      setMode("TIMER");
                      localStorage.setItem("currentStudy", JSON.stringify({ subject: s.name, startTime: now }));
                    }}
                  >
                    <span className="icon">{s.icon}</span>
                    <span className="name">{s.name}</span>
                    <div className="highlight"></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "TIMER" && (
            <div className="timer-screen fade-in">
              <div className="status-badge">QUESTING...</div>
              <h2 className="current-subject">{subject}</h2>
              <div className="timer-circle">
                <span className="time-val">{elapsed}</span>
                <span className="time-unit">min</span>
              </div>
              <button className="puni-button-rect" onClick={() => setMode("CONFIRM")}>
                クエスト完了！ 🏁
              </button>
            </div>
          )}

          {mode === "CONFIRM" && (
            <div className="confirm-screen fade-in">
              <h2 className="title">報告を書こう！ 📖</h2>
              <div className="time-editor">
                <button onClick={() => setElapsed(Math.max(0, elapsed - 5))}>-</button>
                <div className="time-display">{elapsed}</div>
                <button onClick={() => setElapsed(elapsed + 5)}>+</button>
              </div>
              <textarea 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="勉強の内容をメモしよう！"
                className="memo-area"
              />
              <button className="puni-button-rect save" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "セーブ中..." : "セーブして完了！ ✨"}
              </button>
            </div>
          )}

          {mode === "RESULT" && result && (
            <div className="result-screen fade-in">
              <div className="crown">👑</div>
              <h2 className="clear-text">CLEAR!</h2>
              <div className="reward-box">
                <span className="reward-label">STUDY POINTS</span>
                <span className="reward-val">+{result.points}</span>
              </div>
              <div className="combo-badge">🔥 {result.combo}日連続！</div>
              <button className="puni-button-rect next" onClick={() => setMode("SELECT")}>
                次へすすむ 🚀
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .main-container {
          min-height: 100vh;
          background: radial-gradient(circle at top left, #98FFD9 0%, #F0FFF9 100%);
          padding: 20px;
          font-family: 'Hiragino Maru Gothic ProN', 'Meiryo', sans-serif;
          overflow-x: hidden;
        }
        .content-wrapper {
          max-width: 400px;
          margin: 0 auto;
        }
        .level-header {
          background: white;
          padding: 15px;
          border-radius: 25px;
          border: 4px solid #98FFD9;
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 25px;
          box-shadow: 0 8px 0 #98FFD9;
        }
        .level-badge {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #FFD93D, #FF9F1A);
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          color: white;
          box-shadow: 0 4px 0 rgba(0,0,0,0.1);
        }
        .level-title {
          font-size: 12px;
          font-weight: 900;
          color: #8ABBA6;
        }
        .exp-bar-bg {
          height: 15px;
          background: #E6FFF4;
          border-radius: 10px;
          border: 2px solid #98FFD9;
          margin-top: 5px;
          overflow: hidden;
        }
        .exp-bar-fill {
          height: 100%;
          background: linear-gradient(to right, #66ED9A, #00C951);
        }
        .game-card {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 40px;
          border: 4px solid white;
          padding: 30px 20px;
          box-shadow: 0 20px 40px rgba(152, 255, 217, 0.4);
        }
        .title {
          font-size: 24px;
          font-weight: 900;
          text-align: center;
          color: #2D5A47;
          margin-bottom: 25px;
        }
        .subject-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .puni-button {
          position: relative;
          height: 130px;
          border: none;
          background: var(--btn-shadow);
          border-radius: 30px;
          cursor: pointer;
          padding: 0;
          transition: transform 0.1s;
        }
        .puni-button .name {
          position: absolute;
          inset: 0 0 8px 0;
          background: var(--btn-color);
          border-radius: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 15px;
          color: white;
          font-weight: 900;
          font-size: 18px;
          border-top: 4px solid rgba(255,255,255,0.4);
          transition: transform 0.1s;
        }
        .puni-button .icon {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 45px;
          z-index: 2;
        }
        .puni-button:active {
          transform: scale(0.95);
        }
        .puni-button:active .name {
          transform: translateY(4px);
        }
        .puni-button-rect {
          width: 100%;
          height: 70px;
          border: none;
          background: #E66B74;
          border-radius: 35px;
          position: relative;
          font-size: 20px;
          font-weight: 900;
          color: white;
          box-shadow: 0 8px 0 #C9184A;
          cursor: pointer;
        }
        .puni-button-rect:active {
          transform: translateY(4px);
          box-shadow: 0 4px 0 #C9184A;
        }
        .timer-circle {
          width: 200px;
          height: 200px;
          background: white;
          margin: 30px auto;
          border-radius: 50%;
          border: 8px solid #98FFD9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(152, 255, 217, 0.5);
        }
        .time-val { font-size: 60px; font-weight: 900; color: #2D5A47; line-height: 1; }
        .time-unit { font-size: 20px; font-weight: 900; color: #8ABBA6; }
        .time-editor {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          background: #F0FFF9;
          padding: 20px;
          border-radius: 30px;
          border: 3px solid #98FFD9;
        }
        .time-editor button {
          width: 50px;
          height: 50px;
          background: white;
          border: 3px solid #98FFD9;
          border-radius: 50%;
          font-size: 24px;
          font-weight: 900;
          color: #2D5A47;
          box-shadow: 0 4px 0 #98FFD9;
        }
        .time-display { font-size: 45px; font-weight: 900; color: #2D5A47; }
        .memo-area {
          width: 100%;
          margin-top: 20px;
          padding: 20px;
          border-radius: 20px;
          border: 3px solid #98FFD9;
          font-size: 16px;
          height: 120px;
          margin-bottom: 20px;
        }
        .save { background: #00C951; box-shadow: 0 8px 0 #00A644; }
        .reward-box {
          background: #FFF9CC;
          padding: 40px 20px;
          border-radius: 40px;
          border: 4px solid #FFD93D;
          text-align: center;
          margin-bottom: 20px;
        }
        .reward-val { display: block; font-size: 60px; font-weight: 900; color: #B38F00; }
        .reward-label { font-size: 14px; font-weight: 900; color: #B38F00; opacity: 0.6; }
        .fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .sparkles { position: absolute; inset: 0; pointer-events: none; }
        .sparkle { position: absolute; font-size: 20px; animation: bounce 3s infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
      `}</style>
    </main>
  );
}
