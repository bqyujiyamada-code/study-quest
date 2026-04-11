"use client";

import { useEffect, useState } from "react";
import { getUnpaidLogs, executeSettlement } from "@/app/actions/study";

export default function AdminPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const userId = "daughter_01"; // ユーザーIDを統一

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getUnpaidLogs(userId);
    // 降順（新しい順）に並び替え
    const sortedData = data.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setLogs(sortedData);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 1. 合計金額の計算（study.tsで保存したearnedMoneyを使用）
  const totalAmount = logs.reduce((sum, log) => sum + (log.earnedMoney || 0), 0);
  const totalPoints = logs.reduce((sum, log) => sum + (log.points || 0), 0);

  const handleSettlement = async () => {
    if (logs.length === 0) return;
    if (!confirm(`合計 ${totalAmount}円 の精算を確定しますか？\n娘さんの画面の残高は0円に戻ります。`)) return;

    setIsProcessing(true);
    const result = await executeSettlement(userId, logs);
    if (result.success) {
      alert("精算を完了しました！お小遣いを渡してあげてください。");
      fetchLogs();
    } else {
      alert("エラーが発生しました。");
    }
    setIsProcessing(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 font-medium">パパ専用：お勉強承認と精算</p>
        </div>
        <div className="text-right text-xs text-gray-400 font-mono">
          User: {userId}
        </div>
      </header>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">未精算の報酬合計</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-blue-600">¥{totalAmount.toLocaleString()}</span>
            <span className="text-gray-400 font-bold">({totalPoints} pt)</span>
          </div>
          
          <button
            onClick={handleSettlement}
            disabled={logs.length === 0 || isProcessing}
            className={`w-full mt-6 py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 ${
              logs.length > 0 
                ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-100" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isProcessing ? "通信中..." : logs.length > 0 ? "お小遣いを渡してリセット" : "未精算データなし"}
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-center">
          <p className="text-blue-100 text-sm font-bold opacity-80">未精算のクエスト数</p>
          <p className="text-4xl font-black mt-1">{logs.length} <small className="text-lg">件</small></p>
          <p className="mt-4 text-xs leading-relaxed text-blue-100 opacity-70">
            ※精算ボタンを押すと、すべての明細が「済」になり、娘さんの画面の合計金額が0円に戻ります。
          </p>
        </div>
      </div>

      {/* 明細リスト */}
      <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
        未精算の明細
        <span className="text-sm bg-gray-200 px-2 py-0.5 rounded-md text-gray-500">{logs.length}</span>
      </h2>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold">未精算の勉強ログはありません ☕️</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.timestamp} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner">
                    {/* 科目に応じたアイコン（SUBJECTSから引けない場合を考慮） */}
                    {log.subject === "算数" ? "📐" : log.subject === "国語" ? "📖" : "📝"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-800">{log.subject}</span>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        単価 ¥{log.unitPrice || 0.4}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm font-medium mt-1">{log.memo || "（メモなし）"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono text-gray-300">
                        {new Date(log.timestamp).toLocaleString("ja-JP")}
                      </span>
                      {log.isEdited && (
                        <span className="text-[10px] bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded font-bold border border-amber-100">
                          時間編集あり
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-gray-50">
                  <div className="text-left md:text-right">
                    <p className="text-sm font-bold text-gray-400">{log.duration} 分</p>
                    <p className="text-lg font-black text-gray-700">+{log.points} <small className="text-xs">pt</small></p>
                  </div>
                  <div className="bg-blue-50 px-4 py-2 rounded-xl text-right">
                    <p className="text-xs font-bold text-blue-400 uppercase leading-none mb-1">報酬</p>
                    <p className="text-xl font-black text-blue-600 leading-none">¥{log.earnedMoney || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
