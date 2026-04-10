"use client";

import { useState, useEffect } from "react";
import { saveStudyLog } from "@/app/actions/study";

type Mode = "SELECT" | "TIMER" | "CONFIRM" | "RESULT";

const SUBJECTS = [
  { name: "算数", icon: "📐", colors: "from-[#80CAFF] to-[#2B95FF]", glow: "shadow-[0_0_15px_0_rgba(43,149,255,0.5)]" },
  { name: "国語", icon: "📖", colors: "from-[#FF92A5] to-[#FF3B5C]", glow: "shadow-[0_0_15px_0_rgba(255,59,92,0.5)]" },
  { name: "理科", icon: "🧪", colors: "from-[#66ED9A] to-[#00C951]", glow: "shadow-[0_0_15px_0_rgba(0,201,81,0.5)]" },
  { name: "社会", icon: "🗺️", colors: "from-[#FFC978] to-[#FF9F1A]", glow: "shadow-[0_0_15px_0_rgba(255,159,26,0.5)]" },
  { name: "論理", icon: "🧩", colors: "from-[#D699FF] to-[#A33DFF]", glow: "shadow-[0_0_15px_0_rgba(163,61,255,0.5)]" },
  { name: "作文", icon: "✍️", colors: "from-[#FF94E1] to-[#FF33C5]", glow: "shadow-[0_0_15px_0_rgba(255,51,197,0.5)]" },
];

