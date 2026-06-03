"use client";

import { useEffect, useState } from "react";
import { getKnowledgeCards } from "@/app/actions/knowledge";
import { SubjectType } from "@/app/actions/knowledge-generator";

type CardItem = {
  userId: string;
  cardId: string;
  subject: SubjectType;
  title: string;
  titleKana: string; // ★ひらがなタイトルを追加
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
  
  // ★検索キーワード管理用のState
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

  // ★リアルタイム検索フィルタリングロジック
  const filteredCards = cards.filter((card) => {
    // 検索窓が空ならそのまま表示
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    
    // 1. 漢字タイトル、2. ひらがなタイトル、3. 最強の武器、4. パターン名 のどこかに文字が含まれているかチェック
    return (
      card.title.toLowerCase().includes(query) ||
      card.titleKana.toLowerCase().includes(query) ||
      card.content.weapon.toLowerCase().includes(query) ||
      card.content.typicalPatternName.toLowerCase().includes(query)
    );
  });

  const getSubjectBadgeStyle = (sub: SubjectType) => {
    switch (sub) {
      case "math": return "bg-blue-50 text-blue-700 border-blue-200";
      case "japanese": return "bg-red-50 text-red-700 border-red-200";
      case "science": return "bg-green-50 text-green-700 border-green-200";
      case "society": return "bg-orange-50 text-orange-700 border-orange-200";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 my-6">
      {/* ヘッダーエリア */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
          🗂️ study-quest ナレッジ神殿
        </h1>
        <p className="text-slate-500 mt-2">
          これまでに集めた、頭の「ひらめきロジック」コレクション
        </p>
      </div>

      {/* ★コントロールエリア（検索 ＆ タブを綺麗に配置） */}
      <div className="space-y-4 max-w-2xl mx-auto mb-10">
        {/* ひらがな・漢字両方OKな検索窓 */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-xl">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="さがしたい言葉を入力してね（ひらがなでもOK！）"
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm focus:border-indigo-500 focus:outline-none font-medium text-slate-700 placeholder-slate-400 transition-colors text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              クリア
            </button>
          )}
        </div>

        {/* 教科絞り込みタブ */}
        <div className="flex flex-wrap justify-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setSelectedSubject("all")}
            className={`py-2 px-4 rounded-xl font-bold text-sm transition-all ${
              selectedSubject === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🌐 すべて
          </button>
          {[
            { id: "math", label: "📐 算数" },
            { id: "japanese", label: "📖 国語" },
            { id: "science", label: "🧪 理科" },
            { id: "society", label: "🌍 社会" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSubject(tab.id as SubjectType)}
              className={`py-2 px-4 rounded-xl font-bold text-sm transition-all ${
                selectedSubject === tab.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* カードグリッド表示エリア */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-indigo-600 rounded-full" role="status"></div>
          <p className="text-slate-500 mt-2 font-medium">ナレッジカードを展開中...</p>
        </div>
      ) : filteredCards.length === 0 ? ( // ★フィルタリング後の配列を見る
        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-medium">あてはまるナレッジカードが見つからないよ。</p>
          <p className="text-slate-400 text-sm mt-1">言葉を変えて検索するか、新しいカードを作ってみよう！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => ( // ★フィルタリング後のカードを展開
            <div
              key={card.cardId}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl border-2 border-slate-100 hover:border-indigo-100 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer active:scale-[0.98]"
              onClick={() => alert(`「${card.title}」の詳細画面はここから開くよ！`)}
            >
              {card.imageUrl ? (
                <div className="h-40 w-full overflow-hidden bg-slate-50 border-b border-slate-100 relative">
                  <img src={card.imageUrl} alt={card.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="h-2 bg-gradient-to-r from-indigo-400 to-purple-400" />
              )}

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs px-2 py-1 rounded-md border font-bold ${getSubjectBadgeStyle(card.subject)}`}>
                      {card.subject === "math" && "📐 算数"}
                      {card.subject === "japanese" && "📖 国語"}
                      {card.subject === "science" && "🧪 理科"}
                      {card.subject === "society" && "🌍 社会"}
                    </span>
                    <span className="text-xs text-amber-500 font-mono tracking-wider">
                      {card.content.degreeOfAppearance}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {card.title}
                  </h3>
                  
                  {/* 子供向けにふりがなをうっすら仕込んでも可愛いですね */}
                  <p className="text-[10px] text-slate-400 font-mono line-clamp-1 -mt-0.5">
                    {card.titleKana}
                  </p>

                  <p className="text-xs text-slate-400 mt-1 italic font-medium line-clamp-1">
                    型: {card.content.typicalPatternName || "定番パターン"}
                  </p>

                  <p className="text-sm text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {card.content.essence}
                  </p>
                </div>

                <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/60">
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block mb-0.5">
                    ⚔️ 最強の武器
                  </span>
                  <p className="text-xs text-indigo-900 font-bold line-clamp-2">
                    {card.content.weapon}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
