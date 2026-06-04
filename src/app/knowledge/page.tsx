"use client";

import { useEffect, useState } from "react";
import { getKnowledgeCards } from "@/app/actions/knowledge";
import { SubjectType } from "@/app/actions/knowledge-generator";
import pako from "pako";

type CardItem = {
  userId: string;
  cardId: string;
  subject: SubjectType;
  title: string;
  titleKana: string;
  intro: string;
  imageUrl?: string;
  createdAt: string;
  content: any; 
};

export default function KnowledgeListPage() {
  const [userId] = useState("user_01");
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectType | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

  /**
   * 圧縮されたBase64文字列データを、ブラウザ側で元のJSONオブジェクトに解凍する関数
   */
  const getDecompressedContent = (card: CardItem) => {
    if (typeof card.content === "string") {
      try {
        const binaryString = atob(card.content);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decompressedText = pako.inflate(bytes, { to: "string" });
        return JSON.parse(decompressedText);
      } catch (e) {
        console.error("データの解凍に失敗しちゃいました:", e);
        return null;
      }
    }
    return card.content;
  };

  const fetchCards = async (subjectTag?: SubjectType) => {
    setIsLoading(true);
    const result = await getKnowledgeCards(userId, subjectTag);
    if (result.success) {
      // 読み込み時にあらかじめ全件一括解凍
      const decompressedItems = (result.items as CardItem[]).map(item => ({
        ...item,
        content: getDecompressedContent(item)
      }));
      setCards(decompressedItems);
    } else {
      alert(result.error || "データの読み込みに失敗しちゃった。");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCards(selectedSubject === "all" ? undefined : selectedSubject);
  }, [selectedSubject]);

  // ★【劇的改善】絶対にクラッシュさせない最強のフィルターロジック
  const filteredCards = cards.filter((card) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    
    // card本体の文字列を安全に抽出（null/undefined 対策）
    const title = (card.title || "").toLowerCase();
    const titleKana = (card.titleKana || "").toLowerCase();

    // contentの中身を徹底的に安全チェック（文字列型である場合のみtoLowerCaseをかける）
    const weapon = (card.content && typeof card.content.weapon === "string") 
      ? card.content.weapon.toLowerCase() 
      : "";

    const pattern = (card.content && typeof card.content.typicalPatternName === "string") 
      ? card.content.typicalPatternName.toLowerCase() 
      : "";

    return (
      title.includes(query) ||
      titleKana.includes(query) ||
      weapon.includes(query) ||
      pattern.includes(query)
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
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      
      {/* ヘッダーエリア */}
      <div style={{ textAlign: "center", marginBottom: "24px", marginTop: "12px" }}>
        <h1 style={{ fontSize: "1.8rem", color: "#1e293b", margin: "0 0 8px 0" }}>🔮 ナレッジ神殿</h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>これまでに集めた、頭の「ひらめきロジック」コレクション</p>
      </div>

      {/* 検索・絞り込み操作エリア */}
      <div style={{ maxWidth: "600px", margin: "0 auto 24px auto" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="さがしたい言葉を入力してね（ひらがなもOK！）"
            style={{ width: "100%", padding: "12px 16px", boxSizing: "border-box", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "0.95rem" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ flexShrink: 0, padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", backgroundColor: "#f1f5f9", cursor: "pointer", fontSize: "0.9rem" }}>
              クリア
            </button>
          )}
        </div>

        <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
          <button onClick={() => setSelectedSubject("all")} style={{ padding: "8px 16px", borderRadius: "20px", border: "1px solid #cbd5e1", cursor: "pointer", fontSize: "0.85rem", backgroundColor: selectedSubject === "all" ? "#1e4ed8" : "#fff", color: selectedSubject === "all" ? "#fff" : "#475569", fontWeight: selectedSubject === "all" ? "bold" : "normal" }}>
            すべて
          </button>
          {(["math", "japanese", "science", "society"] as const).map((sub) => (
            <button key={sub} onClick={() => setSelectedSubject(sub)} style={{ padding: "8px 16px", borderRadius: "20px", border: "1px solid #cbd5e1", cursor: "pointer", fontSize: "0.85rem", backgroundColor: selectedSubject === sub ? "#1e4ed8" : "#fff", color: selectedSubject === sub ? "#fff" : "#475569", fontWeight: selectedSubject === sub ? "bold" : "normal" }}>
              {sub === "math" && "算数"}
              {sub === "japanese" && "国語"}
              {sub === "science" && "理科"}
              {sub === "society" && "社会"}
            </button>
          ))}
        </div>
      </div>

      {/* カード一覧エリア */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px" }}><p style={{ color: "#64748b" }}>ナレッジカードを展開中...</p></div>
      ) : filteredCards.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}><p style={{ color: "#94a3b8" }}>あてはまるナレッジカードが見つからないよ。</p></div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center" }}>
          {filteredCards.map((card) => (
            <div
              key={card.cardId}
              onClick={() => setSelectedCard(card)}
              style={{ border: "1px solid #e2e8f0", padding: "14px", width: "100%", maxWidth: "340px", boxSizing: "border-box", cursor: "pointer", borderRadius: "16px", backgroundColor: "#fff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)" }}
            >
              {card.imageUrl && (
                <div style={{ textAlign: "center", marginBottom: "10px", backgroundColor: "#f8fafc", borderRadius: "10px", padding: "6px" }}>
                  <img src={card.imageUrl} alt={card.title} style={{ maxWidth: "100%", maxHeight: "130px", objectFit: "contain" }} />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}>
                <span>{getSubjectLabel(card.subject)}</span>
                <span style={{ color: "#d97706", fontWeight: "bold" }}>{card.content?.degreeOfAppearance || "---"}</span>
              </div>

              <h3 style={{ margin: "2px 0 4px 0", fontSize: "1.1rem", color: "#1e293b", lineHeight: "1.3" }}>{card.title || "無題のカード"}</h3>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0 0 6px 0" }}>{card.titleKana || ""}</p>
              <p style={{ fontSize: "0.75rem", color: "#475569", margin: "0 0 8px 0", fontStyle: "italic" }}>型: {card.content?.typicalPatternName || "未定義"}</p>
              <p style={{ fontSize: "0.85rem", color: "#475569", lineHeight: "1.4", margin: 0, display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {card.content?.essence || "解説データを読み込めませんでした。"}
              </p>

              <div style={{ backgroundColor: "#eff6ff", padding: "8px 12px", marginTop: "12px", borderRadius: "10px", border: "1px solid #dbeafe" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#1e4ed8" }}>⚔️ 武器: {card.content?.weapon || "未定義"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 詳細表示モーダルエリア（極・スマホ最適化版） */}
      {selectedCard && selectedCard.content && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "12px", boxSizing: "border-box" }} onClick={() => setSelectedCard(null)}>
          <div style={{ backgroundColor: "#fff", borderRadius: "20px", width: "100%", maxWidth: "600px", maxHeight: "92vh", overflowY: "auto", padding: "20px", boxSizing: "border-box", position: "relative", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setSelectedCard(null)} style={{ position: "absolute", top: "14px", right: "14px", padding: "8px 14px", cursor: "pointer", borderRadius: "30px", border: "1px solid #e5e7eb", backgroundColor: "#f3f4f6", fontSize: "0.85rem", fontWeight: "bold", color: "#4b5563" }}>
              ✕ とじる
            </button>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginBottom: "12px", marginTop: "12px" }}>
              <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", fontSize: "0.75rem", fontWeight: "bold", padding: "4px 10px", borderRadius: "6px" }}>
                {getSubjectLabel(selectedCard.subject)}
              </span>
              <span style={{ backgroundColor: "#fef3c7", color: "#d97706", fontSize: "0.75rem", fontWeight: "bold", padding: "4px 10px", borderRadius: "6px" }}>
                よく出る度: {selectedCard.content.degreeOfAppearance || "---"}
              </span>
            </div>

            <h2 style={{ margin: "0 0 4px 0", fontSize: "1.4rem", color: "#111827", lineHeight: "1.3" }}>{selectedCard.title}</h2>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: "0 0 16px 0", fontWeight: "medium" }}>{selectedCard.titleKana}</p>

            {selectedCard.imageUrl && (
              <div style={{ textAlign: "center", backgroundColor: "#f9fafb", padding: "8px", borderRadius: "12px", marginBottom: "16px", border: "1px solid #f3f4f6" }}>
                <img src={selectedCard.imageUrl} alt={selectedCard.title} style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }} />
              </div>
            )}

            <div style={{ backgroundColor: "#fff1f2", padding: "14px 16px", borderRadius: "14px", marginBottom: "20px", borderLeft: "5px solid #f43f5e", boxSizing: "border-box" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#9f1239", lineHeight: "1.5", fontWeight: "medium" }}>
                {selectedCard.intro || "解説ロジックを見てみよう！"}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div style={{ border: "1px solid #e5e7eb", padding: "12px 14px", borderRadius: "12px", backgroundColor: "#fff" }}>
                <h4 style={{ margin: "0 0 4px 0", color: "#111827", fontSize: "0.95rem" }}>💡 この問題の本質</h4>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#4b5563", lineHeight: "1.4" }}>{selectedCard.content.essence || "---"}</p>
              </div>
              <div style={{ border: "1px solid #e5e7eb", padding: "12px 14px", borderRadius: "12px", backgroundColor: "#fff" }}>
                <h4 style={{ margin: "0 0 4px 0", color: "#111827", fontSize: "0.95rem" }}>🔍 似たパターンとの違い</h4>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#4b5563", lineHeight: "1.4" }}>{selectedCard.content.difference || "---"}</p>
              </div>
            </div>

            <div style={{ backgroundColor: "#fffbeb", padding: "14px", borderRadius: "14px", marginBottom: "20px", border: "1px solid #fef3c7", borderLeft: "5px solid #d97706" }}>
              <h4 style={{ margin: "0 0 6px 0", color: "#b45309", fontSize: "0.95rem", fontWeight: "bold" }}>⚡ ここが運命の分かれ道！</h4>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#78350f", lineHeight: "1.5" }}>{selectedCard.content.forkInTheRoad || "---"}</p>
            </div>

            <div style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", padding: "14px", borderRadius: "14px", marginBottom: "24px", textAlign: "center", border: "1px solid #a5b4fc" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#4338ca", display: "block", marginBottom: "4px" }}>⚔️ 単元を無双する最強の武器</span>
              <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: "bold", color: "#1e3a8a", lineHeight: "1.4" }}>{selectedCard.content.weapon || "---"}</p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#374151", fontSize: "1rem" }}>🎯 問題文のどこに注目する？</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {selectedCard.content.keyPoints?.map((kp: string, idx: number) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.88rem", color: "#4b5563" }}>
                    <span style={{ color: "#2563eb", fontWeight: "bold" }}>✓</span>
                    <span style={{ lineHeight: "1.4" }}>{kp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#374151", fontSize: "1rem", borderBottom: "2px solid #e5e7eb", paddingBottom: "6px" }}>🪜 解法のロジックステップ</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedCard.content.logicalSteps?.map((stepStr: string, idx: number) => {
                  const cleanStep = stepStr
                    .replace(/^ステップ\s*\d+\s*:\s*/i, "")
                    .replace(/^【(前半|後半)ステージ】\s*Step\s*\d+：\s*/i, "")
                    .replace(/^Step\s*\d+：\s*/i, "");

                  const hasArrow = cleanStep.includes("➔");
                  const hasFormula = cleanStep.includes("【式】：");

                  let titlePart = cleanStep;
                  let reasonPart = "";
                  let formulaPart = "";

                  if (hasArrow && hasFormula) {
                    const parts = cleanStep.split("➔");
                    titlePart = parts[0];
                    const subParts = parts[1].split("【式】：");
                    reasonPart = subParts[0];
                    formulaPart = subParts[1];
                  } else if (hasArrow) {
                    const parts = cleanStep.split("➔");
                    titlePart = parts[0];
                    reasonPart = parts[1];
                  } else if (hasFormula) {
                    const parts = cleanStep.split("【式】：");
                    titlePart = parts[0];
                    formulaPart = parts[1];
                  }

                  const isFirstHalf = idx < 3; 
                  const badgeColor = isFirstHalf ? "#059669" : "#d97706";
                  const badgeBg = isFirstHalf ? "#ecfdf5" : "#fffbeb";

                  return (
                    <div key={idx} style={{ backgroundColor: "#f9fafb", borderRadius: "12px", padding: "12px", border: "1px solid #e5e7eb", boxSizing: "border-box" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                        <span style={{ backgroundColor: badgeBg, color: badgeColor, fontSize: "0.7rem", fontWeight: "bold", padding: "1px 6px", borderRadius: "20px", border: `1px solid ${badgeColor}`, whiteSpace: "nowrap", marginTop: "2px" }}>
                          Step {idx + 1}
                        </span>
                        <strong style={{ fontSize: "0.9rem", color: "#1f2937", lineHeight: "1.3" }}>{titlePart.trim()}</strong>
                      </div>
                      {reasonPart && (
                        <p style={{ margin: "0 0 6px 0", fontSize: "0.82rem", color: "#6b7280", lineHeight: "1.3", paddingLeft: "2px" }}>
                          <span style={{ color: badgeColor, fontWeight: "bold" }}>Q.なぜ？ ➔ </span>{reasonPart.replace(/^なぜなら、/, "").trim()}
                        </p>
                      )}
                      {formulaPart && (
                        <div style={{ backgroundColor: "#fff", borderLeft: `3px solid ${badgeColor}`, padding: "6px 10px", borderRadius: "4px" }}>
                          <span style={{ fontSize: "0.7rem", color: "#9ca3af", display: "block", fontWeight: "bold" }}>🧮 つかう式</span>
                          <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: "bold", color: "#111827", whiteSpace: "pre-wrap" }}>{formulaPart.trim()}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "2px dashed #e5e7eb", paddingTop: "16px" }}>
              {selectedCard.content.formula && (
                <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "bold", display: "block", marginBottom: "4px" }}>📐 必勝公式・フレーム</span>
                  <strong style={{ fontSize: "0.95rem", color: "#334155" }}>{selectedCard.content.formula}</strong>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#475569", lineHeight: "1.4" }}>{selectedCard.content.formulaDetail}</p>
                </div>
              )}
              
              <div style={{ padding: "0 4px" }}>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: "bold", display: "block" }}>🏷️ 典型パターン：{selectedCard.content.typicalPatternName || "未定義"}</span>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#4b5563", lineHeight: "1.4" }}>
                  <span style={{ color: "#dc2626", fontWeight: "bold" }}>📌 絶対ルール：</span>{selectedCard.content.typicalPatternRule || "---"}
                </p>
              </div>

              <div style={{ backgroundColor: "#f0fdf4", padding: "12px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                <span style={{ fontSize: "0.75rem", color: "#166534", fontWeight: "bold", display: "block", marginBottom: "2px" }}>📝 次に同じような問題に出会ったら？</span>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#14532d", lineHeight: "1.4" }}>
                  {selectedCard.content.reproducibilityTip || "---"}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
