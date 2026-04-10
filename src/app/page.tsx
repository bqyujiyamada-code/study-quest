"use client";

import { useState, useEffect } from "react";
import { saveStudyLog } from "@/app/actions/study";

type Mode = "SELECT" | "TIMER" | "CONFIRM" | "RESULT";

export default function Home() {
  const [mode, setMode] = useState<Mode>("SELECT");
  const [subject, setSubject] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0); // 分単位
  const [memo, setMemo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{points: number, combo: number} | null>(null);

  // 1. ページ読み込み時に保存されたタイマーを復元
  useEffect(() => {
    const stored = localStorage.getItem("currentStudy");
    if (stored) {
      const { subject, startTime } = JSON.parse(stored);
      setSubject(subject);
      setStartTime(startTime);
      setMode("TIMER");
    }
  }, []);

  // 2. タイマーのカウントアップ
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === "TIMER" && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - startTime) / 1000 / 60);
        
        if (diff >= 180) { // 3時間セーフガード
          handleFinish(180);
          alert("3時間経過したので一度ストップしたよ！");
        } else {
          setElapsed(diff);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, startTime]);

  // 3. 計測終了 -> 確認画面へ
  const handleFinish = (finalMinutes?: number) => {
    const timeToSet = finalMinutes !== undefined ? finalMinutes : elapsed;
    setElapsed(timeToSet);
    setMode("CONFIRM");
    localStorage.removeItem("currentStudy");
  };

  // 4. DB保存処理
  const handleSave = async () => {
    setIsSaving(true);
    const original = startTime ? Math.floor((Date.now() - startTime) / 1000 / 60) : elapsed;
    
    const res = await saveStudyLog({
      userId: "daughter_01", // 固定（後で認証導入可）
      subject,
      duration: elapsed,
      originalDuration: original,
      isEdited: elapsed !== original,
      memo
    });

    if (res.success) {
      setResult({ points: res.points!, combo: res.combo! });
      setMode("RESULT");
    } else {
      alert("保存に失敗しちゃった。パパに教えてね！");
    }
    setIsSaving(false);
  };

  const reset = () => {
    setMode("SELECT");
    setSubject("");
    setStartTime(null);
    setElapsed(0);
    setMemo("");
    setResult(null);
  };

  return (
    <main className="min-h-screen bg-[#F0FFF9] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-lg border-4 border-[#98FFD9] max-w-md w-full text-center">
        
        {/* --- モード1: 科目選択 --- */}
        {mode === "SELECT" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-[#2D5A47]">スタディ・クエスト</h1>
            <p className="text-[#4A7C66]">どの冒険に出かける？</p>
            <div className="grid grid-cols-2 gap-3">
              {["算数", "国語", "理科", "社会", "論理", "作文"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSubject(s);
                    const now = Date.now();
                    setStartTime(now);
                    setMode("TIMER");
                    localStorage.setItem("currentStudy", JSON.stringify({ subject: s, startTime: now }));
                  }}
                  className="bg-[#E6FFF4] hover:bg-[#98FFD9] text-[#2D5A47] py-4 rounded-xl border-2 border-[#98FFD9] font-bold transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- モード2: タイマー中 --- */}
        {mode === "TIMER" && (
          <div className="space-y-6">
            <div className="bg-[#98FFD9]/20 py-8 rounded-2xl">
              <p className="text-[#2D5A47] font-bold text-xl mb-2">{subject}のクエスト中！</p>
              <p className="text-6xl font-mono font-bold text-[#2D5A47]">{elapsed}<span className="text-2xl ml-1">min</span></p>
            </div>
            <div className="text-[#4A7C66] animate-bounce">✨ 集中バフ発動中！ ✨</div>
            <button
              onClick={() => handleFinish()}
              className="w-full bg-[#FFB3BA] hover:bg-[#FF8B94] text-[#702D2D] font-bold py-4 rounded-full shadow-md"
            >
              クエスト完了！報告する
            </button>
          </div>
        )}

        {/* --- モード3: 確認・修正 --- */}
        {mode === "CONFIRM" && (
          <div className="space-y-6 text-left">
            <h2 className="text-2xl font-bold text-[#2D5A47] text-center">クエスト確認</h2>
            <div>
              <label className="block text-sm text-[#4A7C66] mb-1">勉強した時間（分）</label>
              <input 
                type="number" 
                value={elapsed} 
                onChange={(e) => setElapsed(Number(e.target.value))}
                className="w-full p-3 border-2 border-[#98FFD9] rounded-xl text-center text-2xl font-bold text-[#2D5A47]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#4A7C66] mb-1">今日の内容メモ</label>
              <textarea 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="例：計算ドリル5ページ"
                className="w-full p-3 border-2 border-[#98FFD9] rounded-xl"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-[#98FFD9] hover:bg-[#7AE7C1] text-[#2D5A47] font-bold py-4 rounded-full disabled:bg-gray-200"
            >
              {isSaving ? "セーブ中..." : "この内容でセーブする！"}
            </button>
          </div>
        )}

        {/* --- モード4: リザルト --- */}
        {mode === "RESULT" && result && (
          <div className="space-y-6">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-[#2D5A47]">CLEAR!</h2>
            <div className="bg-[#FFF9E6] p-6 rounded-2xl border-2 border-[#FFD93D]">
              <p className="text-[#4A7C66] text-sm mb-1">獲得ポイント</p>
              <p className="text-4xl font-bold text-[#B38F00]">{result.points} pt</p>
              <p className="text-sm text-[#B38F00] mt-2">コンボボーナス！ ({result.combo}日連続)</p>
            </div>
            <button
              onClick={reset}
              className="w-full bg-[#98FFD9] text-[#2D5A47] font-bold py-4 rounded-full"
            >
              次のクエストへ
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
