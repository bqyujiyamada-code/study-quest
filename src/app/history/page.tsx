"use client";

import { useEffect, useState } from "react";
import { getAllStudyLogs } from "@/app/actions/study";
import Link from "next/link";

// 科目ごとのアイコンを定義（英語を追加）
const SUBJECT_ICONS: { [key: string]: string } = {
  "算数": "📐",
  "国語": "📖",
  "理科": "🧪",
  "社会": "🗺️",
  "英語": "🔤", // 追加！
  "論理": "🧩",
  "作文": "✍️",
};

export default function HistoryPage() {
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const userId = "daughter_01";

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      const data = await getAllStudyLogs(userId);
      setAllLogs(data);
      setLoading(false);
    }
    loadHistory();
  }, []);

  const filteredLogs = allLogs.filter(log => log.timestamp.startsWith(selectedMonth));
  const monthlyMinutes = filteredLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const monthlyMoney = filteredLogs.reduce((sum, log) => sum + (log.earnedMoney || 0), 0);
  const monthlyPoints = filteredLogs.reduce((sum, log) => sum + (log.points || 0), 0);

  const displayMonth = parseInt(selectedMonth.split('-')[1], 10);

  if (loading) return <div className="loading">これまでの記録を読み込み中...</div>;

  return (
    <main className="history-container">
      <div className="content-wrapper">
        {/* --- 戻るボタンセクション --- */}
        <nav className="top-nav">
          <Link href="/" className="back-link">
            <span className="icon">⬅</span> 冒険にもどる
          </Link>
        </nav>

        <header className="history-header">
          <h1>冒険のあしあと</h1>
          <div className="month-selector">
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-input"
            />
          </div>
        </header>

        {/* 月間サマリー */}
        <div className="monthly-summary">
          <div className="summary-title">{displayMonth}月の合計</div>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">勉強時間</span>
              <span className="value">{Math.floor(monthlyMinutes / 60)}<small>h</small>{monthlyMinutes % 60}<small>m</small></span>
            </div>
            <div className="summary-item">
              <span className="label">獲得お小遣い</span>
              <span className="value">¥{monthlyMoney.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span className="label">獲得ポイント</span>
              <span className="value">{monthlyPoints}pt</span>
            </div>
          </div>
        </div>

        {/* 履歴リスト */}
        <div className="history-list">
          {filteredLogs.length === 0 ? (
            <div className="empty-state">この月の記録はまだないよ！🚀</div>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={log.timestamp || index} className="history-card">
                <div className="card-left">
                  <div className="date-box">
                    <span className="day">{new Date(log.timestamp).getDate()}</span>
                    <span className="dow">{new Date(log.timestamp).toLocaleDateString("ja-JP", {weekday: "short"})}</span>
                  </div>
                  <div className="log-info">
                    {/* アイコンを表示するように修正 */}
                    <div className="subject-name">
                      {SUBJECT_ICONS[log.subject] || "📝"} {log.subject}
                    </div>
                    <div className="duration-text">{log.duration}分間 冒険した！</div>
                  </div>
                </div>
                <div className="card-right">
                  <div className="money-plus">+¥{log.earnedMoney}</div>
                  {log.isBonus && <div className="bonus-tag">COMBO!</div>}
                  <div className={`status-tag ${log.status === "paid" ? "paid" : "unpaid"}`}>
                    {log.status === "paid" ? "精算済み" : "未精算"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .history-container { min-height: 100vh; background: #fef9e7; padding: 20px; font-family: sans-serif; }
        .content-wrapper { max-width: 450px; margin: 0 auto; }
        
        .top-nav { margin-bottom: 20px; }
        .back-link { 
          display: inline-flex; align-items: center; gap: 8px;
          text-decoration: none; color: #2D5A47; font-weight: 900; font-size: 14px;
          background: white; padding: 8px 16px; border-radius: 50px;
          border: 2px solid #FFD93D; box-shadow: 0 4px 0 #FFD93D;
        }
        .back-link:active { transform: translateY(2px); box-shadow: 0 2px 0 #FFD93D; }

        .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .history-header h1 { font-size: 22px; font-weight: 900; color: #2D5A47; }
        
        .month-input { 
          border: 3px solid #FFD93D; border-radius: 12px; padding: 5px 10px; font-weight: 900; color: #2D5A47; outline: none; background: white;
        }

        .monthly-summary { 
          background: white; border-radius: 25px; padding: 20px; border: 4px solid #FFD93D; box-shadow: 0 6px 0 #FFD93D; margin-bottom: 30px;
        }
        .summary-title { font-size: 14px; font-weight: 900; color: #B38F00; margin-bottom: 12px; text-align: center; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .summary-item { display: flex; flex-direction: column; align-items: center; }
        .summary-item .label { font-size: 10px; color: #aaa; font-weight: bold; margin-bottom: 4px; }
        .summary-item .value { font-size: 16px; font-weight: 900; color: #2D5A47; }
        .summary-item small { font-size: 10px; }

        .history-list { display: flex; flex-direction: column; gap: 12px; }
        .history-card { 
          background: white; border-radius: 18px; padding: 15px; display: flex; justify-content: space-between; align-items: center; border: 2px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .card-left { display: flex; align-items: center; gap: 15px; }
        .date-box { 
          background: #f0fdf4; width: 45px; height: 45px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .date-box .day { font-size: 18px; font-weight: 900; color: #00C951; line-height: 1; }
        .date-box .dow { font-size: 10px; font-weight: 900; color: #8ABBA6; }
        
        .subject-name { font-size: 16px; font-weight: 900; color: #2D5A47; }
        .duration-text { font-size: 12px; color: #8ABBA6; font-weight: bold; }

        .card-right { text-align: right; }
        .money-plus { font-size: 18px; font-weight: 900; color: #FF4D6D; }
        .bonus-tag { font-size: 9px; font-weight: 900; background: #FFD93D; color: #B38F00; padding: 2px 6px; border-radius: 6px; display: inline-block; margin-top: 4px; }
        
        .status-tag { font-size: 9px; font-weight: bold; margin-top: 4px; display: block; }
        .status-tag.paid { color: #8ABBA6; }
        .status-tag.unpaid { color: #FF4D6D; }

        .empty-state { text-align: center; padding: 40px; color: #aaa; font-weight: bold; }
        .loading { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-weight: 900; color: #2D5A47; }
      `}</style>
    </main>
  );
}
