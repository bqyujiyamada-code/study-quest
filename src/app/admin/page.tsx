"use client";

import { useEffect, useState } from "react";
import { getUnpaidLogs, executeSettlement } from "@/app/actions/study";

export default function AdminPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = "user-123"; // 娘さんのユーザーID

  // 1. 未精算データの読み込み
  const fetchLogs = async () => {
    setLoading(true);
    const data = await getUnpaidLogs(userId);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 2. 未精算の合計金額を計算
  const totalAmount = logs.reduce((sum, log) => sum + (log.points || 0), 0);

  // 3. 精算実行
  const handleSettlement = async () => {
    if (!confirm(`合計 ${totalAmount}円 の精算を確定しますか？\n娘さんの画面の残高は0円に戻ります。`)) return;

    const result = await executeSettlement(userId, logs);
    if (result.success) {
      alert("精算が完了しました！お疲れ様でした。");
      fetchLogs(); // リストを更新
    } else {
      alert("エラーが発生しました。");
    }
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">パパの承認ダッシュボード</h1>

      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">現在の未精算合計</h2>
        <p className="text-4xl font-black text-blue-600 mt-2">¥{totalAmount.toLocaleString()}</p>
        
        <button
          onClick={handleSettlement}
          disabled={logs.length === 0}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition-colors"
        >
          {logs.length > 0 ? "お小遣いを渡して精算を確定する" : "未精算のデータはありません"}
        </button>
      </div>

      <h2 className="text-lg font-bold mb-4 text-gray-700">未精算の明細（{logs.length}件）</h2>
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.timestamp} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{log.subject}</span>
                <p className="text-gray-800 font-medium mt-2">{log.memo || "メモなし"}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(log.timestamp).toLocaleString("ja-JP")}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-700">{log.duration}分</p>
                <p className="text-sm font-bold text-orange-500">+{log.points}pt {log.isBonus && "🔥"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
