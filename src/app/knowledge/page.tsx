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
    <div>
      <div>
        <h1>ナレッジ神殿</h1>
        <p>これまでに集めた、頭の「ひらめきロジック」コレクション</p>
      </div>

      {/* 検索・絞り込み操作エリア */}
      <div>
        {/* 検索窓 */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="さがしたい言葉を入力してね（ひらがなでもOK！）"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>クリア</button>
          )}
        </div>

        {/* 教科切り替えタブ */}
        <div style={{ marginTop: "10px" }}>
          <button
            onClick={() => setSelectedSubject("all")}
            style={{ fontWeight: selectedSubject === "all" ? "bold" : "normal", marginRight: "8px" }}
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
              style={{ fontWeight: selectedSubject === tab.id ? "bold" : "normal", marginRight: "8px" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* カード一覧エリア */}
      {isLoading ? (
        <div>
          <p>ナレッジカードを展開中...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div style={{ marginTop: "20px" }}>
          <p>あてはまるナレッジカードが見つからないよ。</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "20px" }}>
          {filteredCards.map((card) => (
            <div
              key={card.cardId}
              onClick={() => alert(`「${card.title}」の詳細画面はここから開くよ！`)}
              style={{
                border: "1px solid #ccc",
                padding: "16px",
                width: "280px",
                cursor: "pointer"
              }}
            >
              {/* 画像プレビュー */}
              {card.imageUrl && (
                <div>
                  <img src={card.imageUrl} alt={card.title} style={{ maxWidth: "100%", height: "auto" }} />
                </div>
              )}

              <div>
                <span>【{card.subject}】</span>
                <span>{card.content.degreeOfAppearance}</span>
              </div>

              <h3>{card.title}</h3>
              <p style={{ fontSize: "0.8rem", color: "#666" }}>{card.titleKana}</p>
              <p style={{ fontSize: "0.8rem", fontStyle: "italic" }}>型: {card.content.typicalPatternName}</p>
              <p>{card.content.essence}</p>

              <div style={{ backgroundColor: "#f0f4f8", padding: "8px", marginTop: "8px" }}>
                <strong>武器: </strong>
                <span>{card.content.weapon}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
