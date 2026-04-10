"use client";

import { useState, useEffect } from "react";
import { saveStudyLog } from "@/app/actions/study";

type Mode = "SELECT" | "TIMER" | "CONFIRM" | "RESULT";

const SUBJECTS = [
  { name: "算数", icon: "📐", base: "#4CC9F0", shadow: "#3A86FF", text: "#fff" },
  { name: "国語", icon: "📖", base: "#FF4D6D", shadow: "#C9184A", text: "#fff" },
  { name: "理科", icon: "🧪", base: "#72EFDD", shadow: "#208B81", text: "#1A535C" },
  { name: "社会", icon: "🗺️", base: "#FFB703", shadow: "#FB8500", text: "#fff" },
  { name: "論理", icon: "🧩", base: "#B5179E", shadow: "#7209B7", text: "#fff" },
  { name: "作文", icon: "✍️", base: "#FF85A1", shadow: "#FF477E", text: "#fff" },
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
    <main className="min-h-screen bg-[#F0FFF9] bg-[radial-gradient(circle_at_top_left,_#98FFD9_0%,_#F0FFF9_50%)] font-sans p-4 pb-20 select-none overflow-hidden relative text-[#2D5A47]">
      
      {/* 背景のキラキラ演出 */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute text-2xl animate-bounce" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${Math.random() * 3 + 2}s`
          }}>✨</div>
        ))}
      </div>

      <div className="max-w-md mx-auto relative z-10">
        
        {/* ぷるるん・ヘッダー（レベルゲージ） */}
        <div className="bg-white rounded-[2rem] p-4 shadow-[0_8px_20px_rgba(152,255,217,0.5)] border-4 border-[#98FFD9] mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFD93D] to-[#FF9F1A] border-4 border-white shadow-[0_4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center text-2xl font-black text-white italic">5</div>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-tighter text-[#8ABBA6]">Study Rank: 見習い探検家</p>
            <div className="h-5 w-full bg-[#E6FFF4] rounded-full mt-1 border-2 border-[#98FFD9] overflow-hidden relative shadow-inner">
              <div className="h-full bg-gradient-to-r from-[#66ED9A] to-[#00C951] w-[45%] rounded-full shadow-[2px_0_5px_rgba(0,0,0,0.1)]"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* --- メインコンテンツ：モード別 --- */}
        <div className="bg-white/90 backdrop-blur-md rounded-[3rem] border-4 border-white shadow-[0_20px_40px_rgba(152,255,217,0.3)] p-8">
          
          {mode === "SELECT" && (
            <div className="space-y-8">
              <h1 className="text-3xl font-black text-center text-[#2D5A47] tracking-tight">冒険の行き先は？</h1>
              <div className="grid grid-cols-2 gap-5">
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
                    className="group relative transition-all duration-200 active:scale-90"
                    style={{ height: '140px' }}
                  >
                    {/* ぷにぷに立体ボタンの構造 */}
                    <div className="absolute inset-0 rounded-[2.5rem]" style={{ backgroundColor: s.shadow }}></div>
                    <div 
                      className="absolute inset-x-0 top-0 bottom-2 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 border-t-4 border-white/50 shadow-inner group-active:translate-y-1 transition-transform"
                      style={{ backgroundColor: s.base, color: s.text }}
                    >
                      <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform">{s.icon}</span>
                      <span className="font-black text-lg">{s.name}</span>
                      {/* 反射光エフェクト */}
                      <div className="absolute top-2 left-6 right-6 h-4 bg-white/20 rounded-full"></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "TIMER" && (
            <div className="text-center space-y-10 py-4">
              <div className="inline-block bg-[#FFB3BA] text-white px-6 py-2 rounded-full font-black shadow-lg border-2 border-white animate-pulse">
                QUESTING...
              </div>
              <h2 className="text-5xl font-black text-[#2D5A47]">{subject}</h2>
              
              <div className="relative w-56 h-56 mx-auto flex items-center justify-center bg-white rounded-full shadow-[0_10px_30px_rgba(152,255,217,0.5)] border-8 border-[#98FFD9]">
                <div className="absolute inset-2 border-4 border-dashed border-[#98FFD9] rounded-full animate-spin-slow opacity-30"></div>
                <div className="text-7xl font-mono font-black text-[#2D5A47]">
                  {elapsed}<span className="text-2xl ml-1">min</span>
                </div>
              </div>

              <button
                onClick={() => setMode("CONFIRM")}
                className="w-full relative h-20 active:scale-95 transition-all"
              >
                <div className="absolute inset-0 bg-[#E66B74] rounded-full"></div>
                <div className="absolute inset-x-0 top-0 bottom-2 bg-[#FF8B94] rounded-full border-t-4 border-white/40 flex items-center justify-center text-2xl font-black text-white shadow-lg active:translate-y-1 transition-transform">
                  クエスト完了！ 🏁
                </div>
              </button>
            </div>
          )}

          {mode === "CONFIRM" && (
            <div className="space-y-8">
              <h2 className="text-3xl font-black text-center text-[#4A7C66]">報告を書こう！ 📖</h2>
              <div className="bg-[#F0FFF9] p-6 rounded-[2.5rem] border-4 border-[#98FFD9] shadow-inner">
                <p className="text-xs font-black text-[#8ABBA6] mb-4 text-center tracking-widest uppercase italic">Study Time</p>
                <div className="flex items-center justify-center gap-6">
                  <button onClick={() => setElapsed(Math.max(0, elapsed - 5))} className="w-14 h-14 bg-white rounded-full border-4 border-[#98FFD9] text-3xl font-black shadow-md active:scale-90">-</button>
                  <span className="text-6xl font-mono font-black px-4">{elapsed}</span>
                  <button onClick={() => setElapsed(elapsed + 5)} className="w-14 h-14 bg-white rounded-full border-4 border-[#98FFD9] text-3xl font-black shadow-md active:scale-90">+</button>
                </div>
              </div>
              <textarea 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="どんな冒険（勉強）をしたかな？"
                className="w-full p-6 rounded-[2.5rem] border-4 border-[#98FFD9] bg-white h-36 focus:outline-none shadow-inner text-lg placeholder:text-[#A0C4B4]"
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full relative h-20 active:scale-95 transition-all disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-[#00A644] rounded-full"></div>
                <div className="absolute inset-x-0 top-0 bottom-2 bg-[#00C951] rounded-full border-t-4 border-white/40 flex items-center justify-center text-2xl font-black text-white shadow-lg active:translate-y-1 transition-transform">
                  {isSaving ? "セーブ中..." : "セーブして完了！ ✨"}
                </div>
              </button>
            </div>
          )}

          {mode === "RESULT" && result && (
            <div className="text-center space-y-8 animate-in zoom-in duration-500">
              <div className="text-8xl animate-bounce">👑</div>
              <h2 className="text-5xl font-black text-[#FFB200] drop-shadow-md">CLEAR!</h2>
              
              <div className="bg-[#FFF9CC] p-10 rounded-[3.5rem] border-4 border-[#FFD93D] relative shadow-xl">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#FFD93D] text-white px-6 py-2 rounded-full text-xs font-black shadow-md border-2 border-white uppercase tracking-widest">Rewards</div>
                <div className="text-7xl font-black text-[#B38F00]">+{result.points}</div>
                <p className="font-black text-[#B38F00] text-sm opacity-60">STUDY POINTS</p>
              </div>

              <div className="flex items-center justify-center gap-2 text-[#FF477E] font-black bg-[#FFE6EA] px-6 py-2 rounded-full border-2 border-[#FF85A1] shadow-sm">
                <span>🔥</span> {result.combo}日連続コンボ中！
              </div>

              <button
                onClick={() => setMode("SELECT")}
                className="w-full relative h-20 active:scale-95 transition-all"
              >
                <div className="absolute inset-0 bg-[#1D3A2F] rounded-full"></div>
                <div className="absolute inset-x-0 top-0 bottom-2 bg-[#2D5A47] rounded-full border-t-4 border-white/20 flex items-center justify-center text-2xl font-black text-white shadow-lg active:translate-y-1 transition-transform">
                  次のクエストへ 🚀
                </div>
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
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </main>
  );
}
