"use server";

import { db } from "@/lib/db";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "StudyQuestLogs";

export async function saveStudyLog(data: {
  userId: string;
  subject: string;
  duration: number;
  originalDuration: number;
  isEdited: boolean;
  memo: string; // ここを追加！
}) {
  const timestamp = new Date().toISOString();
  const today = timestamp.split("T")[0]; 
  const month = today.substring(0, 7);   

  // ポイント計算ロジック（暫定1分=1pt）
  const multiplier = 1.0;
  const points = Math.floor(data.duration * multiplier);

  // TODO: コンボ判定を後ほど実装
  const combo = 1;

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      userId: data.userId,
      timestamp: timestamp,
      month: month,
      date: today,
      subject: data.subject,
      duration: data.duration,
      originalDuration: data.originalDuration,
      isEdited: data.isEdited,
      memo: data.memo, // DBへの保存項目にも追加
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
