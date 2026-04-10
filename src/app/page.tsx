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

const RANK_MASTER = [
  { lv: 1,  h: 0,   name: "見習い探検家", desc: "まずは記録をつける習慣から！" },
  { lv: 2,  h: 10,  name: "基礎固めの門下生", desc: "基礎が少しずつ固まってきた証" },
  { lv: 3,  h: 30,  name: "論理の初段", desc: "思考のエンジンがかかり始める" },
  { lv: 4,  h: 60,  name: "適性検査の挑戦者", desc: "複雑な問題にも立ち向かう勇者" },
  { lv: 5,  h: 100, name: "集中力の達人", desc: "【半分経過】 勉強が日常になった証" },
  { lv: 6,  h: 150, name: "開成チャレンジャー", desc: "難問を解くのが楽しくなる時期" },
  { lv: 7,  h: 210, name: "思考の魔術師", desc: "独自の解法が見え始める" },
  { lv: 8,  h: 280, name: "記述の鉄人", desc: "どんな長い作文も怖くない" },
  { lv: 9,  h: 360, name: "論理の賢者", desc: "全てを俯瞰して解ける域" },
  { lv: 10, h: 450, name: "絶対合格の守護神", desc: "合格への扉が開かれる！" },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("SELECT");
  const [subject, setSubject] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [memo, setMemo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  // レベル計算
  const getLevelInfo = (totalMin: number) => {
    const totalHours = totalMin / 60;
    const currentRankIdx = RANK_MASTER.slice().reverse().findIndex(r => totalHours >= r.h);
    const currentRank = RANK_MASTER[RANK_MASTER.length - 1 - (currentRankIdx === -1 ? 0 : currentRankIdx)];
    const nextRank = RANK_MASTER.find(r => r.lv === currentRank.lv + 1);
    
    let progress = 100;
    let remainingText = "MAX LEVEL";
    if (nextRank) {
      const currentLvMin = currentRank.h * 60;
      const nextLvMin = nextRank.h * 60;
      progress = ((totalMin - currentLvMin) / (nextLvMin - currentLvMin)) * 100;
      remainingText = `あと ${nextLvMin - totalMin} 分で Lv.${nextRank.lv}`;
    }
    return { ...currentRank, progress, remainingText };
  };

  const levelInfo = getLevelInfo(totalMinutes);
  const [result, setResult] = useState<{points: number, combo: number, leveledUp: boolean} | null>(null);

  useEffect(() => {
    const interval = mode === "TIMER" && startTime ? setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000 / 60);
      setElapsed(diff >= 180 ? 180 : diff);
    }, 1000) : null;
    return () => { if(interval) clearInterval(interval); };
  }, [mode, startTime]);

  const handleSave = async () => {
    setIsSaving(true);
    const original = startTime ? Math.floor((Date.now() - startTime) / 1000 / 60) : elapsed;
    const res = await saveStudyLog({
      userId: "daughter_01", subject, duration: elapsed, originalDuration: original, isEdited: elapsed !== original, memo
    });
    if (res.success) {
      const oldLevel = getLevelInfo(totalMinutes).lv;
      const newTotal = totalMinutes + elapsed;
      const newLevel = getLevelInfo(newTotal).lv;

      setResult({ points: res.points!, combo: res.combo!, leveledUp: newLevel > oldLevel });
      setTotalMinutes(newTotal);
      setTotalPoints(prev => prev + (res.points || 0));
      setCombo(res.combo || 0);
      setMode("RESULT");
    }
    setIsSaving(false);
  };

  return (
    <main className="main-container">
      {/* 常に舞うキラキラ */}
      <div className="sparkles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="sparkle" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` } as any}>✨</div>
        ))}
      </div>

      <div className="content-wrapper">
        <div className="status-card">
          <div className="status-top">
            <div className="level-badge">{levelInfo.lv}</div>
            <div className="rank-info">
              <div className="rank-name">{levelInfo.name}</div>
              <div className="exp-bar-bg"><div className="exp-bar-fill" style={{ width: `${levelInfo.progress}%` }}></div></div>
              <div className="exp-text">{levelInfo.remainingText}</div>
            </div>
          </div>
          <div className="status-bottom">
            <div className="stat-item"><span className="stat-label">今月のpt</span><span className="stat-value">{totalPoints}</span></div>
            <div className="stat-divider"></div>
            <div className="stat-item"><span className="stat-label">累計時間</span><span className="stat-value">{Math.floor(totalMinutes / 60)}<small>h</small></span></div>
            <div className="stat-divider"></div>
            <div className="stat-item"><span className="stat-label">コンボ</span><span className="stat-value">🔥 {combo}</span></div>
          </div>
        </div>

        <div className="game-card">
          {mode === "SELECT" && (
            <div className="fade-in">
              <h1 className="title">今日はなにを冒険する？</h1>
              <div className="subject-grid">
                {SUBJECTS.map((s) => (
                  <button key={s.name} className="puni-button" style={{ '--btn-color': s.color, '--btn-shadow': s.shadow } as any}
                    onClick={() => { setSubject(s.name); const now = Date.now(); setStartTime(now); setMode("TIMER"); }}>
                    <div className="puni-face"><span className="icon">{s.icon}</span><span className="name">{s.name}</span></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "TIMER" && (
            <div className="timer-screen fade-in text-center">
              <div className="status-badge">クエスト進行中...</div>
              <h2 className="current-subject">{subject}</h2>
              <div className="timer-circle"><span className="time-val">{elapsed}</span><span className="time-unit">分</span></div>
              <div className="button-group-v">
                <button className="puni-button-rect finish" onClick={() => setMode("CONFIRM")}>冒険を切り上げる 🏁</button>
                <button className="back-link" onClick={() => { if(confirm("選びなおす？")) setMode("SELECT"); }}>← 科目を選びなおす</button>
              </div>
            </div>
          )}

          {mode === "CONFIRM" && (
            <div className="confirm-screen fade-in">
              <h2 className="title">冒険の記録 📝</h2>
              <div className="puni-editor-card">
                <div className="time-input-row">
                  <button className="step-btn" onClick={() => setElapsed(Math.max(0, elapsed - 5))}>−</button>
                  <div className="input-box">
                    <input type="number" value={elapsed} onChange={(e) => {
                      let v = parseInt(e.target.value) || 0;
                      setElapsed(v > 180 ? 180 : v);
                    }} className="time-text-input" />
                    <span className="unit-label">分</span>
                  </div>
                  <button className="step-btn" onClick={() => setElapsed(Math.min(180, elapsed + 5))}>+</button>
                </div>
                <input type="range" min="0" max="180" value={elapsed} onChange={(e) => setElapsed(parseInt(e.target.value))} className="puni-slider" />
              </div>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="今日の発見や頑張ったこと" className="memo-area" />
              <button className="puni-button-rect save" onClick={handleSave} disabled={isSaving}>{isSaving ? "セーブ中..." : "冒険をセーブする！ ✨"}</button>
            </div>
          )}

          {mode === "RESULT" && result && (
            <div className="result-screen fade-in text-center">
              {result.leveledUp ? (
                <div className="levelup-announcement">
                  <div className="lvl-up-stars">🎊✨🎊</div>
                  <h2 className="lvl-up-title">LEVEL UP!!</h2>
                  <div className="new-rank-badge">Lv.{levelInfo.lv}</div>
                  <div className="new-rank-name">{levelInfo.name}</div>
                  <p className="new-rank-desc">「{levelInfo.desc}」</p>
                </div>
              ) : (
                <>
                  <div className="crown">👑</div>
                  <h2 className="clear-text">QUEST CLEAR!</h2>
                </>
              )}
              <div className="reward-box">
                <span className="reward-label">獲得ポイント</span>
                <span className="reward-val">+{result.points}</span>
              </div>
              <button className="puni-button-rect next" onClick={() => { setMemo(""); setMode("SELECT"); }}>次の冒険へ 🚀</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .main-container { min-height: 100vh; background: radial-gradient(circle at top left, #98FFD9 0%, #F0FFF9 100%); padding: 15px; font-family: sans-serif; box-sizing: border-box; position: relative; overflow-x: hidden; }
        .content-wrapper { max-width: 400px; margin: 0 auto; position: relative; z-index: 2; }
        
        .status-card { background: white; border-radius: 20px; border: 4px solid #98FFD9; margin-bottom: 15px; padding: 10px; box-shadow: 0 6px 0 #98FFD9; }
        .status-top { display: flex; align-items: center; gap: 10px; border-bottom: 2px dashed #98FFD9; padding-bottom: 8px; margin-bottom: 8px; }
        .level-badge { width: 40px; height: 40px; background: linear-gradient(135deg, #FFD93D, #FF9F1A); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; color: white; border: 2px solid white; }
        .rank-name { font-size: 13px; font-weight: 900; color: #2D5A47; }
        .exp-bar-bg { width: 100%; height: 8px; background: #E6FFF4; border-radius: 4px; border: 1px solid #98FFD9; margin: 3px 0; overflow: hidden; }
        .exp-bar-fill { height: 100%; background: #66ED9A; transition: width 1s ease-in-out; }
        .exp-text { font-size: 8px; color: #8ABBA6; font-weight: bold; }
        .status-bottom { display: flex; justify-content: space-around; }
        .stat-label { font-size: 9px; color: #8ABBA6; display: block; font-weight: bold; }
        .stat-value { font-size: 16px; font-weight: 900; color: #2D5A47; }
        .stat-divider { width: 1px; height: 15px; background: #E6FFF4; align-self: center; }

        .game-card { background: rgba(255, 255, 255, 0.95); border-radius: 30px; border: 4px solid white; padding: 20px; box-shadow: 0 10px 30px rgba(152, 255, 217, 0.2); }
        .title { font-size: 18px; font-weight: 900; text-align: center; color: #2D5A47; margin-bottom: 15px; }
        .subject-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .puni-button { height: 90px; border: none; background: var(--btn-shadow); border-radius: 15px; position: relative; cursor: pointer; }
        .puni-face { position: absolute; inset: 0 0 5px 0; background: var(--btn-color); border-radius: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-top: 3px solid rgba(255,255,255,0.3); }
        .puni-button:active .puni-face { transform: translateY(3px); }
        .puni-button .icon { font-size: 30px; }
        .puni-button .name { color: white; font-weight: 900; font-size: 14px; }

        /* 3桁対応の入力欄修正 */
        .input-box { display: flex; align-items: baseline; background: white; padding: 5px 12px; border-radius: 15px; border: 3px solid #98FFD9; min-width: 100px; justify-content: center; }
        .time-text-input { width: 85px; border: none; font-size: 38px; font-weight: 900; text-align: center; color: #2D5A47; outline: none; }
        .unit-label { font-size: 14px; font-weight: 900; color: #2D5A47; margin-left: 2px; }

        .puni-editor-card { background: #F0FFF9; border: 3px solid #98FFD9; border-radius: 20px; padding: 15px; margin-bottom: 12px; }
        .time-input-row { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px; }
        .step-btn { width: 40px; height: 40px; background: white; border: 3px solid #98FFD9; border-radius: 50%; font-size: 20px; font-weight: 900; color: #2D5A47; }
        .puni-slider { -webkit-appearance: none; width: 100%; height: 10px; background: #E6FFF4; border-radius: 5px; outline: none; border: 1px solid #98FFD9; }
        .puni-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 26px; height: 26px; background: #00C951; border: 3px solid white; border-radius: 50%; }

        .memo-area { width: 100%; box-sizing: border-box; padding: 12px; border-radius: 15px; border: 2px solid #98FFD9; height: 70px; margin-bottom: 10px; resize: none; font-family: inherit; }
        .puni-button-rect { width: 100%; height: 55px; border: none; border-radius: 30px; font-size: 18px; font-weight: 900; color: white; cursor: pointer; }
        .save { background: #00C951; box-shadow: 0 5px 0 #00A644; }
        .finish { background: #4CC9F0; box-shadow: 0 5px 0 #3A86FF; }
        .next { background: #FFD93D; color: #B38F00; box-shadow: 0 5px 0 #E6B800; }

        /* レベルアップ演出 */
        .levelup-announcement { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); margin-bottom: 20px; }
        .lvl-up-stars { font-size: 30px; margin-bottom: 5px; }
        .lvl-up-title { font-size: 28px; font-weight: 900; color: #FF4D6D; text-shadow: 2px 2px 0 white; margin: 0; }
        .new-rank-badge { display: inline-block; padding: 5px 15px; background: #FFD93D; color: white; border-radius: 10px; font-weight: 900; font-size: 20px; margin-top: 10px; }
        .new-rank-name { font-size: 22px; font-weight: 900; color: #2D5A47; margin: 10px 0 5px; }
        .new-rank-desc { font-size: 12px; color: #8ABBA6; font-weight: bold; font-style: italic; }

        .timer-circle { width: 130px; height: 130px; background: white; margin: 15px auto; border-radius: 50%; border: 6px solid #98FFD9; display: flex; align-items: center; justify-content: center; flex-direction: column; }
        .time-val { font-size: 45px; font-weight: 900; color: #2D5A47; }
        .reward-box { background: #FFF9CC; padding: 15px; border-radius: 20px; border: 3px solid #FFD93D; margin-bottom: 15px; }
        .reward-val { display: block; font-size: 40px; font-weight: 900; color: #B38F00; }
        
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .sparkles { position: absolute; inset: 0; pointer-events: none; }
        .sparkle { position: absolute; font-size: 16px; animation: bounce 4s infinite ease-in-out; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .back-link { background: none; border: none; color: #8ABBA6; font-size: 12px; text-decoration: underline; margin-top: 10px; cursor: pointer; width: 100%; }
      `}</style>
    </main>
  );
}
