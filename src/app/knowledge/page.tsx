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
    difference: string;
    forkInTheRoad: string;
    weapon: string;
    degreeOfAppearance: string;
    keyPoints: string[];
    logicalSteps: string[];
    formula: string;
    formulaDetail: string;
    typicalPatternName: string;
    typicalPatternRule: string;
    reproducibilityTip: string;
  };
};

export default function KnowledgeListPage() {
  const [userId] = useState("user_01");
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectType | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // ★選択された詳細カードを管理するState（nullならモーダルは閉じている状態）
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

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

  const getSubjectLabel = (sub: SubjectType) => {
    switch (sub) {
      case "math": return "📐 算数";
      case "japanese": return "📖 国語";
      case "science": return "🧪 理科";
      case "society": return "🌍 社会";
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px", boxSizing: "border-box" }}>
      
      {/* ヘッダーエリア */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1>ナレッジ神殿</h1>
        <p style={{ color: "#666" }}>これまでに集めた、頭の「ひらめきロジック」コレクション</p>
      </div>

      {/* 検索・絞り込み操作エリア */}
      <div style={{ maxWidth: "600px", margin: "0 auto 32px auto", textAlign: "center" }}>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="さがしたい言葉を入力してね（ひらがなでもOK！）"
            style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #ccc" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ flexShrink: 0 }}>クリア</button>
          )}
        </div>

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

      {/* カード一覧エリア */}
      {isLoading ? (
        <div style={{ textAlign: "center" }}><p>ナレッジカードを展開中...</p></div>
      ) : filteredCards.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ color: "#999" }}>あてはまるナレッジカードが見つからないよ。</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center" }}>
          {filteredCards.map((card) => (
            <div
              key={card.cardId}
              /* ★クリックしたらStateにカードをセットしてモーダルを開く */
              onClick={() => setSelectedCard(card)}
              style={{
                border: "1px solid #ccc",
                padding: "16px",
                width: "100%",
                maxWidth: "340px", 
                boxSizing: "border-box",
                cursor: "pointer",
                borderRadius: "12px",
                backgroundColor: "#fff"
              }}
            >
              {card.imageUrl && (
                <div style={{ textAlign: "center", marginBottom: "12px", backgroundColor: "#f9f9f9", borderRadius: "8px", padding: "8px" }}>
                  <img src={card.imageUrl} alt={card.title} style={{ maxWidth: "100%", maxHeight: "150px", objectFit: "contain" }} />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#666", marginBottom: "4px" }}>
                <span>{getSubjectLabel(card.subject)}</span>
                <span>{card.content.degreeOfAppearance}</span>
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

      {/* ==================================================================== */}
      {/* ★ 詳細表示モーダルエリア（selectedCard がある時だけ浮き上がる） */}
      {/* ==================================================================== */}
      {selectedCard && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.6)", /* 背景を暗く */
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "16px",
          boxSizing: "border-box"
        }}
        onClick={() => setSelectedCard(null)} /* 背景クリックで閉じる */
        >
          {/* モーダルコンテンツの白い箱（スマホを考慮して縦スクロール可能に） */}
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "640px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            boxSizing: "border-box",
            position: "relative",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
          }}
          onClick={(e) => e.stopPropagation()} /* 白い箱の中のクリックでは閉じないお守り */
          >
            {/* 閉じるボタン */}
            <button 
              onClick={() => setSelectedCard(null)}
              style={{ position: "absolute", top: "16px", right: "16px", padding: "8px 12px", cursor: "pointer", borderRadius: "8px", border: "1px solid #ccc" }}
            >
              ✕ 閉じる
            </button>

            {/* 教科タグと出現度 */}
            <div style={{ display: "flex", gap: "8px", fontSize: "0.9rem", color: "#666", marginBottom: "8px", marginTop: "16px" }}>
              <span>{getSubjectLabel(selectedCard.subject)}</span>
              <span>•</span>
              <span>よく出る度: {selectedCard.content.degreeOfAppearance}</span>
            </div>

            {/* タイトル領域 */}
            <h2 style={{ margin: "0 0 4px 0", fontSize: "1.5rem" }}>{selectedCard.title}</h2>
            <p style={{ fontSize: "0.85rem", color: "#999", margin: "0 0 16px 0" }}>{selectedCard.titleKana}</p>

            {/* 画像（アップロードされていれば大きく表示） */}
            {selectedCard.imageUrl && (
              <div style={{ textAlign: "center", backgroundColor: "#f9f9f9", padding: "12px", borderRadius: "12px", marginBottom: "20px" }}>
                <img src={selectedCard.imageUrl} alt={selectedCard.title} style={{ maxWidth: "100%", maxHeight: "240px", objectFit: "contain" }} />
              </div>
            )}

            {/* 1. AI先生からの導入語りかけ */}
            <div style={{ backgroundColor: "#fdf2f8", padding: "16px", borderRadius: "12px", marginBottom: "20px", borderLeft: "4px solid #ec4899" }}>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "#9d174d", lineHeight: "1.5", fontStyle: "italic" }}>
                {selectedCard.content.intro}
              </p>
            </div>

            {/* 2. この問題の本質 */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 6px 0", color: "#333" }}>💡 この問題の本質</h4>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "#4b5563" }}>{selectedCard.content.essence}</p>
            </div>

            {/* 3. 似た問題との違い */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 6px 0", color: "#333" }}>🔍 似たパターンとの違い</h4>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "#4b5563" }}>{selectedCard.content.difference}</p>
            </div>

            {/* 4. ここが思考の分かれ道！（超重要コア解説） */}
            <div style={{ backgroundColor: "#fffbeb", padding: "16px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #fef3c7" }}>
              <h4 style={{ margin: "0 0 8px 0", color: "#b45309", display: "flex", alignItems: "center", gap: "4px" }}>
                ⚡ ここが運命の分かれ道！
              </h4>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "#78350f", lineHeight: "1.5" }}>
                {selectedCard.content.forkInTheRoad}
              </p>
            </div>

            {/* 5. 最強の武器 */}
            <div style={{ backgroundColor: "#e0e7ff", padding: "16px", borderRadius: "12px", marginBottom: "20px", textAlign: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#4338ca", display: "block", marginBottom: "4px" }}>⚔️ この単元を無双する最強の武器</span>
              <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", color: "#1e3a8a" }}>{selectedCard.content.weapon}</p>
            </div>

            {/* 6. 問題文の注目ポイント（配列の展開） */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 6px 0" }}>🎯 問題文のどこに注目する？</h4>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.95rem", color: "#4b5563" }}>
                {selectedCard.content.keyPoints?.map((kp, idx) => (
                  <li key={idx} style={{ marginBottom: "4px" }}>{kp}</li>
                ))}
              </ul>
            </div>

            {/* 7. 子どもの頭の動きに沿ったロジックステップ（配列の展開） */}
            <div style={{ marginBottom: "20px", backgroundColor: "#f9fafb", padding: "16px", borderRadius: "12px" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#374151" }}>🪜 解法のロジックステップ</h4>
              <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "0.95rem", color: "#4b5563" }}>
                {selectedCard.content.logicalSteps?.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: "8px", lineHeight: "1.4" }}>
                    <strong>ステップ {idx + 1}:</strong> {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* 8. 不変のルール ＆ 次への再現アクション */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#666", fontWeight: "bold" }}>🏷️ 典型パターン名</span>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.95rem", fontWeight: "medium" }}>{selectedCard.content.typicalPatternName}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#666", fontWeight: "bold" }}>📌 数値が変わっても変わらないルール</span>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.95rem", color: "#4b5563" }}>{selectedCard.content.typicalPatternRule}</p>
              </div>
              <div style={{ backgroundColor: "#f0fdf4", padding: "12px", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: "bold" }}>📝 次に同じような問題に出会ったら？</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", color: "#14532d" }}>{selectedCard.content.reproducibilityTip}</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
