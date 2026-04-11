"use client";

import { useEffect, useState } from "react";
import { getUnpaidLogs, executeSettlement } from "@/app/actions/study";

export default function AdminPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const userId = "daughter_01";

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getUnpaidLogs(userId);
    const sortedData = data.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setLogs(sortedData);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const totalAmount = logs.reduce((sum, log) => sum + (log.earnedMoney || 0), 0);

  const handleSettlement = async () => {
    if (logs.length === 0) return;
    if (!confirm(`合計 ${totalAmount}円 の精算を確定しますか？\n娘さんの画面の残高は0円に戻ります。`)) return;

    setIsProcessing(true);
    const result = await executeSettlement(userId, logs);
    if (result.success) {
      alert("精算を完了しました！");
      fetchLogs();
    } else {
      alert("エラーが発生しました。");
    }
    setIsProcessing(false);
  };

  if (loading) return <div className="loading">冒険の書を読み込み中...</div>;

  return (
    <main className="admin-container">
      <div className="content-wrapper">
        <header className="admin-header">
          <h1>管理者ダッシュボード</h1>
          <p>パパ専用：お勉強の承認と精算</p>
        </header>

        {/* 合計金額カード */}
        <div className="summary-card">
          <div className="summary-label">現在の未精算合計</div>
          <div className="summary-amount">
            <span className="unit">¥</span>
            {totalAmount.toLocaleString()}
          </div>
          <button 
            className={`settle-button ${logs.length === 0 ? 'disabled' : ''}`}
            onClick={handleSettlement}
            disabled={logs.length === 0 || isProcessing}
          >
            {isProcessing ? "通信中..." : logs.length > 0 ? "お小遣いを渡してリセット" : "未精算データなし"}
          </button>
        </div>

        <h2 className="list-title">未精算の明細（{logs.length}件）</h2>

        <div className="log-list">
          {logs.map((log) => (
            <div key={log.timestamp} className="log-card">
              <div className="log-header">
                <div className="subject-badge">{log.subject}</div>
                <div className="log-date">
                  {new Date(log.timestamp).toLocaleString("ja-JP", {
                    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </div>
              </div>

              <div className="log-body">
                <div className="log-main">
                  <div className="memo-text">「{log.memo || "（メモなし）"}」</div>
                  
                  {/* 時間編集の表示を分かりやすく */}
                  <div className="time-info">
                    {log.isEdited ? (
                      <div className="edit-badge">
                        <span className="edit-icon">⚠️</span>
                        時間編集あり: 
                        <span className="old-time">{log.originalDuration}分</span> 
                        → <span className="new-time">{log.duration}分</span>
                      </div>
                    ) : (
                      <div className="normal-time">学習時間: {log.duration}分</div>
                    )}
                  </div>
                </div>

                <div className="log-reward">
                  <div className="reward-item">
                    <span className="label">単価:</span> ¥{log.unitPrice}
                  </div>
                  <div className="reward-total">
                    ¥{log.earnedMoney}
                  </div>
                  <div className="reward-points">
                    +{log.points}pt {log.isBonus && "🔥"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .admin-container { min-height: 100vh; background: #f0f4f8; padding: 20px; font-family: sans-serif; }
        .content-wrapper { max-width: 500px; margin: 0 auto; }
        
        .admin-header { text-align: center; margin-bottom: 25px; }
        .admin-header h1 { font-size: 20px; color: #2D5A47; font-weight: 900; margin-bottom: 5px; }
        .admin-header p { font-size: 13px; color: #8ABBA6; font-weight: bold; }

        .summary-card { background: white; border-radius: 25px; padding: 25px; border: 4px solid #98FFD9; box-shadow: 0 8px 0 #98FFD9; text-align: center; margin-bottom: 30px; }
        .summary-label { font-size: 14px; font-weight: 900; color: #8ABBA6; margin-bottom: 10px; }
        .summary-amount { font-size: 48px; font-weight: 900; color: #2D5A47; margin-bottom: 20px; }
        .summary-amount .unit { font-size: 24px; margin-right: 4px; }
        
        .settle-button { width: 100%; padding: 18px; border-radius: 50px; border: none; background: #00C951; color: white; font-size: 18px; font-weight: 900; cursor: pointer; box-shadow: 0 5px 0 #00A644; transition: all 0.2s; }
        .settle-button:active { transform: translateY(3px); box-shadow: 0 2px 0 #00A644; }
        .settle-button.disabled { background: #ccc; box-shadow: 0 5px 0 #aaa; cursor: not-allowed; }

        .list-title { font-size: 16px; font-weight: 900; color: #2D5A47; margin-bottom: 15px; }
        
        .log-list { display: flex; flex-direction: column; gap: 15px; }
        .log-card { background: white; border-radius: 20px; padding: 15px; border: 2px solid #eef2f6; }
        
        .log-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .subject-badge { background: #4CC9F0; color: white; padding: 4px 12px; border-radius: 10px; font-size: 12px; font-weight: 900; }
        .log-date { font-size: 12px; color: #aaa; font-weight: bold; }
        
        .log-body { display: flex; justify-content: space-between; align-items: flex-end; }
        .memo-text { font-size: 15px; font-weight: bold; color: #444; margin-bottom: 10px; }
        
        .time-info { font-size: 13px; }
        .edit-badge { background: #FFF0F3; border: 1px solid #FF4D6D; color: #FF4D6D; padding: 6px 10px; border-radius: 8px; font-weight: bold; }
        .old-time { text-decoration: line-through; opacity: 0.6; margin: 0 4px; }
        .new-time { font-size: 15px; text-decoration: underline; }
        .normal-time { color: #8ABBA6; font-weight: bold; }

        .log-reward { text-align: right; }
        .reward-item { font-size: 11px; color: #aaa; font-weight: bold; }
        .reward-total { font-size: 24px; font-weight: 900; color: #2D5A47; line-height: 1; margin: 4px 0; }
        .reward-points { font-size: 12px; color: #FB8500; font-weight: 900; }

        .loading { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-weight: 900; color: #2D5A47; }
      `}</style>
    </main>
  );
}
