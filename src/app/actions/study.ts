"use server";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-northeast-1" });
const docClient = DynamoDBDocumentClient.from(client);

// ユーザーのステータスを取得する
export async function getUserStats(userId: string) {
  try {
    const command = new GetCommand({
      TableName: "UserStats",
      Key: { userId },
    });
    const response = await docClient.send(command);
    return response.Item || { totalMinutes: 0, totalPoints: 0, totalMoney: 0, combo: 0 };
  } catch (error) {
    console.error("Fetch error:", error);
    return { totalMinutes: 0, totalPoints: 0, totalMoney: 0, combo: 0 };
  }
}

// 勉強ログ保存と同時にステータスを更新する（簡略化版）
export async function saveStudyLogAndStats(data: any) {
  // 本来はStudyLogテーブルへの保存とTransactionを組むのが理想ですが、
  // 今回はUserStatsの更新にフォーカスします
  try {
    const command = new PutCommand({
      TableName: "UserStats",
      Item: {
        userId: data.userId,
        totalMinutes: data.totalMinutes,
        totalPoints: data.totalPoints,
        totalMoney: data.totalMoney,
        combo: data.combo,
        lastUpdated: new Date().toISOString(),
      },
    });
    await docClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("Save error:", error);
    return { success: false };
  }
}
