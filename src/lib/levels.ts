// 累計勉強時間（分）からレベル・ランク名・お小遣い単価を判定する唯一の定義。
// 画面表示（現在のレベル・単価）とサーバー側の精算計算（study.ts）の両方から参照し、
// 表示と実際の支払いが食い違わないようにする。
export const RANK_MASTER = [
  { lv: 1, h: 0, name: "見習い探検家" },
  { lv: 2, h: 10, name: "基礎固めの門下生" },
  { lv: 3, h: 30, name: "論理の初段" },
  { lv: 4, h: 60, name: "適性検査の挑戦者" },
  { lv: 5, h: 100, name: "集中力の達人" },
  { lv: 6, h: 150, name: "開成チャレンジャー" },
  { lv: 7, h: 210, name: "思考の魔術師" },
  { lv: 8, h: 280, name: "記述の鉄人" },
  { lv: 9, h: 360, name: "論理の賢者" },
  { lv: 10, h: 450, name: "絶対合格の守護神" },
];

export function getLevelInfo(totalMinutes: number) {
  const hours = totalMinutes / 60;
  const currentRankIdx = RANK_MASTER.slice()
    .reverse()
    .findIndex((r) => hours >= r.h);
  const currentRank =
    RANK_MASTER[RANK_MASTER.length - 1 - (currentRankIdx === -1 ? 0 : currentRankIdx)];
  const nextRank = RANK_MASTER.find((r) => r.lv === currentRank.lv + 1);

  let progress = 100;
  let remainingText = "MAX LEVEL";
  if (nextRank) {
    const currentLvMin = currentRank.h * 60;
    const nextLvMin = nextRank.h * 60;
    progress = Math.min(100, ((totalMinutes - currentLvMin) / (nextLvMin - currentLvMin)) * 100);
    remainingText = `あと ${nextLvMin - totalMinutes} 分で Lv.${nextRank.lv}`;
  }

  return { ...currentRank, progress, remainingText };
}

export function getRate(lv: number) {
  return lv >= 8 ? 0.6 : lv >= 4 ? 0.5 : 0.4;
}

export function getUnitPrice(totalMinutes: number) {
  return getRate(getLevelInfo(totalMinutes).lv);
}
