"use client";

import { useState, useEffect } from "react";
import { saveStudyLog } from "@/app/actions/study";

type Mode = "SELECT" | "TIMER" | "CONFIRM" | "RESULT";

const SUBJECTS = [
  { name: "算数", icon: "📐", color: "bg-blue-100", border: "border-blue-300" },
  { name: "国語", icon: "📖", color: "bg-red-100", border: "border-red-300" },
  { name: "理科", icon: "🧪", color: "bg-green-100", border: "border-green-300" },
  { name: "社会", icon: "🗺️", color: "bg-orange-100", border: "border-orange-300" },
  { name: "論理", icon: "🧩", color: "bg-purple-100", border: "border-purple-300" },
  { name: "作文", icon: "✍️", color: "bg-pink-100", border: "border-pink-300" },
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
    <main className="min-h-screen bg-[#F0FFF9] font-sans text-[#2D5A47] p-4 pb-12 select-none">
      
      {/* ヘッダー：レベル感のあるゲージ風 */}
      <div className="max-w-md mx-auto mb-6 pt-4">
        <div className="flex justify-between items-end mb-1 px-2">
          <span className="text-sm font-bold bg-[#98FFD9] px-3 py-1 rounded-full shadow-sm">Lv.5 見習い探検家</span>
          <span className="text-xs font-bold text-[#8ABBA6]">あと 120分でランクUP!</span>
        </div>
        <div className="h-4 w-full bg-white rounded-full border-2 border-[#98FFD9] overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-[#98FFD9] to-[#7AE7C1] w-[45%] transition-all duration-1000"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto bg-white rounded-[40px] shadow-[0_15px_0_0_rgba(152,255,217,0.3)] border-4 border-[#98FFD9] overflow-hidden transition-all">
        
        {/* --- モード1: 科目選択 (カード形式) --- */}
        {mode === "SELECT" && (
          <div className="p-8">
            <h1 className="text-2xl font-black text-center mb-8 tracking-wider">今日のクエスト！</h1>
            <div className="grid grid-cols-2 gap-4">
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
                  className={`${s.color} ${s.border} border-b-8 active:border-b-0 active:translate-y-1 p-6 rounded-3xl transition-all flex flex-col items-center gap-2 group`}
                >
                  <span className="text-4xl group-hover:scale-125 transition-transform">{s.icon}</span>
                  <span className="font-bold">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- モード2: タイマー (集中モード) --- */}
        {mode === "TIMER" && (
          <div className="p-8 text-center bg-gradient-to-b from-white to-[#F0FFF9]">
            <div className="mb-8">
              <span className="inline-block bg-[#FFB3BA] text-white px-4 py-1 rounded-full text-sm font-bold animate-pulse mb-4">
                QUEST IN PROGRESS...
              </span>
              <h2 className="text-4xl font-black mb-2">{subject}</h2>
            </div>
            
            <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
              <div className="absolute inset-0 border-[12px] border-[#98FFD9] rounded-full opacity-20"></div>
              <div className="absolute inset-0 border-[12px] border-[#98FFD9] rounded-full border-t-transparent animate-spin-slow"></div>
              <div className="text-5xl font-mono font-black">{elapsed}<span className="text-xl">min</span></div>
            </div>

            <p className="text-[#4A7C66] italic mb-8">「全集中！冒険の呼吸！」</p>

            <button
              onClick={() => handleFinish()}
              className="w-full bg-[#FF8B94] hover:bg-[#FF707A] text-white font-black py-5 rounded-[2rem] shadow-[0_8px_0_0_#e66b74] active:shadow-none active:translate-y-2 transition-all text-xl"
            >
              クエスト完了！！ 🏁
            </button>
          </div>
        )}

        {/* --- モード3: 報告 (修正＆メモ) --- */}
        {mode === "CONFIRM" && (
          <div className="p-8">
            <h2 className="text-2xl font-black text-center mb-6 text-[#4A7C66]">冒険の報告書 📝</h2>
            <div className="space-y-6">
              <div className="bg-[#F0FFF9] p-4 rounded-3xl border-2 border-[#98FFD9]">
                <label className="block text-xs font-bold text-[#8ABBA6] mb-2 uppercase tracking-widest text-center">実際にがんばった時間</label>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => setElapsed(Math.max(0, elapsed - 5))} className="w-10 h-10 bg-white rounded-full border-2 border-[#98FFD9] text-2xl font-bold">-</button>
                  <span className="text-4xl font-mono font-black px-4">{elapsed}</span>
                  <button onClick={() => setElapsed(elapsed + 5)} className="w-10 h-10 bg-white rounded-full border-2 border-[#98FFD9] text-2xl font-bold">+</button>
                </div>
              </div>
              <textarea 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="どんな冒険（勉強）をしたかな？"
                className="w-full p-5 rounded-3xl border-2 border-[#98FFD9] bg-[#F0FFF9] focus:outline-none focus:ring-4 focus:ring-[#98FFD9]/30 h-32 placeholder:text-[#A0C4B4]"
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-[#98FFD9] text-[#2D5A47] font-black py-5 rounded-[2rem] shadow-[0_8px_0_0_#7ae7c1] active:shadow-none active:translate-y-2 transition-all text-xl disabled:opacity-50"
              >
                {isSaving ? "レポート送信中..." : "セーブして完了！ ✨"}
              </button>
            </div>
          </div>
        )}

        {/* --- モード4: クリア演出 --- */}
        {mode === "RESULT" && result && (
          <div className="p-10 text-center animate-in zoom-in duration-500">
            <div className="text-7xl mb-6">👑</div>
            <h2 className="text-4xl font-black mb-2 text-[#FFD93D] drop-shadow-md">QUEST CLEAR!</h2>
            <p className="font-bold text-[#4A7C66] mb-8">すごい！レベルアップに一歩近づいたよ！</p>
            
            <div className="bg-[#FFF9E6] p-8 rounded-[3rem] border-4 border-[#FFD93D] relative mb-8">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFD93D] text-white px-4 py-1 rounded-full text-xs font-bold">REWARD</div>
              <div className="text-5xl font-black text-[#B38F00] mb-1">+{result.points}</div>
              <div className="text-sm font-bold text-[#B38F00]">STUDY POINTS</div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[#FF8B94] font-bold mb-8">
              <span>🔥</span>
              <span>{result.combo}日連続コンボ中！</span>
            </div>

            <button
              onClick={() => setMode("SELECT")}
              className="w-full bg-[#2D5A47] text-white font-black py-5 rounded-[2rem] shadow-[0_8px_0_0_#1a3a2d] active:shadow-none active:translate-y-2 transition-all text-xl"
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
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </main>
  );
}
