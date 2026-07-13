// ナレッジカード（knowledge / knowledge/new）で使う4科目の定義
export type SubjectType = "math" | "japanese" | "science" | "society";

export const KNOWLEDGE_SUBJECTS: { id: SubjectType; label: string; emoji: string }[] = [
  { id: "math", label: "算数", emoji: "📐" },
  { id: "japanese", label: "国語", emoji: "📖" },
  { id: "science", label: "理科", emoji: "🧪" },
  { id: "society", label: "社会", emoji: "🌍" },
];

export function getKnowledgeSubjectLabel(id: SubjectType, withEmoji = true) {
  const subject = KNOWLEDGE_SUBJECTS.find((s) => s.id === id);
  if (!subject) return "";
  return withEmoji ? `${subject.emoji} ${subject.label}` : subject.label;
}

// 勉強記録（page.tsx / admin / history）で使う7科目の定義。
// アイコン・配色をここに一元化し、ページごとの再定義によるズレを防ぐ
export const STUDY_SUBJECTS = [
  { name: "算数", icon: "📐", color: "#4CC9F0", shadow: "#3A86FF" },
  { name: "国語", icon: "📖", color: "#FF4D6D", shadow: "#C9184A" },
  { name: "理科", icon: "🧪", color: "#72EFDD", shadow: "#208B81" },
  { name: "社会", icon: "🗺️", color: "#FFB703", shadow: "#FB8500" },
  { name: "英語", icon: "🔤", color: "#9B5DE5", shadow: "#5A189A" },
  { name: "論理", icon: "🧩", color: "#B5179E", shadow: "#7209B7" },
  { name: "作文", icon: "✍️", color: "#FF85A1", shadow: "#FF477E" },
];

export const STUDY_SUBJECT_ICONS: Record<string, string> = Object.fromEntries(
  STUDY_SUBJECTS.map((s) => [s.name, s.icon]),
);

export const STUDY_SUBJECT_COLORS: Record<string, string> = Object.fromEntries(
  STUDY_SUBJECTS.map((s) => [s.name, s.color]),
);
