"use client";

import { useState, useEffect } from "react";
import { saveStudyLog } from "@/app/actions/study";

type Mode = "SELECT" | "TIMER" | "CONFIRM" | "RESULT";

const SUBJECTS = [
  { name: "算数", icon: "📐", colors: "from-[#80CAFF] to-[#1E88E5]", glow: "shadow-[0_0_30px_5px_rgba(30,136,229,0.5)]" },
  { name: "国語", icon: "📖", colors: "from-[#FF92A5] to-[#D81B60]", glow: "shadow-[0_0_30px_5px_rgba(216,27,96,0.5)]" },
  { name: "理科", icon: "🧪", colors: "from-[#66ED9A] to-[#00897B]", glow: "shadow-[0_0_30px_5px_rgba(0,137,123,0.5)]" },
  { name: "社会", icon: "🗺️", colors: "from-[#FFC978] to-[#EF6C00]", glow: "shadow-[0_0_30px_5px_rgba(239,108,0,0.5)]" },
  { name: "論理", icon: "🧩", colors: "from-[#D699FF] to-[#8E24AA]", glow: "shadow-[0_0_30px_5px_rgba(142,36,170,0.5)]" },
  { name: "作文", icon: "✍️", colors: "from-[#FF94E1] to-[#D81B60]", glow: "shadow-[0_0_30px_5px_rgba(216,27,96,0.5)]" },
];

