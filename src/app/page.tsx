"use client";

import { useState, useEffect } from "react";
import { saveStudyLog, getUserStats, saveStudyLogAndStats } from "@/app/actions/study";

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
  { lv: 1,  h: 0,   name: "見習い探検家" },
  { lv: 2,  h: 10,  name: "基礎固めの門下生" },
  { lv: 3,  h: 30,  name: "論理の初段" },
  { lv: 4,  h: 60,  name: "適性検査の挑戦者" },
  { lv: 5,  h: 100, name: "集中力の達人" },
  { lv: 6,  h: 150, name: "開成チャレンジャー" },
  { lv: 7,  h: 210, name: "思考の魔術師" },
  { lv: 8,  h: 280, name: "記述の鉄人" },
  { lv: 9,  h: 360, name: "論理の賢者" },
  { lv: 10, h: 450, name: "絶対合格の守護神" },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("SELECT");
  const [subject, setSubject] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [memo, setMemo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalMoney, setTotalMoney] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const userId = "daughter_01";

  // ★単価設定: Lv1-3: 0.4円, Lv4-7: 0.5円, Lv8-10: 0.6円 に修正
  const getRate = (lv: number) => (lv >= 8 ? 0.6 : lv >= 4 ? 0.5 : 0.4);

  useEffect(() => {
    async function loadData() {
      const stats = await getUserStats(userId);
      setTotalMinutes(stats.totalMinutes || 0);
      setTotalPoints(stats.totalPoints || 0);
      setTotalMoney(stats.totalMoney || 0);
      setCombo(stats.combo || 0);
      const stored = localStorage.getItem("currentStudy");
      if (stored) {
        const { subject, startTime } = JSON.parse(stored);
        setSubject(subject);
        setStartTime(startTime);
        setMode("TIMER");
      }
      setIsInitialized(true);
    }
    loadData();
  }, []);

  const getLevelInfo = (min: number) => {
    const hours = min / 60;
    const currentRankIdx = RANK_MASTER.slice().reverse().findIndex(r => hours >= r.h);
    const currentRank = RANK_MASTER[RANK_MASTER.length - 1 - (currentRankIdx === -1 ? 0 : currentRankIdx)];
    const nextRank = RANK_MASTER.find(r => r.lv === currentRank.lv + 1);
    let progress = 100;
    let remainingText = "MAX LEVEL";
    if (nextRank) {
      const currentLvMin = currentRank.h * 60;
      const nextLvMin = nextRank.h * 60;
      progress = Math.min(100, ((min - currentLvMin) / (nextLvMin - currentLvMin)) * 100);
      remainingText = `あと ${nextLvMin - min} 分で Lv.${nextRank.lv}`;
    }
    return { ...currentRank, progress, remainingText };
  };

  const levelInfo = getLevelInfo(totalMinutes);
  const currentRate = getRate(levelInfo.lv);
  const [result, setResult] = useState<{points: number, money: number, leveledUp: boolean, isBonus: boolean, rateUp: boolean} | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === "TIMER" && startTime) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000 / 60);
        setElapsed(Math.min(180, diff));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, startTime]);

  const handleSave = async () => {
    setIsSaving(true);
    const original = startTime ? Math.floor((Date.now() - startTime) / 1000 / 60) : elapsed;
    
    // 1. 個別のログ保存 (バックエンドで自動的に単価・金額・unpaidフラグが処理される)
    const res = await saveStudyLog({ userId, subject, duration: elapsed, originalDuration: original, isEdited: elapsed !== original, memo });

    if (res.success) {
      const oldLevel = levelInfo.lv;
      const addedPoints = res.points || 0;
      const earnedMoney = res.earnedMoney || 0; // ★バックエンドで計算された金額を使用

      const newTotalMin = totalMinutes + elapsed;
      const newLevel = getLevelInfo(newTotalMin).lv;

      const newTotalPoints = totalPoints + addedPoints;
      const newTotalMoney = totalMoney + earnedMoney;
      const newCombo = res.newCombo || 0;

      // 2. 累計ステータスの更新
      await saveStudyLogAndStats({ userId, totalMinutes: newTotalMin, totalPoints: newTotalPoints, totalMoney: newTotalMoney, combo: newCombo });

      setResult({ 
        points: addedPoints, 
        money: earnedMoney, 
        leveledUp: newLevel > oldLevel,
        isBonus: !!res.isBonus,
        rateUp: (newLevel >= 4 && oldLevel < 4) || (newLevel >= 8 && oldLevel < 8)
      });

      setTotalMinutes(newTotalMin);
      setTotalPoints(newTotalPoints);
      setTotalMoney(newTotalMoney);
      setCombo(newCombo);
      setMode("RESULT");
      localStorage.removeItem("currentStudy");
    }
    setIsSaving(false);
  };

  if (!isInitialized) return <div className="loading">冒険の書を読み込み中...</div>;

  return (
    <main className="main-container">
      <div className="content-wrapper">
        <div className="status-card">
          <div className="status-main">
            <div className="level-section">
              <div className="level-badge-large">
                <span className="lv-label">Lv</span>
                <span className="lv-num">{levelInfo.lv}</span>
              </div>
            </div>
            <div className="rank-section">
              <div className="rank-name-large">{levelInfo.name}</div>
              <div className="exp-container">
                <div className="exp-bar-giant">
                  <div className="exp-bar-fill-shiny" style={{ width: `${levelInfo.progress}%` }}><div className="exp-light"></div></div>
                </div>
                <div className="exp-text-bold">{levelInfo.remainingText}</div>
              </div>
            </div>
          </div>
          <div className="status-bottom">
            <div className="stat-item">
              <span className="stat-label">現在のお小遣い単価</span>
              <span className="stat-value-rate">💰 1分 / {currentRate}<small>円</small></span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-label">累計勉強時間</span>
              <span className="stat-value">{Math.floor(totalMinutes / 60)}<small>時間</small>{totalMinutes % 60}<small>分</small></span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-label">連続コンボ</span>
              <span className="stat-value">🔥 {combo}<small>日連続</small></span>
            </div>
          </div>
          <div className="total-money-bar">
            <span className="label">今月のおこづかい（未せいさん）：</span>
            <span className="val">{Math.floor(totalMoney)}<small>円</small></span>
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
              <button className="puni-button-rect finish" onClick={() => setMode("CONFIRM")}>冒険を切り上げる 🏁</button>
              <button className="back-link" onClick={() => { if(confirm("選びなおす？")) setMode("SELECT"); }}>← 科目を選びなおす</button>
            </div>
          )}

          {mode === "CONFIRM" && (
            <div className="confirm-screen fade-in">
              <h2 className="title">冒険の記録 📝</h2>
              <div className="puni-editor-card">
                <div className="time-display-center">
                  <input type="number" value={elapsed} onChange={(e) => setElapsed(Math.min(180, parseInt(e.target.value) || 0))} className="time-text-input" />
                  <span className="unit-label">分</span>
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
                  <div className="lvl-up-stars">✨🎊✨</div>
                  <h2 className="lvl-up-title">LEVEL UP!!</h2>
                  <div className="new-rank-name">{levelInfo.name}</div>
                  {result.rateUp && (
                    <div className="rate-up-badge">
                      お小遣い単価が <span>{getRate(levelInfo.lv)}円</span> にUPしたよ！
                    </div>
                  )}
                  <div className="confetti-container">
                    {[...Array(10)].map((_, i) => <div key={i} className="confetti"></div>)}
                  </div>
                </div>
              ) : (
                <div className="clear-header">
                  <h2 className="clear-text">QUEST CLEAR!</h2>
                  {result.isBonus && (
                    <div className="bonus-badge">🔥 {combo}日連続！コンボボーナス発動(1.25倍) 🔥</div>
                  )}
                </div>
              )}
              <div className="reward-container">
                <div className="reward-box point"><span className="reward-label">獲得ポイント</span><span className="reward-val">+{result.points}</span></div>
                <div className="reward-box money"><span className="reward-label">今回のお小遣い</span><span className="reward-val">+{result.money}<small>円</small></span></div>
              </div>
              <button className="puni-button-rect next" onClick={() => { setMemo(""); setMode("SELECT"); }}>次の冒険へ 🚀</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .main-container { min-height: 100vh; background: radial-gradient(circle at top left, #98FFD9 0%, #F0FFF9 100%); padding: 15px; font-family: sans-serif; box-sizing: border-box; }
        .content-wrapper { max-width: 400px; margin: 0 auto; }
        
        .status-card { background: white; border-radius: 30px; border: 5px solid #98FFD9; margin-bottom: 20px; padding: 15px; box-shadow: 0 8px 0 #98FFD9; }
        .status-main { display: flex; align-items: center; gap: 15px; padding-bottom: 12px; border-bottom: 3px dashed #F0FFF9; margin-bottom: 12px; }
        .level-badge-large { width: 65px; height: 65px; background: linear-gradient(135deg, #FFD93D, #FF9F1A); border-radius: 18px; border: 4px solid white; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(255, 159, 26, 0.4); flex-shrink: 0; }
        .lv-num { font-size: 32px; font-weight: 900; color: white; line-height: 1; }
        .lv-label { font-size: 12px; font-weight: 900; color: rgba(255,255,255,0.8); }
        .rank-name-large { font-size: 18px; font-weight: 900; color: #2D5A47; margin-bottom: 6px; }
        .exp-bar-giant { width: 100%; height: 16px; background: #E6FFF4; border-radius: 10px; border: 2px solid #98FFD9; overflow: hidden; position: relative; }
        .exp-bar-fill-shiny { height: 100%; background: linear-gradient(90deg, #66ED9A, #00C951); transition: width 1s ease-in-out; }
        .exp-text-bold { font-size: 10px; color: #8ABBA6; font-weight: 900; margin-top: 4px; text-align: right; }
        
        .status-bottom { display: flex; justify-content: space-around; text-align: center; margin-bottom: 10px; }
        .stat-item { flex: 1; }
        .stat-label { font-size: 8px; color: #8ABBA6; font-weight: 900; display: block; white-space: nowrap; margin-bottom: 2px; }
        .stat-value { font-size: 13px; font-weight: 900; color: #2D5A47; white-space: nowrap; }
        .stat-value-rate { font-size: 13px; font-weight: 900; color: #FB8500; white-space: nowrap; }
        .stat-value small { font-size: 8px; margin-left: 1px; }
        .stat-divider { width: 2px; height: 18px; background: #F0FFF9; align-self: center; margin: 0 5px; }

        .total-money-bar { background: #FFF0F3; border-radius: 15px; padding: 8px 15px; display: flex; justify-content: space-between; align-items: center; border: 2px solid #FFCCD5; }
        .total-money-bar .label { font-size: 11px; font-weight: 900; color: #FF4D6D; }
        .total-money-bar .val { font-size: 18px; font-weight: 900; color: #FF4D6D; }
        .total-money-bar .val small { font-size: 10px; margin-left: 2px; }

        .game-card { background: rgba(255, 255, 255, 0.95); border-radius: 35px; border: 4px solid white; padding: 25px; box-shadow: 0 10px 25px rgba(152, 255, 217, 0.2); }
        .title { font-size: 18px; font-weight: 900; text-align: center; color: #2D5A47; margin-bottom: 15px; }
        .subject-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .puni-button { height: 90px; border: none; background: var(--btn-shadow); border-radius: 20px; position: relative; cursor: pointer; }
        .puni-face { position: absolute; inset: 0 0 5px 0; background: var(--btn-color); border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .puni-button:active .puni-face { transform: translateY(3px); }
        .puni-button .icon { font-size: 30px; }
        .puni-button .name { color: white; font-weight: 900; font-size: 14px; }

        .puni-editor-card { background: #F0FFF9; border: 3px solid #98FFD9; border-radius: 25px; padding: 15px; margin-bottom: 15px; display: flex; flex-direction: column; align-items: center; }
        .time-display-center { display: flex; align-items: baseline; justify-content: center; gap: 4px; width: 100%; margin-bottom: 10px; }
        .time-text-input { width: 80px; background: transparent; border: none; font-size: 40px; font-weight: 900; text-align: center; color: #2D5A47; outline: none; border-bottom: 3px solid #98FFD9; }
        .unit-label { font-size: 18px; font-weight: 900; color: #2D5A47; }
        .puni-slider { -webkit-appearance: none; width: 100%; height: 10px; background: white; border-radius: 5px; border: 2px solid #98FFD9; }
        .puni-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; background: #00C951; border: 3px solid white; border-radius: 50%; }

        .memo-area { width: 100%; box-sizing: border-box; padding: 12px; border-radius: 15px; border: 3px solid #98FFD9; height: 70px; margin-bottom: 15px; font-size: 15px; resize: none; }
        .puni-button-rect { width: 100%; height: 60px; border: none; border-radius: 30px; font-size: 18px; font-weight: 900; color: white; cursor: pointer; }
        .save { background: #00C951; box-shadow: 0 5px 0 #00A644; }
        .finish { background: #4CC9F0; box-shadow: 0 5px 0 #3A86FF; margin-bottom: 15px; }
        .next { background: #FFD93D; color: #B38F00; box-shadow: 0 5px 0 #E6B800; }

        .reward-container { display: flex; gap: 10px; margin-bottom: 15px; }
        .reward-box { flex: 1; padding: 12px; border-radius: 20px; border: 3px solid; text-align: center; }
        .reward-box.point { background: #FFF9CC; border-color: #FFD93D; }
        .reward-box.money { background: #E6FFF4; border-color: #98FFD9; }
        .reward-val { font-size: 24px; font-weight: 900; color: #2D5A47; }
        .reward-label { font-size: 10px; font-weight: 900; color: #2D5A47; opacity: 0.7; display: block; margin-bottom: 5px; white-space: nowrap; }
        
        .levelup-announcement { animation: bounceIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275); margin-bottom: 20px; position: relative; }
        .lvl-up-stars { font-size: 24px; margin-bottom: 5px; }
        .lvl-up-title { 
          font-size: 38px; 
          font-weight: 900; 
          margin: 0;
          background: linear-gradient(to bottom, #FF4D6D, #FFB703);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(2px 2px 0 white);
          animation: rainbow 2s infinite linear;
        }
        .new-rank-name { font-size: 20px; font-weight: 900; color: #2D5A47; margin-top: 5px; }
        .rate-up-badge { 
          background: #FFF0F3; 
          border: 2px solid #FF4D6D; 
          color: #FF4D6D; 
          padding: 8px 15px; 
          border-radius: 20px; 
          font-weight: 900; 
          display: inline-block; 
          margin-top: 10px; 
          font-size: 14px;
        }
        .rate-up-badge span { font-size: 18px; text-decoration: underline; }

        .bonus-badge {
          background: linear-gradient(90deg, #FF4D6D, #FFB703);
          color: white;
          font-size: 12px;
          font-weight: 900;
          padding: 5px 15px;
          border-radius: 15px;
          display: inline-block;
          margin-bottom: 10px;
          animation: pulse 1s infinite;
        }

        .timer-circle { width: 140px; height: 140px; background: white; margin: 15px auto; border-radius: 50%; border: 6px solid #98FFD9; display: flex; align-items: center; justify-content: center; }
        .time-val { font-size: 48px; font-weight: 900; color: #2D5A47; }
        
        @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes rainbow { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .back-link { background: none; border: none; color: #8ABBA6; font-size: 13px; text-decoration: underline; width: 100%; font-weight: 900; cursor: pointer; }
        .loading { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-weight: 900; color: #2D5A47; }
        .text-center { text-align: center; }
      `}</style>
    </main>
  );
}
