"use server";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

// AWSの設定（環境変数は Vercel 等の管理画面で設定してください）
const client = new DynamoDBClient({
  region: "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

/**
 * 1. ユーザーの現在のステータスを取得する
 */
export async function getUserStats(userId: string) {
  try {
    const command = new GetCommand({
      TableName: "UserStats", // 事前にDynamoDBでこのテーブルを作成してください
      Key: { userId },
    });
    const response = await docClient.send(command);
    
    // データがない場合は初期値を返す
    return response.Item || { 
      totalMinutes: 0, 
      totalPoints: 0, 
      totalMoney: 0, 
      combo: 0 
    };
  } catch (error) {
    console.error("DynamoDB Get Error:", error);
    return { totalMinutes: 0, totalPoints: 0, totalMoney: 0, combo: 0 };
  }
}

/**
 * 2. ユーザーステータスを更新（保存）する
 */
export async function saveStudyLogAndStats(data: {
  userId: string;
  totalMinutes: number;
  totalPoints: number;
  totalMoney: number;
  combo: number;
}) {
  try {
    const command = new PutCommand({
      TableName: "UserStats",
      Item: {
        ...data,
        lastUpdated: new Date().toISOString(),
      },
    });
    await docClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("DynamoDB Put Error:", error);
    return { success: false };
  }
}

/**
 * 3. 勉強ログを保存する (既存の処理)
 */
export async function saveStudyLog(data: {
  userId: string;
  subject: string;
  duration: number;
  originalDuration: number;
  isEdited: boolean;
  memo: string;
}) {
  try {
    // ここで StudyLog テーブルに保存する処理を記述
    // ポイント計算ロジック（例: 1分 = 1pt + コンボボーナスなど）
    const basePoints = data.duration;
    const comboBonus = 5; // 仮のボーナス
    const totalPoints = basePoints + comboBonus;

    // ※本来はここでDynamoDBのStudyLogテーブルにPutします
    
    return { 
      success: true, 
      points: totalPoints, 
      combo: 1 // 本来は前回のログを見て計算
    };
  } catch (error) {
    console.error("Save Study Log Error:", error);
    return { success: false };
  }
}
