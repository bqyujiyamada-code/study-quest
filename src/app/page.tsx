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
  
  // 累計ステータス
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalMoney, setTotalMoney] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const userId = "daughter_01"; // ユーザーID

  // 1. 初回ロード（DynamoDBから取得）
  useEffect(() => {
    async function loadInitialData() {
      const stats = await getUserStats(userId);
      setTotalMinutes(stats.totalMinutes || 0);
      setTotalPoints(stats.totalPoints || 0);
      setTotalMoney(stats.totalMoney || 0);
      setCombo(stats.combo || 0);
      
      // タイマーだけはブラウザのセッション情報なのでLocalStorageで管理
      const storedTimer = localStorage.getItem("currentStudy");
      if (storedTimer) {
        const { subject, startTime } = JSON.parse(storedTimer);
        setSubject(subject);
        setStartTime(startTime);
        setMode("TIMER");
      }
      setIsInitialized(true);
    }
    loadInitialData();
  }, []);

  // 2. レベル・称号の計算
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

  // 3. お小遣いレート
  const getRate = (lv: number) => {
    if (lv >= 8) return 0.6;
    if (lv >= 4) return 0.5;
    return 0.4;
  };

  const levelInfo = getLevelInfo(totalMinutes);
  const [result, setResult] = useState<{points: number, money: number, leveledUp: boolean} | null>(null);

  // 4. タイマー更新
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === "TIMER" && startTime) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000 / 60);
        setElapsed(diff >= 180 ? 180 : diff);
      }, 1000);
    }
    return () => { if(interval) clearInterval(interval); };
  }, [mode, startTime]);

  // 5. 保存処理（ログ保存 + DynamoDBステータス更新）
  const handleSave = async () => {
    setIsSaving(true);
    const original = startTime ? Math.floor((Date.now() - startTime) / 1000 / 60) : elapsed;
    
    const res = await saveStudyLog({
      userId, subject, duration: elapsed, originalDuration: original, isEdited: elapsed !== original, memo
    });

    if (res.success) {
      const oldLevel = levelInfo.lv;
      const addedPoints = res.points || 0;
      const earnedMoney = Math.floor(addedPoints * getRate(oldLevel));
      
      const newTotalMin = totalMinutes + elapsed;
      const newTotalPoints = totalPoints + addedPoints;
      const newTotalMoney = totalMoney + earnedMoney;
      const newCombo = res.combo || 0;

      // DynamoDBのユーザーステータスを更新
      await saveStudyLogAndStats({
        userId,
        totalMinutes: newTotalMin,
        totalPoints: newTotalPoints,
        totalMoney: newTotalMoney,
        combo: newCombo
      });

      setResult({ points: addedPoints, money: earnedMoney, leveledUp: getLevelInfo(newTotalMin).lv > oldLevel });
      setTotalMinutes(newTotalMin);
      setTotalPoints(newTotalPoints);
      setTotalMoney(newTotalMoney);
      setCombo(newCombo);
      setMode("RESULT");
      localStorage.removeItem("currentStudy");
    }
    setIsSaving(false);
  };

  if (!isInitialized) return <div className="loading">ロード中...</div>;

  return (
    <main className="main-container">
      <div className="sparkles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="sparkle" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` } as any}>✨</div>
        ))}
      </div>

      <div className="content-wrapper">
        {/* RPG風ヘッダー */}
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
                  <div className="exp-bar-fill-shiny" style={{ width: `${levelInfo.progress}%` }}>
                    <div className="exp-light"></div>
                  </div>
                </div>
                <div className="exp-text-bold">{levelInfo.remainingText}</div>
              </div>
            </div>
          </div>
          <div className="status-bottom">
            <div className="stat-item"><span className="stat-label">貯まったお小遣い</span><span className="stat-value-money">{Math.floor(totalMoney)}<small>円</small></span></div>
            <div className="stat-divider"></div>
            <div className="stat-item"><span className="stat-label">累計時間</span><span className="stat-value">{Math.floor(totalMinutes / 60)}<small>h</small>{totalMinutes % 60}<small>m</small></span></div>
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
                    <input type="number" value={elapsed} onChange={(e) => setElapsed(Math.min(180, parseInt(e.target.value) || 0))} className="time-text-input" />
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
                  <div className="new-rank-name">{levelInfo.name}</div>
                  <p className="rate-up-text">お小遣い単価が {getRate(levelInfo.lv)}円 にUP！</p>
                </div>
              ) : (
                <div className="clear-header">
                  <div className="crown">👑</div>
                  <h2 className="clear-text">QUEST CLEAR!</h2>
                </div>
              )}
              <div className="reward-container">
                <div className="reward-box point">
                  <span className="reward-label">獲得ポイント</span>
                  <span className="reward-val">+{result.points}</span>
                </div>
                <div className="reward-box money">
                  <span className="reward-label">今回のお小遣い</span>
                  <span className="reward-val">+{result.money}<small>円</small></span>
                </div>
              </div>
              <button className="puni-button-rect next" onClick={() => { setMemo(""); setMode("SELECT"); }}>次の冒険へ 🚀</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .main-container { min-height: 100vh; background: radial-gradient(circle at top left, #98FFD9 0%, #F0FFF9 100%); padding: 15px; font-family: sans-serif; box-sizing: border-box; overflow-x: hidden; position: relative; }
        .loading { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-weight: 900; color: #2D5A47; }
        .content-wrapper { max-width: 400px; margin: 0 auto; position: relative; z-index: 2; }
        
        .status-card { background: white; border-radius: 30px; border: 5px solid #98FFD9; margin-bottom: 20px; padding: 15px; box-shadow: 0 8px 0 #98FFD9; }
        .status-main { display: flex; align-items: center; gap: 15px; padding-bottom: 15px; border-bottom: 3px dashed #F0FFF9; margin-bottom: 12px; }
        .level-badge-large { width: 65px; height: 65px; background: linear-gradient(135deg, #FFD93D, #FF9F1A); border-radius: 18px; border: 4px solid white; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(255, 159, 26, 0.4); flex-shrink: 0; }
        .lv-label { font-size: 12px; font-weight: 900; color: rgba(255,255,255,0.8); line-height: 1; }
        .lv-num { font-size: 32px; font-weight: 900; color: white; line-height: 1; }
        .rank-name-large { font-size: 20px; font-weight: 900; color: #2D5A47; margin-bottom: 8px; }
        .exp-bar-giant { width: 100%; height: 18px; background: #E6FFF4; border-radius: 10px; border: 2px solid #98FFD9; overflow: hidden; position: relative; }
        .exp-bar-fill-shiny { height: 100%; background: linear-gradient(90deg, #66ED9A, #00C951); transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1); position: relative; }
        .exp-light { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%); }
        .exp-text-bold { font-size: 10px; color: #8ABBA6; font-weight: 900; margin-top: 5px; text-align: right; }
        .stat-value-money { font-size: 20px; font-weight: 900; color: #FF4D6D; }
        .stat-value-money small { font-size: 12px; }
        .status-bottom { display: flex; justify-content: space-around; text-align: center; }
        .stat-label { font-size: 9px; color: #8ABBA6; font-weight: 900; display: block; }
        .stat-value { font-size: 16px; font-weight: 900; color: #2D5A47; }
        .stat-divider { width: 2px; height: 20px; background: #F0FFF9; align-self: center; }

        .game-card { background: rgba(255, 255, 255, 0.95); border-radius: 35px; border: 4px solid white; padding: 25px; box-shadow: 0 15px 35px rgba(152, 255, 217, 0.2); }
        .title { font-size: 20px; font-weight: 900; text-align: center; color: #2D5A47; margin-bottom: 20px; }
        .subject-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .puni-button { height: 100px; border: none; background: var(--btn-shadow); border-radius: 20px; position: relative; cursor: pointer; }
        .puni-face { position: absolute; inset: 0 0 6px 0; background: var(--btn-color); border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-top: 4px solid rgba(255,255,255,0.3); }
        .puni-button:active .puni-face { transform: translateY(4px); }
        .puni-button .icon { font-size: 36px; }
        .puni-button .name { color: white; font-weight: 900; font-size: 16px; margin-top: 4px; }

        .input-box { display: flex; align-items: baseline; background: white; padding: 5px 15px; border-radius: 18px; border: 3px solid #98FFD9; min-width: 110px; justify-content: center; }
        .time-text-input { width: 95px; border: none; font-size: 42px; font-weight: 900; text-align: center; color: #2D5A47; outline: none; }
        .unit-label { font-size: 16px; font-weight: 900; color: #2D5A47; }
        .puni-editor-card { background: #F0FFF9; border: 3px solid #98FFD9; border-radius: 25px; padding: 20px; margin-bottom: 15px; }
        .time-input-row { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 15px; }
        .step-btn { width: 45px; height: 45px; background: white; border: 3px solid #98FFD9; border-radius: 50%; font-size: 24px; font-weight: 900; color: #2D5A47; box-shadow: 0 4px 0 #98FFD9; }
        .puni-slider { -webkit-appearance: none; width: 100%; height: 12px; background: #E6FFF4; border-radius: 6px; outline: none; border: 2px solid #98FFD9; }
        .puni-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 32px; height: 32px; background: #00C951; border: 4px solid white; border-radius: 50%; }

        .memo-area { width: 100%; box-sizing: border-box; padding: 15px; border-radius: 20px; border: 3px solid #98FFD9; height: 80px; margin-bottom: 15px; resize: none; font-family: inherit; font-size: 16px; }
        .puni-button-rect { width: 100%; height: 65px; border: none; border-radius: 35px; font-size: 20px; font-weight: 900; color: white; cursor: pointer; }
        .save { background: #00C951; box-shadow: 0 6px 0 #00A644; }
        .finish { background: #4CC9F0; box-shadow: 0 6px 0 #3A86FF; }
        .next { background: #FFD93D; color: #B38F00; box-shadow: 0 6px 0 #E6B800; }

        .reward-container { display: flex; gap: 12px; margin-bottom: 20px; }
        .reward-box { flex: 1; padding: 18px; border-radius: 25px; border: 3px solid; text-align: center; }
        .reward-box.point { background: #FFF9CC; border-color: #FFD93D; }
        .reward-box.money { background: #E6FFF4; border-color: #98FFD9; }
        .reward-label { font-size: 11px; font-weight: 900; color: #2D5A47; opacity: 0.7; display: block; margin-bottom: 5px; }
        .reward-val { font-size: 32px; font-weight: 900; color: #2D5A47; }
        .reward-val small { font-size: 14px; }
        
        .levelup-announcement { animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); margin-bottom: 20px; }
        .lvl-up-title { font-size: 32px; font-weight: 900; color: #FF4D6D; text-shadow: 2px 2px 0 white; margin: 0; }
        .rate-up-text { color: #FF4D6D; font-weight: 900; font-size: 15px; margin-top: 8px; }
        .timer-circle { width: 160px; height: 160px; background: white; margin: 20px auto; border-radius: 50%; border: 8px solid #98FFD9; display: flex; align-items: center; justify-content: center; flex-direction: column; }
        .time-val { font-size: 55px; font-weight: 900; color: #2D5A47; }
        .text-center { text-align: center; }

        @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .sparkles { position: absolute; inset: 0; pointer-events: none; }
        .sparkle { position: absolute; font-size: 18px; animation: bounce 4s infinite ease-in-out; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .back-link { background: none; border: none; color: #8ABBA6; font-size: 14px; text-decoration: underline; margin-top: 15px; cursor: pointer; width: 100%; font-weight: 900; }
      `}</style>
    </main>
  );
}
