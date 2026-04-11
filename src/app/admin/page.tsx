"use client";

import { useEffect, useState } from "react";
import { getUnpaidLogs, executeSettlement, getAllStudyLogs } from "@/app/actions/study";

export default function AdminPage() {
  const [unpaidLogs, setUnpaidLogs] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const userId = "daughter_01";

  const fetchData = async () => {
    setLoading(true);
    // 未精算ログと全履歴を同時に取得
    const [unpaid, all] = await Promise.all([
      getUnpaidLogs(userId),
      getAllStudyLogs(userId)
    ]);
    
    setUnpaidLogs(unpaid.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setAllLogs(all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. 未精算の合計金額
  const unpaidTotalAmount = unpaidLogs.reduce((sum, log) => sum + (log.earnedMoney || 0), 0);

  // 2. 選択された月のフィルタリング
  const filteredLogs = allLogs.filter(log => log.timestamp.startsWith(selectedMonth));

  // 3. 選択された月のサマリー計算
  const monthlyMinutes = filteredLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const monthlyMoney = filteredLogs.reduce((sum, log) => sum + (log.earnedMoney || 0), 0);
  const monthlyPoints = filteredLogs.reduce((sum, log) => sum + (log.points || 0), 0);

  const handleSettlement = async () => {
    if (unpaidLogs.length === 0) return;
    if (!confirm(`合計 ${unpaidTotalAmount}円 の精算を確定しますか？\n娘さんの画面の残高は0円に戻ります。`)) return;

    setIsProcessing(true);
    const result = await executeSettlement(userId, unpaidLogs);
    if (result.success) {
      alert("精算を完了しました！");
      fetchData();
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

        {/* --- セクション1: 未精算の精算 --- */}
        <div className="summary-card">
          <div className="summary-label">現在の未精算合計</div>
          <div className="summary-amount">
            <span className="unit">¥</span>
            {unpaidTotalAmount.toLocaleString()}
          </div>
          <button 
            className={`settle-button ${unpaidLogs.length === 0 ? 'disabled' : ''}`}
            onClick={handleSettlement}
            disabled={unpaidLogs.length === 0 || isProcessing}
          >
            {isProcessing ? "通信中..." : unpaidLogs.length > 0 ? "お小遣いを渡してリセット" : "未精算データなし"}
          </button>
        </div>

        {/* --- セクション2: 月間レポート --- */}
        <div className="history-section">
          <div className="section-header">
            <h2 className="list-title">月間レポート・履歴</h2>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-input"
            />
          </div>

          <div className="monthly-stats-grid">
            <div className="stat-box">
              <span className="label">勉強時間</span>
              <span className="value">{Math.floor(monthlyMinutes / 60)}<small>h</small>{monthlyMinutes % 60}<small>m</small></span>
            </div>
            <div className="stat-box">
              <span className="label">獲得合計</span>
              <span className="value">¥{monthlyMoney.toLocaleString()}</span>
            </div>
            <div className="stat-box">
              <span className="label">総ポイント</span>
              <span className="value">{monthlyPoints}pt</span>
            </div>
          </div>

          <div className="log-list">
            {filteredLogs.length === 0 ? (
              <div className="empty-state">この月の記録はありません</div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.timestamp} className={`log-card ${!log.unpaid ? 'settled' : ''}`}>
                  <div className="log-header">
                    <div className="header-left">
                      <div className="subject-badge">{log.subject}</div>
                      {!log.unpaid && <span className="settled-badge">精算済</span>}
                    </div>
                    <div className="log-date">
                      {new Date(log.timestamp).toLocaleString("ja-JP", {
                        month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  </div>

                  <div className="log-body">
                    <div className="log-main">
                      <div className="memo-text">「{log.memo || "（メモなし）"}」</div>
                      <div className="time-info">
                        {log.isEdited ? (
                          <div className="edit-badge">
                            ⚠️ {log.originalDuration}分 → <span className="new-time">{log.duration}分</span>
                          </div>
                        ) : (
                          <div className="normal-time">学習時間: {log.duration}分</div>
                        )}
                      </div>
                    </div>
                    <div className="log-reward">
                      <div className="reward-total">¥{log.earnedMoney}</div>
                      <div className="reward-points">+{log.points}pt</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-container { min-height: 100vh; background: #f0f4f8; padding: 20px; font-family: sans-serif; color: #2D5A47; }
        .content-wrapper { max-width: 500px; margin: 0 auto; }
        
        .admin-header { text-align: center; margin-bottom: 25px; }
        .admin-header h1 { font-size: 20px; font-weight: 900; margin-bottom: 5px; }
        .admin-header p { font-size: 13px; color: #8ABBA6; font-weight: bold; }

        /* 未精算カード */
        .summary-card { background: white; border-radius: 25px; padding: 25px; border: 4px solid #98FFD9; box-shadow: 0 8px 0 #98FFD9; text-align: center; margin-bottom: 40px; }
        .summary-label { font-size: 14px; font-weight: 900; color: #8ABBA6; margin-bottom: 5px; }
        .summary-amount { font-size: 48px; font-weight: 900; margin-bottom: 15px; }
        .summary-amount .unit { font-size: 24px; margin-right: 4px; }
        .settle-button { width: 100%; padding: 18px; border-radius: 50px; border: none; background: #00C951; color: white; font-size: 18px; font-weight: 900; cursor: pointer; box-shadow: 0 5px 0 #00A644; }
        .settle-button:active { transform: translateY(3px); box-shadow: 0 2px 0 #00A644; }
        .settle-button.disabled { background: #ccc; box-shadow: 0 5px 0 #aaa; cursor: not-allowed; }

        /* 月間履歴セクション */
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .list-title { font-size: 18px; font-weight: 900; }
        .month-input { border: 2px solid #FFD93D; border-radius: 10px; padding: 5px 8px; font-weight: 900; color: #2D5A47; outline: none; }

        .monthly-stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .stat-box { background: #fff; padding: 12px 5px; border-radius: 15px; text-align: center; border: 2px solid #FFD93D; }
        .stat-box .label { font-size: 10px; color: #8ABBA6; font-weight: 900; display: block; }
        .stat-box .value { font-size: 14px; font-weight: 900; }
        .stat-box small { font-size: 9px; }

        /* 履歴リスト */
        .log-list { display: flex; flex-direction: column; gap: 12px; }
        .log-card { background: white; border-radius: 20px; padding: 15px; border: 2px solid #eef2f6; transition: opacity 0.3s; }
        .log-card.settled { opacity: 0.7; background: #fafafa; }
        
        .log-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .header-left { display: flex; gap: 8px; align-items: center; }
        .subject-badge { background: #4CC9F0; color: white; padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 900; }
        .settled-badge { font-size: 10px; color: #8ABBA6; font-weight: 900; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
        .log-date { font-size: 11px; color: #aaa; font-weight: bold; }
        
        .log-body { display: flex; justify-content: space-between; align-items: flex-end; }
        .memo-text { font-size: 14px; font-weight: bold; color: #444; margin-bottom: 8px; }
        
        .edit-badge { background: #FFF0F3; border: 1px solid #FF4D6D; color: #FF4D6D; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; }
        .new-time { text-decoration: underline; }
        .normal-time { color: #8ABBA6; font-size: 12px; font-weight: bold; }

        .log-reward { text-align: right; }
        .reward-total { font-size: 20px; font-weight: 900; color: #2D5A47; }
        .reward-points { font-size: 11px; color: #FB8500; font-weight: 900; }

        .empty-state { text-align: center; padding: 30px; color: #aaa; font-weight: bold; background: white; border-radius: 20px; border: 2px dashed #eee; }
        .loading { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-weight: 900; }
      `}</style>
    </main>
  );
}