// ぷにぷにボタンの共通クラス：弾力性のあるcubic-bezierを追加
const PUNI_BTN = "transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] active:scale-90 active:translate-y-1";

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
    <main className="min-h-screen bg-[#05111B] font-sans text-white p-4 pb-12 relative overflow-hidden">
      {/* 背景のキラキラパーティクルアニメーション：画面全体に漂わせる */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full animate-float opacity-30 ${i % 3 === 0 ? 'bg-[#98FFD9]' : i % 3 === 1 ? 'bg-[#FFB3BA]' : 'bg-[#FFF9CC]'}`}
            style={{
              width: `${Math.random() * 8 + 2}px`,
              height: `${Math.random() * 8 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 10}s`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>
      
      {/* レベルゲージ：ネオン・グロウ化 */}
      <div className="max-w-md mx-auto mb-8 pt-4 relative z-10">
        <div className="bg-white/5 backdrop-blur-xl p-3 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-white/10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFD93D] to-[#FFB200] flex items-center justify-center shadow-[0_0_15px_rgba(255,217,61,0.7)] border-2 border-white/50 text-white font-black text-2xl drop-shadow-md">5</div>
          <div className="flex-1">
            <p className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-white/80 to-white/40 tracking-wider">見習い探検家</p>
            <div className="h-4 w-full bg-[#1A2632] rounded-full mt-2 shadow-inner relative overflow-hidden border border-[#334155]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#66ED9A] to-[#00C951] w-[45%] rounded-full animate-pulse shadow-[0_0_20px_#66ED9A]"></div>
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
      {/* グラスモルフィズム：透明感のあるコンテナ */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/15 overflow-hidden transition-all duration-500 ease-out p-8">
        
        {/* --- モード1: 科目選択 --- */}
        {mode === "SELECT" && (
          <div className="space-y-10">
            <h1 className="text-4xl font-black text-center mb-10 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#A0C4B4] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">今日のクエスト</h1>
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
                  className={`relative ${PUNI_BTN} ${s.glow} group rounded-3xl`}
                >
                  {/* ボタン本体：ぷにぷに質感を出す多重インナーシャドウ */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${s.colors} shadow-[inset_0_4px_4px_rgba(255,255,255,0.3),inset_0_-4px_4px_rgba(0,0,0,0.3),0_10px_0_0_rgba(255,255,255,0.1)]`}></div>
                  {/* 光沢（ハイライト） */}
                  <div className="absolute top-2 left-6 right-6 h-6 rounded-full bg-white/20 blur-[2px]"></div>
                  {/* コンテンツ */}
                  <div className="relative p-7 flex flex-col items-center gap-4 text-white z-10">
                    <span className="text-6xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 ease-out drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]">{s.icon}</span>
                    <span className="font-black text-xl tracking-wider drop-shadow-sm">{s.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- モード2: タイマー --- */}
        {mode === "TIMER" && (
          <div className="text-center space-y-12">
            <div>
              <span className="inline-block bg-[#FFB3BA] text-white px-6 py-2 rounded-full text-xs font-black animate-pulse shadow-[0_0_20px_5px_rgba(255,179,186,0.6)] border-2 border-white tracking-widest">
                冒険中！
              </span>
              <h2 className="text-6xl font-black mt-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#FFB3BA]">{subject}</h2>
            </div>
            
            {/* 新・ネオンタイマー：光の輪を強調 */}
            <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
              {/* 外側のネオン管のような光 */}
              <div className="absolute inset-0 rounded-full shadow-[0_0_50px_10px_rgba(152,255,217,0.7)] border-4 border-[#98FFD9]"></div>
              {/* 回転するグラデーションリング */}
              <div className="absolute inset-0 rounded-full border-[12px] border-transparent border-t-[#00C951] border-r-[#66ED9A] animate-spin-slow shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]"></div>
              {/* 中央の時間表示 */}
              <div className="text-7xl font-mono font-black text-[#98FFD9] drop-shadow-[0_0_15px_#98FFD9]">{elapsed}<span className="text-2xl ml-1 opacity-70">min</span></div>
            </div>

            <p className="text-[#A0C4B4] italic text-xl opacity-80 animate-pulse">「全集中！がんばれー！」 🔥</p>

            <button
              onClick={() => handleFinish()}
              className={`w-full ${PUNI_BTN} bg-gradient-to-br from-[#FF92A5] to-[#D81B60] shadow-[0_15px_40px_rgba(216,27,96,0.7),inset_0_4px_4px_rgba(255,255,255,0.3),inset_0_-4px_4px_rgba(0,0,0,0.3)] text-white font-black py-7 rounded-full text-3xl border-2 border-white/80 tracking-widest`}
            >
              クエスト完了！！ 🏁
            </button>
          </div>
        )}

        {/* --- モード3: 報告 --- */}
        {mode === "CONFIRM" && (
          <div className="space-y-10">
            <h2 className="text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-[#98FFD9] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">報告の時間 📝</h2>
            <div className="space-y-8">
              {/* ぷるるん時間修正フィールド */}
              <div className="bg-[#CCFFEF]/10 p-7 rounded-[3rem] border-2 border-[#98FFD9]/40 shadow-[0_0_30px_rgba(152,255,217,0.2),inset_0_0_15px_rgba(0,0,0,0.5)]backdrop-blur-xl">
                <label className="block text-sm font-black text-[#98FFD9] mb-4 uppercase tracking-widest text-center drop-shadow-sm">がんばった時間（分）</label>
                <div className="flex items-center justify-center gap-7">
                  <button onClick={() => setElapsed(Math.max(0, elapsed - 5))} className={`${PUNI_BTN} w-16 h-16 bg-gradient-to-br from-white to-[#A0C4B4] rounded-full border-4 border-[#98FFD9]/60 text-4xl font-black text-[#2D5A47] shadow-[0_5px_15px_rgba(0,0,0,0.3)] flex items-center justify-center`}>-</button>
                  <span className="text-7xl font-mono font-black px-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-[#98FFD9] drop-shadow-[0_0_15px_#98FFD9]">{elapsed}</span>
                  <button onClick={() => setElapsed(elapsed + 5)} className={`${PUNI_BTN} w-16 h-16 bg-gradient-to-br from-white to-[#A0C4B4] rounded-full border-4 border-[#98FFD9]/60 text-4xl font-black text-[#2D5A47] shadow-[0_5px_15px_rgba(0,0,0,0.3)] flex items-center justify-center`}>+</button>
                </div>
              </div>
              <textarea 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="どんな冒険（勉強）をしたかな？"
                className="w-full p-7 rounded-[3rem] border-2 border-white/10 bg-[#05111B]/80 focus:outline-none focus:ring-4 focus:ring-[#98FFD9]/30 h-40 placeholder:text-white/30 shadow-inner text-xl text-white backdrop-blur-md"
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full ${PUNI_BTN} bg-gradient-to-br from-[#66ED9A] to-[#00897B] shadow-[0_15px_40px_rgba(0,137,123,0.7),inset_0_4px_4px_rgba(255,255,255,0.3),inset_0_-4px_4px_rgba(0,0,0,0.3)] text-white font-black py-7 rounded-full text-3xl border-2 border-white/80 tracking-widest disabled:opacity-50 disabled:shadow-none`}
              >
                {isSaving ? "レポート送信中..." : "セーブして完了！ ✨"}
              </button>
            </div>
          </div>
        )}

        {/* --- モード4: クリア演出 --- */}
        {mode === "RESULT" && result && (
          <div className="p-4 text-center animate-in zoom-in duration-700 space-y-10 relative">
            {/* キラキラアニメーションを重ねる */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="absolute rounded-full bg-[#FFD93D] animate-ping" style={{
                  width: `${Math.random() * 6 + 2}px`,
                  height: `${Math.random() * 6 + 2}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDuration: `${Math.random() * 1 + 0.5}s`,
                }}></div>
              ))}
            </div>
            
            <div className="text-9xl animate-wiggle">👑</div>
            <h2 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#FFD93D] to-[#EF6C00] drop-shadow-[0_0_20px_rgba(255,217,61,0.5)]">QUEST CLEAR!</h2>
            
            {/* リワードカード：ネオン・グロウ */}
            <div className="bg-gradient-to-br from-[#1A2632]/80 to-[#101923]/80 backdrop-blur-xl p-12 rounded-[4rem] border-4 border-[#FFD93D] relative shadow-[0_20px_60px_rgba(255,217,61,0.4)]">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#FFD93D] text-white px-8 py-3 rounded-full text-sm font-black shadow-lg border-2 border-white tracking-widest drop-shadow-sm">報酬獲得！</div>
              <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFD93D] to-[#EF6C00] drop-shadow-[0_0_15px_rgba(255,217,61,0.6)] mb-2">+{result.points}</div>
              <div className="text-xl font-bold text-[#FF9F1A] tracking-wider drop-shadow-sm">STUDY POINTS</div>
            </div>

            <div className="flex items-center justify-center gap-3 text-[#FF3B5C] bg-[#FFE6EA]/10 inline-block px-8 py-3 rounded-full font-black shadow-[0_0_15px_rgba(255,59,92,0.3)] border border-[#FF92A5]/50 backdrop-blur-md">
              <span className="animate-bounce">🔥</span>
              <span>{result.combo}日連続コンボ中！</span>
            </div>

            <button
              onClick={() => setMode("SELECT")}
              className={`w-full ${PUNI_BTN} bg-gradient-to-br from-white/20 to-white/5 shadow-[0_10px_20px_rgba(255,255,255,0.05),inset_0_4px_4px_rgba(255,255,255,0.2),inset_0_-4px_4px_rgba(0,0,0,0.1)] text-white font-black py-7 rounded-full text-3xl border-2 border-white/50 tracking-widest backdrop-blur-lg`}
            >
              次のクエストへ 🚀
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-100vh) translateX(${Math.random() * 200 - 100}px); opacity: 0; }
        }
        .animate-float {
          animation: float linear infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
        .animate-bounce {
          animation: bounce 1s infinite;
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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </main>
  );
}
