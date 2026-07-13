// このアプリは単一ユーザー（家族内利用）前提のため認証機構を持たず、
// 各ページでuserIdをハードコーディングしている。用途ごとに意図的に別IDを使っているため
// 値そのものは統一しないが、5箇所に分散していたリテラルをここに集約する。
export const STUDY_USER_ID = "daughter_01"; // 勉強記録・レベル・お小遣い（page.tsx / admin / history）
export const KNOWLEDGE_USER_ID = "user_01"; // ナレッジカード（knowledge / knowledge/new）
