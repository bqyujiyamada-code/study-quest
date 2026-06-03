"use client";

import { useEffect, useState } from "react";
import { getKnowledgeCards } from "@/app/actions/knowledge";
import { SubjectType } from "@/app/actions/knowledge-generator";

type CardItem = {
  userId: string;
  cardId: string;
  subject: SubjectType;
  title: string;
  titleKana: string;
  intro: string;
  imageUrl?: string;
  createdAt: string;
  content: {
    essence: string;
    weapon: string;
    degreeOfAppearance: string;
    typicalPatternName: string;
  };
};

export default function KnowledgeListPage() {
  const [userId] = useState("user_01");
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectType | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCards = async (subjectTag?: SubjectType) => {
    setIsLoading(true);
    const result = await getKnowledgeCards(userId, subjectTag);
    if (result.success) {
      setCards(result.items as CardItem[]);
    } else {
      alert(result.error || "データの読み込みに失敗しちゃった。");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCards(selectedSubject === "all" ? undefined : selectedSubject);
  }, [selectedSubject]);

  const filteredCards = cards.filter((card) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    
    return (
      card.title.toLowerCase().includes(query) ||
      card.titleKana.toLowerCase().includes(query) ||
      card.content.weapon.toLowerCase().includes(query) ||
      card.content.typicalPatternName.toLowerCase().includes(query)
    );
  });

  return (
    /* ★全体を中央寄せにし、左右にスマホ用の余白（padding）を確保 */
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px", boxSizing: "border-box" }}>
      
      {/* ヘッダーエリアも中央寄せに */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1>ナレッジ神殿</h1>
        <p style={{ color: "#666" }}>これまでに集めた、頭の「ひらめきロジック」コレクション</p>
      </div>

      {/* 検索・絞り込み操作エリア */}
      <div style={{ maxWidth: "600px", margin: "0 auto 32px auto", textAlign: "center" }}>
        {/* 検索窓（幅いっぱいに広げる） */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="さがしたい言葉を入力してね（ひらがなでもOK！）"
            style={{ width: "100%", padding: "12px", boxSizing: "border-box" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ flexShrink: 0 }}>クリア</button>
          )}
        </div>

        {/* 教科切り替えタブ（スマホで溢れたら折り返すように flex-wrap を指定） */}
        <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
          <button
            onClick={() => setSelectedSubject("all")}
            style={{ fontWeight: selectedSubject === "all" ? "bold" : "normal", padding: "6px 12px" }}
          >
            すべて
          </button>
          {[
            { id: "math", label: "算数" },
            { id: "japanese", label: "国語" },
            { id: "science", label: "理科" },
            { id: "society", label: "社会" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSubject(tab.id as SubjectType)}
              style={{ fontWeight: selectedSubject === tab.id ? "bold" : "normal", padding: "6px 12px" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* カード一覧エリア（ココが重要！スマホなら1列、PCなら並ぶように flex で調整） */}
      {isLoading ? (
        <div style={{ textAlign: "center" }}><p>ナレッジカードを展開中...</p></div>
      ) : filteredCards.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ color: "#999" }}>あてはまるナレッジカードが見つからないよ。</p>
        </div>
      ) : (
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: "16px", 
          justifyContent: "center" /* カードを中央寄せに並べる */
        }}>
          {filteredCards.map((card) => (
            <div
              key={card.cardId}
              onClick={() => alert(`「${card.title}」の詳細画面はここから開くよ！`)}
              style={{
                border: "1px solid #ccc",
                padding: "16px",
                /* スマホ時は横幅いっぱい（100%）、PCでは大体3台並ぶように flex-basis を調整 */
                width: "100%",
                maxWidth: "340px", 
                boxSizing: "border-box",
                cursor: "pointer",
                borderRadius: "12px", /* 少し角丸にして今風に */
                backgroundColor: "#fff"
              }}
            >
              {/* 画像プレビュー */}
              {card.imageUrl && (
                <div style={{ textAlign: "center", marginBottom: "12px", backgroundColor: "#f9f9f9", borderRadius: "8px", padding: "8px" }}>
                  <img src={card.imageUrl} alt={card.title} style={{ maxWidth: "100%", maxHeight: "150px", objectFit: "contain" }} />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "between", fontSize: "0.8rem", color: "#666", marginBottom: "4px" }}>
                <span>【{card.subject === "math" ? "算数" : card.subject === "japanese" ? "国語" : card.subject === "science" ? "理科" : "社会"}】</span>
                <span style={{ marginLeft: "auto" }}>{card.content.degreeOfAppearance}</span>
              </div>

              <h3 style={{ margin: "4px 0" }}>{card.title}</h3>
              <p style={{ fontSize: "0.75rem", color: "#999", margin: "2px 0" }}>{card.titleKana}</p>
              <p style={{ fontSize: "0.75rem", fontStyle: "italic", color: "#666", margin: "4px 0" }}>型: {card.content.typicalPatternName}</p>
              <p style={{ fontSize: "0.9rem", color: "#333", lineHeight: "1.4" }}>{card.content.essence}</p>

              <div style={{ backgroundColor: "#f0f4f8", padding: "8px", marginTop: "12px", borderRadius: "8px" }}>
                <strong style={{ fontSize: "0.8rem", color: "#1e3a8a" }}>⚔️ 武器: </strong>
                <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#1e3a8a" }}>{card.content.weapon}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
