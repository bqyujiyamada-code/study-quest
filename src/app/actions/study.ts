"use server";

import { db } from "@/lib/db";
import { PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "StudyQuestLogs";
const USER_STATUS_TABLE = "UserStatus"; // ユーザー状態を別テーブルにする場合

export async function saveStudyLog(data: {
  userId: string;
  subject: string;
  duration: number;
  originalDuration: number;
  isEdited: boolean;
}) {
  const timestamp = new Date().toISOString();
  const today = timestamp.split("T")[0]; // YYYY-MM-DD
  const month = today.substring(0, 7);   // YYYY-MM

  // --- 1. コンボ判定ロジック ---
  // 本来は UserStatus テーブルから lastStudyDate を取得しますが、
  // シンプルに「最新のログ」を確認する実装例
  let combo = 1;
  let multiplier = 1.0;

  // TODO: ここに前回の日付との比較ロジックを入れる
  // 3日連続 -> 1.2倍 / 7日連続 -> 1.5倍
  
  const points = Math.floor(data.duration * 1.0 * multiplier);

  // --- 2. DynamoDBへの書き込み ---
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      userId: data.userId,
      timestamp: timestamp,
      month: month, // GSI用
      date: today,
      subject: data.subject,
      duration: data.duration,
      originalDuration: data.originalDuration,
      isEdited: data.isEdited,
      points: points,
      combo: combo,
      status: "unpaid",
    },
  });

  try {
    await db.send(command);
    return { success: true, points, combo };
  } catch (error) {
    console.error("DB Save Error:", error);
    return { success: false };
  }
}
