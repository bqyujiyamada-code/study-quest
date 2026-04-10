"use client";

import { useState, useEffect } from "react";
import { getUserStats, saveStudyLog, saveStudyLogAndStats } from "@/app/actions/study";

export default function StudyPage() {
  const [minutes, setMinutes] = useState("");
  const [subject, setSubject] = useState("算数");
  const [memo, setMemo] = useState("");
  const [stats, setStats] = useState({ totalMinutes: 0, totalPoints: 0, totalMoney: 0, combo: 0 });
  const [loading, setLoading] = useState(true);

  const userId = "user-123"; // ユーザーID

  // レベル計算ロジック（単価表示用）
  const level = Math.floor(stats.totalMinutes / 100) + 1;
  const currentLevel = level > 10 ? 10 : level;
  
  // レベル別単価の判定
  const getUnitPrice = (lv: number) => {
    if (lv <= 3) return 0.4;
    if (lv <= 7) return 0.5;
    return 0.6;
  };
  const unitPrice = getUnitPrice(currentLevel);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getUserStats(userId);
      setStats(data as any);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const duration = parseInt(minutes);
    if (isNaN(duration) || duration <= 0) return;

    // 1. 個別のログ保存とポイント・ボーナス計算を実行
    const logResult = await saveStudyLog({
      userId,
      subject,
      duration,
      originalDuration: duration,
      isEdited: false,
      memo,
    });

    if (logResult.success) {
      // 2. 累計ステータスの更新
      const newTotalMinutes = stats.totalMinutes + duration;
      const newTotalPoints = stats.totalPoints + (logResult.points || 0);
      const newTotalMoney = stats.totalMoney + (logResult.earnedMoney || 0);
      const newCombo = logResult.newCombo || 1;

      const statsResult = await saveStudyLogAndStats({
        userId,
        totalMinutes: newTotalMinutes,
        totalPoints: newTotalPoints,
        totalMoney: newTotalMoney,
        combo: newCombo,
      });

      if (statsResult.success) {
        setStats({
          totalMinutes: newTotalMinutes,
          totalPoints: newTotalPoints,
          totalMoney: newTotalMoney,
          combo: newCombo,
        });
        setMinutes("");
        setMemo("");
        alert(`ナイス！ ${logResult.points}ポイント（${logResult.earnedMoney}円）ゲット！ ${logResult.isBonus ? "🔥ボーナス発生！" : ""}`);
      }
    }
  };

  if (loading) return <div className="p-10 text-center">クエスト準備中...</div>;

  return (
    <div className="min-h-screen bg-blue-50 p-4 font-sans">
      {/* ステータスカード */}
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <div>
            <p className="text-xs opacity-80">現在のレベル</p>
            <p className="text-2xl font-black">Lv.{currentLevel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80">れんぞく記録</p>
            <p className="text-xl font-bold">{stats.combo}日目</p>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-4 text-center">
          <div className="border-r">
            <p className="text-gray-500 text-xs mb-1">ためた時間</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalMinutes} <span className="text-sm">分</span></p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">おこづかい（未せいさん）</p>
            <p className="text-2xl font-bold text-blue-600">¥{stats.totalMoney}</p>
          </div>
        </div>

        {/* 単価情報の表示 */}
        <div className="px-6 pb-4 text-center">
          <p className="text-[10px] text-gray-400 bg-gray-100 py-1 rounded-full">
            現在の単価: 1分 = {unitPrice}円 (Lv.4から0.5円にアップ！)
          </p>
        </div>
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4 text-center">今日のぼうけんを記録</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">なにを勉強した？</label>
            <select 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-blue-100 focus:border-blue-400 outline-none"
            >
              <option>算数</option>
              <option>国語</option>
              <option>英語</option>
              <option>理科</option>
              <option>社会</option>
              <option>その他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">何分やった？</label>
            <input 
              type="number" 
              value={minutes} 
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="例: 30"
              className="w-full p-3 rounded-xl border-2 border-blue-100 focus:border-blue-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">ひとことメモ</label>
            <input 
              type="text" 
              value={memo} 
              onChange={(e) => setMemo(e.target.value)}
              placeholder="がんばったことを書こう！"
              className="w-full p-3 rounded-xl border-2 border-blue-100 focus:border-blue-400 outline-none"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg transform active:scale-95 transition-all text-lg"
          >
            クエスト完了！
          </button>
        </div>
      </form>
    </div>
  );
}
