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

// 称号と必要時間のマスターデータ (単位: 時間)
const RANK_MASTER = [
  { lv: 1,  h: 0,   name: "見習い探検家", desc: "まずは記録をつける習慣から！" },
  { lv: 2,  h: 10,  name: "基礎固めの門下生", desc: "基礎が少しずつ固まってきた証" },
  { lv: 3,  h: 30,  name: "論理の初段", desc: "思考のエンジンがかかり始める" },
  { lv: 4,  h: 60,  name: "適性検査の挑戦者", desc: "複雑な問題にも立ち向かう勇者" },
  { lv: 5,  h: 100, name: "集中力の達人", desc: "【半分経過】勉強が日常になった証" },
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
  
  // 累計時間を分単位で保持（本来はDBから取得）
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  // 累計分から現在のLv、称号、次のLvへの進捗率を計算
  const getLevelInfo = (totalMin: number) => {
    const totalHours = totalMin / 60;
    
    // 現在のレベルを特定（必要時間を超えている一番高いLvを探す）
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
      
      // ステータス更新
      setTotalMinutes(prev => prev + elapsed);
      setTotalPoints(prev => prev + (res.points || 0));
      setCombo(res.combo || 0);
      
      setMode("RESULT");
    }
    setIsSaving(false);
  };

  return (
    <main className="main-container">
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
              <div className="exp-bar-bg">
                <div className="exp-bar-fill" style={{ width: `${levelInfo.progress}%` }}></div>
              </div>
              <div className="exp-text">{levelInfo.remainingText}</div>
            </div>
          </div>
          <div className="status-bottom">
            <div className="stat-item"><span className="stat-label">今月のpt</span><span className="stat-value">{totalPoints}</span></div>
            <div className="stat-divider"></div>
            <div className="stat-item"><span className="stat-label">累計時間</span><span className="stat-value">{Math.floor(totalMinutes / 60)} <small>h</small></span></div>
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
                    onClick={() => { setSubject(s.name); const now = Date.now(); setStartTime(now); setMode("TIMER"); localStorage.setItem("currentStudy", JSON.stringify({ subject: s.name, startTime: now })); }}>
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
                <button className="back-link" onClick={() => { if(confirm("やりなおす？")) setMode("SELECT"); }}>← 科目を選びなおす</button>
              </div>
            </div>
          )}

          {mode === "CONFIRM" && (
            <div className="confirm-screen fade-in">
              <h2 className="title">冒険の記録 📝</h2>
              <div className="puni-editor-card">
                <div className="time-input-row">
                  <button className="step-btn" onClick={() => handleTimeChange((elapsed - 5).toString())}>−</button>
                  <div className="input-box">
                    <input type="number" value={elapsed} onChange={(e) => handleTimeChange(e.target.value)} className="time-text-input" />
                    <span className="unit-label">分</span>
                  </div>
                  <button className="step-btn" onClick={() => handleTimeChange((elapsed + 5).toString())}>+</button>
                </div>
                <input type="range" min="0" max="180" value={elapsed} onChange={(e) => setElapsed(parseInt(e.target.value))} className="puni-slider" />
              </div>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="今日の発見や頑張ったこと" className="memo-area" />
              <div className="button-group-v">
                <button className="puni-button-rect save" onClick={handleSave} disabled={isSaving}>冒険をセーブする！ ✨</button>
                <button className="back-link" onClick={() => setMode("TIMER")}>← タイマーにもどる</button>
              </div>
            </div>
          )}

          {mode === "RESULT" && result && (
            <div className="result-screen fade-in text-center">
              <div className="crown">👑</div>
              <h2 className="clear-text">LEVEL UP...!?</h2>
              <p className="desc-text">{levelInfo.desc}</p>
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
        .main-container { min-height: 100vh; background: radial-gradient(circle at top left, #98FFD9 0%, #F0FFF9 100%); padding: 15px; font-family: 'Hiragino Maru Gothic ProN', 'Meiryo', sans-serif; box-sizing: border-box; }
        .content-wrapper { max-width: 400px; margin: 0 auto; }
        .status-card { background: white; border-radius: 25px; border: 4px solid #98FFD9; margin-bottom: 15px; box-shadow: 0 6px 0 #98FFD9; padding: 10px; }
        .status-top { display: flex; align-items: center; gap: 12px; border-bottom: 2px dashed #98FFD9; padding-bottom: 10px; margin-bottom: 8px; }
        .level-badge { width: 42px; height: 42px; background: linear-gradient(135deg, #FFD93D, #FF9F1A); border-radius: 12px; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; color: white; flex-shrink: 0; }
        .rank-name { font-size: 14px; font-weight: 900; color: #2D5A47; }
        .exp-bar-bg { width: 100%; height: 8px; background: #E6FFF4; border-radius: 4px; border: 1px solid #98FFD9; margin: 4px 0; overflow: hidden; }
        .exp-bar-fill { height: 100%; background: linear-gradient(to right, #66ED9A, #00C951); transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .exp-text { font-size: 8px; color: #8ABBA6; font-weight: 900; }
        .status-bottom { display: flex; justify-content: space-around; }
        .stat-item { text-align: center; }
        .stat-label { font-size: 9px; color: #8ABBA6; font-weight: 900; display: block; }
        .stat-value { font-size: 16px; font-weight: 900; color: #2D5A47; }
        .stat-value small { font-size: 10px; }
        .stat-divider { width: 1px; height: 20px; background: #E6FFF4; align-self: center; }

        .game-card { background: rgba(255, 255, 255, 0.95); border-radius: 40px; border: 4px solid white; padding: 20px; box-shadow: 0 15px 35px rgba(152, 255, 217, 0.2); box-sizing: border-box; }
        .title { font-size: 20px; font-weight: 900; text-align: center; color: #2D5A47; margin-bottom: 15px; }
        .subject-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .puni-button { height: 100px; border: none; background: var(--btn-shadow); border-radius: 20px; cursor: pointer; position: relative; width: 100%; }
        .puni-face { position: absolute; inset: 0 0 6px 0; background: var(--btn-color); border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-top: 4px solid rgba(255,255,255,0.3); }
        .puni-button:active .puni-face { transform: translateY(4px); }
        .puni-button .icon { font-size: 34px; }
        .puni-button .name { color: white; font-weight: 900; font-size: 15px; margin-top: 4px; }
        
        .puni-editor-card { background: #F0FFF9; border: 3px solid #98FFD9; border-radius: 20px; padding: 15px; margin-bottom: 12px; }
        .time-input-row { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 15px; }
        .step-btn { width: 40px; height: 40px; background: white; border: 3px solid #98FFD9; border-radius: 50%; font-size: 22px; font-weight: 900; color: #2D5A47; box-shadow: 0 3px 0 #98FFD9; }
        .input-box { display: flex; align-items: baseline; background: white; padding: 5px 15px; border-radius: 15px; border: 2px solid #98FFD9; }
        .time-text-input { width: 60px; border: none; font-size: 36px; font-weight: 900; text-align: center; color: #2D5A47; outline: none; }
        .unit-label { font-size: 14px; font-weight: 900; color: #2D5A47; }
        .puni-slider { -webkit-appearance: none; width: 100%; height: 10px; background: #E6FFF4; border-radius: 5px; outline: none; border: 1px solid #98FFD9; }
        .puni-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 28px; height: 28px; background: #00C951; border: 4px solid white; border-radius: 50%; cursor: pointer; }

        .memo-area { width: 100%; box-sizing: border-box; padding: 12px; border-radius: 15px; border: 3px solid #98FFD9; height: 80px; margin-bottom: 12px; background: white; font-family: inherit; resize: none; font-size: 15px; }
        .puni-button-rect { width: 100%; height: 60px; border: none; border-radius: 30px; font-size: 18px; font-weight: 900; color: white; cursor: pointer; }
        .save { background: #00C951; box-shadow: 0 6px 0 #00A644; }
        .finish { background: #4CC9F0; box-shadow: 0 6px 0 #3A86FF; }
        .next { background: #FFD93D; color: #B38F00; box-shadow: 0 6px 0 #E6B800; }
        .back-link { background: none; border: none; color: #8ABBA6; font-size: 13px; cursor: pointer; margin-top: 8px; text-decoration: underline; font-weight: 900; width: 100%; }

        .timer-circle { width: 150px; height: 150px; background: white; margin: 15px auto; border-radius: 50%; border: 8px solid #98FFD9; display: flex; align-items: center; justify-content: center; flex-direction: column; }
        .time-val { font-size: 50px; font-weight: 900; color: #2D5A47; }
        .reward-box { background: #FFF9CC; padding: 20px; border-radius: 30px; border: 3px solid #FFD93D; margin-bottom: 15px; }
        .reward-val { display: block; font-size: 50px; font-weight: 900; color: #B38F00; }
        .desc-text { font-size: 12px; font-weight: 900; color: #8ABBA6; margin-bottom: 10px; }

        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .sparkles { position: absolute; inset: 0; pointer-events: none; }
        .sparkle { position: absolute; font-size: 16px; animation: bounce 4s infinite ease-in-out; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
      `}</style>
    </main>
  );
}
