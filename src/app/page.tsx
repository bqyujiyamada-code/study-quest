"use client";

import { useState, useEffect } from "react";
import { saveStudyLog } from "@/app/actions/study";

type Mode = "SELECT" | "TIMER" | "CONFIRM" | "RESULT";

const SUBJECTS = [
  { name: "算数", icon: "📐", colors: "from-[#00A3FF] to-[#0066FF]", glow: "shadow-[0_0_20px_rgba(0,163,255,0.4)]" },
  { name: "国語", icon: "📖", colors: "from-[#FF5E7E] to-[#FF2E55]", glow: "shadow-[0_0_20px_rgba(255,94,126,0.4)]" },
  { name: "理科", icon: "🧪", colors: "from-[#00F5A0] to-[#00D9F5]", glow: "shadow-[0_0_20px_rgba(0,245,160,0.4)]" },
  { name: "社会", icon: "🗺️", colors: "from-[#FFB347] to-[#FF8C00]", glow: "shadow-[0_0_20px_rgba(255,179,71,0.4)]" },
  { name: "論理", icon: "🧩", colors: "from-[#BF5AF2] to-[#AF52DE]", glow: "shadow-[0_0_20px_rgba(191,90,242,0.4)]" },
  { name: "作文", icon: "✍️", colors: "from-[#FF9FED] to-[#FF4DFF]", glow: "shadow-[0_0_20px_rgba(255,159,237,0.4)]" },
];

const PUNI_BTN = "transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] active:scale-90 active:translate-y-1";

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

  return (
    <main className="min-h-screen bg-[#0A0F1E] font-sans text-white p-4 pb-12 relative overflow-hidden">
      {/* キラキラ背景粒子 */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-blue-400 opacity-20 animate-pulse" style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`
          }} />
        ))}
      </div>

      <div className="max-w-md mx-auto relative z-10">
        {/* レベルバー */}
        <div className="bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/10 mb-8 flex items-center gap-4 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFD93D] to-[#FF8C00] flex items-center justify-center font-black text-2xl shadow-[0_0_15px_rgba(255,217,61,0.5)] border-2 border-white/20">5</div>
          <div className="flex-1">
            <div className="flex justify-between text-xs font-black mb-1 px-1">
              <span className="text-blue-300">見習い探検家</span>
              <span className="text-white/40">EXP 45%</span>
            </div>
            <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] w-[45%] shadow-[0_0_10px_#00F5A0]"></div>
            </div>
          </div>
        </div>

        {/* メインカード */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.5)] p-8">
          
          {mode === "SELECT" && (
            <div className="space-y-8 text-center">
              <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-blue-200">今日のクエスト</h1>
              <div className="grid grid-cols-2 gap-5">
                {SUBJECTS.map((s) => (
                  <button key={s.name} onClick={() => {
                    setSubject(s.name);
                    const now = Date.now();
                    setStartTime(now);
                    setMode("TIMER");
                    localStorage.setItem("currentStudy", JSON.stringify({ subject: s.name, startTime: now }));
                  }} className={`relative ${PUNI_BTN} ${s.glow} group`}>
                    <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${s.colors} shadow-[inset_0_4px_6px_rgba(255,255,255,0.4),inset_0_-4px_6px_rgba(0,0,0,0.3)]`}></div>
                    <div className="relative p-6 flex flex-col items-center gap-2 z-10">
                      <span className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform">{s.icon}</span>
                      <span className="font-black tracking-wider">{s.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "TIMER" && (
            <div className="text-center space-y-12 py-4">
              <div className="animate-bounce inline-block bg-blue-500 text-[10px] font-black px-4 py-1 rounded-full border border-white shadow-lg">QUEST IN PROGRESS</div>
              <h2 className="text-6xl font-black">{subject}</h2>
              <div className="relative w-60 h-60 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[12px] border-white/5 shadow-inner"></div>
                <div className="absolute inset-0 rounded-full border-[12px] border-transparent border-t-blue-400 animate-spin-slow"></div>
                <div className="text-7xl font-mono font-black text-blue-300 drop-shadow-[0_0_20px_rgba(147,197,253,0.5)]">
                  {elapsed}<span className="text-2xl ml-1">min</span>
                </div>
              </div>
              <button onClick={() => handleFinish()} className={`w-full ${PUNI_BTN} bg-gradient-to-br from-[#FF5E7E] to-[#FF2E55] py-6 rounded-full text-2xl font-black border-2 border-white/50 shadow-[0_15px_30px_rgba(255,46,85,0.4),inset_0_4px_6px_rgba(255,255,255,0.3)]`}>
                完了する 🏁
              </button>
            </div>
          )}

          {mode === "CONFIRM" && (
            <div className="space-y-8">
              <h2 className="text-3xl font-black text-center text-blue-200">報告書を作成 📝</h2>
              <div className="bg-black/20 p-6 rounded-[2.5rem] border border-white/10 shadow-inner text-center">
                <p className="text-xs font-black text-blue-400 mb-4 tracking-widest uppercase">がんばった時間</p>
                <div className="flex items-center justify-center gap-6">
                  <button onClick={() => setElapsed(Math.max(0, elapsed - 5))} className={`${PUNI_BTN} w-14 h-14 bg-white/10 rounded-full border-2 border-white/20 text-3xl font-black flex items-center justify-center shadow-lg`}>-</button>
                  <span className="text-6xl font-mono font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{elapsed}</span>
                  <button onClick={() => setElapsed(elapsed + 5)} className={`${PUNI_BTN} w-14 h-14 bg-white/10 rounded-full border-2 border-white/20 text-3xl font-black flex items-center justify-center shadow-lg`}>+</button>
                </div>
              </div>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="今日の内容をメモしよう！" className="w-full bg-black/20 p-6 rounded-[2rem] border border-white/10 h-32 text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-blue-500/20" />
              <button onClick={handleSave} disabled={isSaving} className={`w-full ${PUNI_BTN} bg-gradient-to-br from-[#00F5A0] to-[#00D9F5] py-6 rounded-full text-2xl font-black text-[#004D40] border-2 border-white/50 shadow-[0_15px_30px_rgba(0,245,160,0.4)]`}>
                {isSaving ? "セーブ中..." : "セーブして完了 ✨"}
              </button>
            </div>
          )}

          {mode === "RESULT" && result && (
            <div className="text-center space-y-8 animate-in zoom-in duration-500">
              <div className="text-8xl">👑</div>
              <h2 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-[#FFD93D] to-[#FF8C00]">QUEST CLEAR!</h2>
              <div className="bg-gradient-to-br from-white/5 to-white/0 p-10 rounded-[3.5rem] border-2 border-[#FFD93D] relative shadow-[0_20px_40px_rgba(255,217,61,0.2)]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFD93D] text-black text-[10px] font-black px-6 py-1 rounded-full border border-white">REWARD</div>
                <div className="text-7xl font-black text-[#FFD93D] drop-shadow-[0_0_15px_rgba(255,217,61,0.5)]">+{result.points}</div>
                <div className="text-xs font-black tracking-widest text-white/40 mt-2 uppercase font-mono">Study Points</div>
              </div>
              <div className="inline-flex items-center gap-2 bg-red-500/20 px-6 py-2 rounded-full border border-red-500/50 text-red-400 font-black text-sm">
                <span>🔥</span> {result.combo}日連続コンボ中！
              </div>
              <button onClick={() => setMode("SELECT")} className={`w-full ${PUNI_BTN} bg-white/10 py-6 rounded-full text-2xl font-black border border-white/20 hover:bg-white/20`}>
                次のクエストへ 🚀
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </main>
  );
}
