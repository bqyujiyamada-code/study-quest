"use client";

import { useState, useEffect } from "react";
import { saveStudyLog } from "@/app/actions/study";

type Mode = "SELECT" | "TIMER" | "CONFIRM" | "RESULT";

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
  
  // ステータス関連（本来はDBから取得しますが、まずは初期値を設定）
  const [userStats, setUserStats] = useState({
    level: 1,
    totalPoints: 1250, // 今月のポイント例
    combo: 3,          // 連続日数例
    rankName: "見習い探検家"
  });
  
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
      // 保存成功時にステータスを更新（仮）
      setUserStats(prev => ({
        ...prev,
        totalPoints: prev.totalPoints + (res.points || 0),
        combo: res.combo || prev.combo
      }));
      setMode("RESULT");
    }
    setIsSaving(false);
  };

  return (
    <main className="main-container">
      <div className="sparkles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="sparkle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`
          } as any}>✨</div>
        ))}
      </div>

      <div className="content-wrapper">
        {/* レベル・ポイント・コンボ 統合ヘッダー */}
        <div className="status-card">
          <div className="status-top">
            <div className="level-badge">{userStats.level}</div>
            <div className="rank-info">
              <div className="rank-name">{userStats.rankName}</div>
              <div className="exp-bar-bg">
                <div className="exp-bar-fill" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
          <div className="status-bottom">
            <div className="stat-item">
              <span className="stat-label">今月のポイント</span>
              <span className="stat-value">{userStats.totalPoints} <small>pt</small></span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-label">コンボ</span>
              <span className="stat-value">🔥 {userStats.combo} <small>日</small></span>
            </div>
          </div>
        </div>

        <div className="game-card">
          {mode === "SELECT" && (
            <div className="fade-in">
              <h1 className="title">次はなにをやる？</h1>
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
                    <div className="puni-face">
                      <span className="icon">{s.icon}</span>
                      <span className="name">{s.name}</span>
                      <div className="puni-highlight"></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "TIMER" && (
            <div className="timer-screen fade-in">
              <div className="status-badge">冒険の記録ちゅう...</div>
              <h2 className="current-subject">{subject}</h2>
              <div className="timer-circle">
                <div className="timer-glow"></div>
                <span className="time-val">{elapsed}</span>
                <span className="time-unit">分</span>
              </div>
              <button className="puni-button-rect cancel" onClick={() => setMode("CONFIRM")}>
                おわりにする 🏁
              </button>
            </div>
          )}

          {mode === "CONFIRM" && (
            <div className="confirm-screen fade-in">
              <h2 className="title">報告書をかこう 📝</h2>
              <div className="time-editor">
                <button onClick={() => setElapsed(Math.max(0, elapsed - 5))}>−</button>
                <div className="time-display">{elapsed}<small>分</small></div>
                <button onClick={() => setElapsed(elapsed + 5)}>+</button>
              </div>
              <div className="input-group">
                <textarea 
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="どんなことをがんばったかな？"
                  className="memo-area"
                />
              </div>
              <button className="puni-button-rect save" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "セーブ中..." : "セーブして完了！ ✨"}
              </button>
            </div>
          )}

          {mode === "RESULT" && result && (
            <div className="result-screen fade-in">
              <div className="crown">👑</div>
              <h2 className="clear-text">QUEST CLEAR!</h2>
              <div className="reward-box">
                <span className="reward-label">もらったポイント</span>
                <span className="reward-val">+{result.points}</span>
              </div>
              <button className="puni-button-rect next" onClick={() => setMode("SELECT")}>
                次のぼうけんへ 🚀
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .main-container {
          min-height: 100vh;
          background: radial-gradient(circle at top left, #98FFD9 0%, #F0FFF9 100%);
          padding: 20px 15px;
          font-family: 'Hiragino Maru Gothic ProN', 'Meiryo', sans-serif;
          overflow-x: hidden;
          box-sizing: border-box;
        }
        .content-wrapper {
          max-width: 400px;
          margin: 0 auto;
        }
        /* 統合ヘッダーのデザイン */
        .status-card {
          background: white;
          border-radius: 30px;
          border: 4px solid #98FFD9;
          margin-bottom: 20px;
          box-shadow: 0 10px 0 #98FFD9;
          overflow: hidden;
        }
        .status-top {
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 15px;
          background: rgba(152, 255, 217, 0.1);
          border-bottom: 2px dashed #98FFD9;
        }
        .level-badge {
          width: 45px;
          height: 45px;
          background: linear-gradient(135deg, #FFD93D, #FF9F1A);
          border-radius: 15px;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 900;
          color: white;
          box-shadow: 0 4px 0 rgba(0,0,0,0.1);
        }
        .rank-name { font-size: 14px; font-weight: 900; color: #2D5A47; }
        .exp-bar-bg {
          width: 150px;
          height: 10px;
          background: #E6FFF4;
          border-radius: 5px;
          margin-top: 4px;
          overflow: hidden;
          border: 1px solid #98FFD9;
        }
        .exp-bar-fill { height: 100%; background: #66ED9A; }
        .status-bottom {
          display: flex;
          padding: 10px 15px;
          justify-content: space-around;
          align-items: center;
        }
        .stat-item { text-align: center; }
        .stat-label { display: block; font-size: 10px; color: #8ABBA6; font-weight: 900; }
        .stat-value { font-size: 18px; font-weight: 900; color: #2D5A47; }
        .stat-value small { font-size: 10px; }
        .stat-divider { width: 2px; height: 20px; background: #E6FFF4; }

        /* カードとボタン */
        .game-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 40px;
          border: 4px solid white;
          padding: 25px 20px;
          box-shadow: 0 15px 35px rgba(152, 255, 217, 0.3);
          box-sizing: border-box;
        }
        .subject-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .puni-button {
          height: 120px;
          border: none;
          background: var(--btn-shadow);
          border-radius: 25px;
          cursor: pointer;
          padding: 0;
          position: relative;
        }
        .puni-face {
          position: absolute;
          inset: 0 0 6px 0;
          background: var(--btn-color);
          border-radius: 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 12px;
          border-top: 3px solid rgba(255,255,255,0.4);
          transition: transform 0.1s;
        }
        .puni-button:active .puni-face { transform: translateY(4px); }
        .puni-button .icon { font-size: 40px; margin-bottom: 5px; }
        .puni-button .name { color: white; font-weight: 900; font-size: 16px; }
        
        .puni-button-rect {
          width: 100%;
          height: 65px;
          border: none;
          border-radius: 30px;
          font-size: 20px;
          font-weight: 900;
          color: white;
          cursor: pointer;
          transition: all 0.1s;
          box-sizing: border-box;
        }
        .save { background: #00C951; box-shadow: 0 6px 0 #00A644; }
        .cancel { background: #FF8B94; box-shadow: 0 6px 0 #E66B74; }
        .next { background: #4CC9F0; box-shadow: 0 6px 0 #3A86FF; }
        .puni-button-rect:active { transform: translateY(4px); box-shadow: none; }

        /* 入力欄の修正（はみ出し防止） */
        .input-group { width: 100%; box-sizing: border-box; }
        .memo-area {
          width: 100%;
          box-sizing: border-box;
          padding: 15px;
          border-radius: 20px;
          border: 3px solid #98FFD9;
          font-size: 16px;
          height: 100px;
          margin: 15px 0;
          background: #F0FFF9;
          font-family: inherit;
          resize: none;
        }

        .timer-circle {
          width: 180px;
          height: 180px;
          background: white;
          margin: 25px auto;
          border-radius: 50%;
          border: 6px solid #98FFD9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          position: relative;
          box-shadow: inset 0 0 20px rgba(152, 255, 217, 0.2);
        }
        .time-val { font-size: 50px; font-weight: 900; color: #2D5A47; }
        .time-display { font-size: 45px; font-weight: 900; color: #2D5A47; }
        .time-editor {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F0FFF9;
          padding: 15px;
          border-radius: 25px;
          border: 2px solid #98FFD9;
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
        .reward-box {
          background: #FFF9CC;
          padding: 30px;
          border-radius: 35px;
          border: 4px solid #FFD93D;
          margin-bottom: 20px;
        }
        .reward-val { display: block; font-size: 55px; font-weight: 900; color: #B38F00; }
        .reward-label { font-size: 12px; font-weight: 900; color: #B38F00; opacity: 0.6; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        .sparkles { position: absolute; inset: 0; pointer-events: none; }
        .sparkle { position: absolute; font-size: 18px; animation: bounce 4s infinite ease-in-out; }
        @keyframes bounce { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.2); } }
      `}</style>
    </main>
  );
}