// ぷにぷにボタンの共通クラス
const PUNI_BTN = "transition-all duration-150 active:scale-95 active:translate-y-1";

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
        if (diff >= 180) {
          handleFinish(180);
        } else {
          setElapsed(diff);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, startTime]);

  const handleFinish = (finalMinutes?: number) => {
    setElapsed(finalMinutes !== undefined ? finalMinutes : elapsed);
    setMode("CONFIRM");
    localStorage.removeItem("currentStudy");
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
      setMode("RESULT");
    }
    setIsSaving(false);
  };

  const PageShell = ({ children }: { children: React.ReactNode }) => (
    <main className="min-h-screen bg-[#E6FFF7] font-sans text-[#2D5A47] p-4 pb-12 relative overflow-hidden">
      {/* 背景のキラキラパーティクル */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-4 h-4 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 right-20 w-6 h-6 bg-[#98FFD9] rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-1/3 w-3 h-3 bg-white rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-10 w-5 h-5 bg-[#FFB3BA] rounded-full opacity-50"></div>
      </div>
      
      {/* レベルゲージ（ぷにぷに化） */}
      <div className="max-w-md mx-auto mb-8 pt-4 relative z-10">
        <div className="bg-white/60 backdrop-blur-sm p-3 rounded-full shadow-lg border-2 border-white flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD93D] to-[#FFB200] flex items-center justify-center shadow-md border-2 border-white text-white font-black text-xl">5</div>
          <div className="flex-1">
            <p className="text-xs font-bold text-[#8ABBA6]">ランク：見習い探検家</p>
            <div className="h-3 w-full bg-[#CCFFEF] rounded-full mt-1 shadow-inner relative overflow-hidden border border-[#98FFD9]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#66ED9A] to-[#00C951] w-[45%] rounded-full shadow-[0_0_10px_0_#66ED9A]"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {children}
      </div>
    </main>
  );

  return (
    <PageShell>
      <div className="bg-white/80 backdrop-blur-md rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.05)] border-4 border-white overflow-hidden p-8 transition-all">
        
        {/* --- モード1: 科目選択 --- */}
        {mode === "SELECT" && (
          <div className="space-y-8">
            <h1 className="text-3xl font-black text-center mb-10 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#2D5A47] to-[#00C951]">今日のクエスト</h1>
            <div className="grid grid-cols-2 gap-6">
              {SUBJECTS.map((s) => (
                <button
                  key={s.name}
                  onClick={() => {
                    setSubject(s.name);
                    const now = Date.now();
                    setStartTime(now);
                    setMode("TIMER");
                    localStorage.setItem("currentStudy", JSON.stringify({ subject: s.name, startTime: now }));
                  }}
                  className={`relative ${PUNI_BTN} ${s.glow} group`}
                >
                  {/* ボタン本体（グラデーション＋ぷにぷに質感を出すインナーシャドウ） */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${s.colors} shadow-[inset_0_4px_4px_rgba(255,255,255,0.3),inset_0_-4px_4px_rgba(0,0,0,0.1)]`}></div>
                  {/* コンテンツ */}
                  <div className="relative p-6 flex flex-col items-center gap-3 text-white z-10">
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-md">{s.icon}</span>
                    <span className="font-bold text-lg drop-shadow-sm">{s.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- モード2: タイマー --- */}
        {mode === "TIMER" && (
          <div className="text-center space-y-10">
            <div>
              <span className="inline-block bg-[#FFB3BA] text-white px-5 py-2 rounded-full text-xs font-bold animate-pulse shadow-md border-2 border-white tracking-widest">
                QUESTING...
              </span>
              <h2 className="text-5xl font-black mt-4 tracking-tight">{subject}</h2>
            </div>
            
            {/* 新・ネオンタイマー */}
            <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
              {/* 外側のネオン管のような光 */}
              <div className="absolute inset-0 rounded-full shadow-[0_0_30px_5px_rgba(152,255,217,0.5)] border-4 border-[#98FFD9]"></div>
              {/* 回転するグラデーションリング */}
              <div className="absolute inset-0 rounded-full border-[10px] border-transparent border-t-[#00C951] border-r-[#66ED9A] animate-spin-slow shadow-inner"></div>
              {/* 中央の時間表示 */}
              <div className="text-6xl font-mono font-black text-[#2D5A47] drop-shadow-sm">{elapsed}<span className="text-2xl ml-1 opacity-70">min</span></div>
            </div>

            <p className="text-[#4A7C66] italic text-lg opacity-80 animate-bounce">「全集中！がんばれー！」 🔥</p>

            <button
              onClick={() => handleFinish()}
              className={`w-full ${PUNI_BTN} bg-gradient-to-br from-[#FF92A5] to-[#FF3B5C] shadow-[0_10px_20px_rgba(255,59,92,0.3),inset_0_4px_4px_rgba(255,255,255,0.3)] text-white font-black py-6 rounded-full text-2xl border-2 border-white tracking-wider`}
            >
              クエスト完了！！
            </button>
          </div>
        )}

        {/* --- モード3: 報告 --- */}
        {mode === "CONFIRM" && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-center text-[#2D5A47]">報告の時間 📝</h2>
            <div className="space-y-6">
              {/* ぷるるん時間修正フィールド */}
              <div className="bg-[#CCFFEF] p-6 rounded-[2rem] border-2 border-[#98FFD9] shadow-inner">
                <label className="block text-sm font-bold text-[#4A7C66] mb-3 uppercase tracking-widest text-center">がんばった時間（分）</label>
                <div className="flex items-center justify-center gap-6">
                  <button onClick={() => setElapsed(Math.max(0, elapsed - 5))} className={`${PUNI_BTN} w-14 h-14 bg-white rounded-full border-4 border-[#98FFD9] text-3xl font-black text-[#2D5A47] shadow-md flex items-center justify-center`}>-</button>
                  <span className="text-6xl font-mono font-black px-4 text-[#2D5A47] drop-shadow-sm">{elapsed}</span>
                  <button onClick={() => setElapsed(elapsed + 5)} className={`${PUNI_BTN} w-14 h-14 bg-white rounded-full border-4 border-[#98FFD9] text-3xl font-black text-[#2D5A47] shadow-md flex items-center justify-center`}>+</button>
                </div>
              </div>
              <textarea 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="どんな冒険（勉強）をしたかな？"
                className="w-full p-6 rounded-[2rem] border-2 border-[#98FFD9] bg-white focus:outline-none focus:ring-4 focus:ring-[#98FFD9]/30 h-36 placeholder:text-[#A0C4B4] shadow-inner text-lg"
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full ${PUNI_BTN} bg-gradient-to-br from-[#66ED9A] to-[#00C951] shadow-[0_10px_20px_rgba(0,201,81,0.3),inset_0_4px_4px_rgba(255,255,255,0.3)] text-white font-black py-6 rounded-full text-2xl border-2 border-whiteTracking-wider disabled:opacity-50`}
              >
                {isSaving ? "レポート送信中..." : "セーブして完了！ ✨"}
              </button>
            </div>
          </div>
        )}

        {/* --- モード4: クリア演出 --- */}
        {mode === "RESULT" && result && (
          <div className="p-4 text-center animate-in zoom-in duration-500 space-y-8">
            <div className="text-8xl animate-bounce">👑</div>
            <h2 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFD93D] to-[#FF9F1A] drop-shadow-sm">QUEST CLEAR!</h2>
            
            {/* リワードカード（さらにぷるるん） */}
            <div className="bg-gradient-to-br from-[#FFFDE6] to-[#FFF9CC] p-10 rounded-[3rem] border-4 border-[#FFD93D] relative shadow-[0_15px_30px_rgba(255,217,61,0.2)]">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#FFD93D] text-white px-6 py-2 rounded-full text-sm font-bold shadow-md border-2 border-white tracking-widest">REWARD</div>
              <div className="text-7xl font-black text-[#B38F00] mb-2 drop-shadow-sm">+{result.points}</div>
              <div className="text-lg font-bold text-[#B38F00] tracking-wider">STUDY POINTS</div>
            </div>

            <div className="flex items-center justify-center gap-3 text-[#FF3B5C] bg-[#FFE6EA] inline-block px-6 py-2 rounded-full font-bold shadow-sm border border-[#FF92A5]">
              <span>🔥</span>
              <span>{result.combo}日連続コンボ中！</span>
            </div>

            <button
              onClick={() => setMode("SELECT")}
              className={`w-full ${PUNI_BTN} bg-gradient-to-br from-[#2D5A47] to-[#4A7C66] shadow-[0_10px_20px_rgba(45,90,71,0.3),inset_0_4px_4px_rgba(255,255,255,0.2)] text-white font-black py-6 rounded-full text-2xl border-2 border-white tracking-wider`}
            >
              次のクエストへ 🚀
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </PageShell>
  );
}
