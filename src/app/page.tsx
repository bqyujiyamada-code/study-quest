export default function Home() {
  return (
    <main className="min-h-screen bg-[#F0FFF9] flex flex-col items-center justify-center p-8">
      {/* メインカード */}
      <div className="bg-white p-10 rounded-3xl shadow-lg border-4 border-[#98FFD9] max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-[#2D5A47] mb-6">
          スタディ・クエスト
        </h1>
        
        <p className="text-lg text-[#4A7C66] mb-8 leading-relaxed">
          ここは、論理的に考える力を育てる冒険の場所です。<br />
          ワクワクする問いに挑戦して、自分だけの答えを見つけよう！
        </p>

        {/* ボタンのエリア（今後リンクを増やせます） */}
        <div className="grid grid-cols-1 gap-4">
          <button className="bg-[#98FFD9] hover:bg-[#7AE7C1] text-[#2D5A47] font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-md">
            今日の論理パズルをはじめる
          </button>
          <button className="bg-white border-2 border-[#98FFD9] hover:bg-[#F0FFF9] text-[#4A7C66] font-bold py-4 px-8 rounded-full transition-all duration-300">
            作文ログをのこす
          </button>
        </div>
      </div>

      <footer className="mt-12 text-[#8ABBA6] text-sm">
        © 2026 Study Quest - Powered by Papa
      </footer>
    </main>
  );
}
