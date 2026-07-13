export type StudyLog = {
  userId: string;
  timestamp: string;
  date: string;
  subject: string;
  duration: number;
  originalDuration: number;
  isEdited: boolean;
  memo: string;
  points: number;
  unitPrice: number;
  earnedMoney: number;
  isBonus: boolean;
  status: "unpaid" | "paid";
  createdAt: string;
  paidAt?: string;
};

export type UserStats = {
  userId: string;
  totalMinutes: number;
  totalPoints: number;
  totalMoney: number;
  combo: number;
  lastDate: string;
  lastUpdated?: string;
  lastSettledAt?: string;
};

// generateKnowledgeCard（knowledge-generator.ts）がAIに生成させるJSONの形。
// LLM出力のため保証はできないが、knowledge/page.tsx側の参照フィールドをまとめておく
export type KnowledgeCardContent = {
  intro?: string;
  essence?: string;
  difference?: string;
  forkInTheRoad?: string;
  weapon?: string;
  degreeOfAppearance?: string;
  keyPoints?: string[];
  logicalSteps?: string[];
  formula?: string;
  formulaDetail?: string;
  typicalPatternName?: string;
  typicalPatternRule?: string;
  reproducibilityTip?: string;
};

// generateLogicLesson（logic-training.ts）がAIに生成させるJSONの形（modeにより形が異なる）
export type LogicEssayItem = {
  composition: string;
  logic_check: string;
  side?: string;
  reason_title?: string;
  reason_point?: string;
};

export type LogicLesson = {
  opinion_example?: string;
  opinion_point?: string;
  opinion_a?: string;
  opinion_b?: string;
  pros_opinion?: string;
  cons_opinion?: string;
  teaching_point?: string;
  clash_points?: { point_title: string; pros_view: string; cons_view: string }[];
  contrast_points?: { point_title: string; desc_a: string; desc_b: string }[];
  reasons?: LogicEssayItem[];
  essays?: LogicEssayItem[];
};
