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
  
  const [userStats, setUserStats] = useState({
    level: 1,
    totalPoints: 0, 
    combo: 0,          
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

  // 時間の直接入力ハンドラ
  const handleTimeChange = (val: string) => {
    let num = parseInt(val) || 0;
    if (num < 0) num = 0;
    if (num > 180) num = 180;
    setElapsed(num);
  };

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
          <div key={i} className="sparkle" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` } as any}>✨</div>
        ))}
      </div>

      <div className="content-wrapper">
        <div className="status-card">
          <div className="status-top">
            <div className="level-badge">{userStats.level}</div>
            <div className="rank-info">
              <div className="rank-name">{userStats.rankName}</div>
              <div className="exp-bar-bg"><div className="exp-bar-fill" style={{ width: '5%' }}></div></div>
            </div>
          </div>
          <div className="status-bottom">
            <div className="stat-item"><span className="stat-label">今月のpt</span><span className="stat-value">{userStats.totalPoints}</span></div>
            <div className="stat-divider"></div>
            <div className="stat-item"><span className="stat-label">コンボ</span><span className="stat-value">🔥 {userStats.combo}</span></div>
          </div>
        </div>

        <div className="game-card">
          {mode === "SELECT" && (
            <div className="fade-in">
              <h1 className="title">今日はなにを学ぶ？</h1>
              <div className="subject-grid">
                {SUBJECTS.map((s) => (
                  <button key={s.name} className="puni-button" style={{ '--btn-color': s.color, '--btn-shadow': s.shadow } as any}
                    onClick={() => { setSubject(s.name); const now = Date.now(); setStartTime(now); setMode("TIMER"); localStorage.setItem("currentStudy", JSON.stringify({ subject: s.name, startTime: now })); }}>
                    <div className="puni-face"><span className="icon">{s.icon}</span><span className="name">{s.name}</span></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "TIMER" && (
            <div className="timer-screen fade-in text-center">
              <div className="status-badge">冒険の記録ちゅう...</div>
              <h2 className="current-subject">{subject}</h2>
              <div className="timer-circle"><span className="time-val">{elapsed}</span><span className="time-unit">分</span></div>
              <div className="button-group-v">
                <button className="puni-button-rect finish" onClick={() => setMode("CONFIRM")}>クエスト完了！ 🏁</button>
                <button className="back-link" onClick={() => { if(confirm("やりなおす？")) setMode("SELECT"); }}>← 科目を選びなおす</button>
              </div>
            </div>
          )}

          {mode === "CONFIRM" && (
            <div className="confirm-screen fade-in">
              <h2 className="title">時間のかくにん 📝</h2>
              
              <div className="puni-editor-card">
                <p className="editor-label">時間をえらんでね</p>
                <div className="time-input-row">
                  <button className="step-btn" onClick={() => handleTimeChange((elapsed - 5).toString())}>−</button>
                  <div className="input-box">
                    <input 
                      type="number" 
                      value={elapsed} 
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="time-text-input"
                    />
                    <span className="unit-label">分</span>
                  </div>
                  <button className="step-btn" onClick={() => handleTimeChange((elapsed + 5).toString())}>+</button>
                </div>
                
                {/* スライダーでバーーッと調整できる */}
                <input 
                  type="range" 
                  min="0" max="180" 
                  value={elapsed} 
                  onChange={(e) => setElapsed(parseInt(e.target.value))}
                  className="puni-slider"
                />
              </div>

              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="メモ（勉強の内容など）" className="memo-area" />
              
              <div className="button-group-v">
                <button className="puni-button-rect save" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "セーブ中..." : "セーブして完了！ ✨"}
                </button>
                <button className="back-link" onClick={() => setMode("TIMER")}>← タイマーにもどる</button>
              </div>
            </div>
          )}

          {mode === "RESULT" && result && (
            <div className="result-screen fade-in text-center">
              <div className="crown">👑</div>
              <h2 className="clear-text">QUEST CLEAR!</h2>
              <div className="reward-box">
                <span className="reward-label">もらったポイント</span>
                <span className="reward-val">+{result.points}</span>
              </div>
              <button className="puni-button-rect next" onClick={() => { setMemo(""); setMode("SELECT"); }}>次のぼうけんへ 🚀</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .main-container { min-height: 100vh; background: radial-gradient(circle at top left, #98FFD9 0%, #F0FFF9 100%); padding: 20px 15px; font-family: 'Hiragino Maru Gothic ProN', 'Meiryo', sans-serif; box-sizing: border-box; }
        .content-wrapper { max-width: 400px; margin: 0 auto; }
        .status-card { background: white; border-radius: 25px; border: 4px solid #98FFD9; margin-bottom: 20px; box-shadow: 0 6px 0 #98FFD9; }
        .status-top { padding: 10px 15px; display: flex; align-items: center; gap: 12px; border-bottom: 2px dashed #98FFD9; }
        .level-badge { width: 36px; height: 36px; background: linear-gradient(135deg, #FFD93D, #FF9F1A); border-radius: 10px; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: white; }
        .rank-name { font-size: 11px; font-weight: 900; color: #2D5A47; }
        .exp-bar-bg { width: 100px; height: 6px; background: #E6FFF4; border-radius: 3px; border: 1px solid #98FFD9; }
        .exp-bar-fill { height: 100%; background: #66ED9A; }
        .status-bottom { display: flex; padding: 8px; justify-content: space-around; }
        .stat-label { font-size: 9px; color: #8ABBA6; font-weight: 900; display: block; }
        .stat-value { font-size: 16px; font-weight: 900; color: #2D5A47; }
        .stat-divider { width: 1px; height: 15px; background: #E6FFF4; }

        .game-card { background: rgba(255, 255, 255, 0.95); border-radius: 40px; border: 4px solid white; padding: 25px 20px; box-shadow: 0 15px 35px rgba(152, 255, 217, 0.2); box-sizing: border-box; }
        .title { font-size: 20px; font-weight: 900; text-align: center; color: #2D5A47; margin-bottom: 15px; }
        .subject-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .puni-button { height: 100px; border: none; background: var(--btn-shadow); border-radius: 20px; cursor: pointer; position: relative; width: 100%; }
        .puni-face { position: absolute; inset: 0 0 6px 0; background: var(--btn-color); border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-top: 3px solid rgba(255,255,255,0.3); }
        .puni-button:active .puni-face { transform: translateY(4px); }
        .puni-button .icon { font-size: 32px; }
        .puni-button .name { color: white; font-weight: 900; font-size: 14px; }
        
        .puni-editor-card { background: #F0FFF9; border: 3px solid #98FFD9; border-radius: 25px; padding: 15px; margin-bottom: 15px; }
        .editor-label { font-size: 12px; font-weight: 900; color: #8ABBA6; text-align: center; margin-bottom: 10px; }
        .time-input-row { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px; }
        .step-btn { width: 40px; height: 40px; background: white; border: 3px solid #98FFD9; border-radius: 50%; font-size: 20px; font-weight: 900; box-shadow: 0 3px 0 #98FFD9; }
        .input-box { display: flex; align-items: baseline; background: white; padding: 5px 15px; border-radius: 15px; border: 3px solid #98FFD9; }
        .time-text-input { width: 60px; border: none; font-size: 32px; font-weight: 900; text-align: center; color: #2D5A47; background: none; outline: none; }
        .unit-label { font-size: 14px; font-weight: 900; color: #2D5A47; }
        
        .puni-slider { -webkit-appearance: none; width: 100%; height: 10px; background: #E6FFF4; border-radius: 5px; outline: none; border: 2px solid #98FFD9; }
        .puni-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 25px; height: 25px; background: #00C951; border: 3px solid white; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }

        .memo-area { width: 100%; box-sizing: border-box; padding: 12px; border-radius: 15px; border: 3px solid #98FFD9; height: 80px; margin-bottom: 10px; background: white; font-family: inherit; resize: none; }
        .puni-button-rect { width: 100%; height: 60px; border: none; border-radius: 30px; font-size: 18px; font-weight: 900; color: white; cursor: pointer; }
        .save { background: #00C951; box-shadow: 0 6px 0 #00A644; }
        .finish { background: #4CC9F0; box-shadow: 0 6px 0 #3A86FF; }
        .next { background: #FFD93D; color: #B38F00; box-shadow: 0 6px 0 #E6B800; }
        .back-link { background: none; border: none; color: #8ABBA6; font-size: 13px; cursor: pointer; margin-top: 5px; text-decoration: underline; }

        .timer-circle { width: 150px; height: 150px; background: white; margin: 15px auto; border-radius: 50%; border: 6px solid #98FFD9; display: flex; align-items: center; justify-content: center; flex-direction: column; }
        .time-val { font-size: 45px; font-weight: 900; color: #2D5A47; }
        .reward-box { background: #FFF9CC; padding: 20px; border-radius: 25px; border: 3px solid #FFD93D; margin-bottom: 15px; }
        .reward-val { display: block; font-size: 45px; font-weight: 900; color: #B38F00; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .sparkles { position: absolute; inset: 0; pointer-events: none; }
        .sparkle { position: absolute; font-size: 16px; animation: bounce 4s infinite ease-in-out; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
      `}</style>
    </main>
  );
}
